import {
  GRADE_TITLES,
  type QuestionFormat,
  type QuestionType,
  type ScoreRequestItem,
  type ScoreResult,
  type TypeStat,
} from "./quiz";

// 채점에 필요한 문제별 정답 정보 (route handler가 서버 전용 데이터에서 주입)
export interface AnswerKeyEntry {
  type: QuestionType;
  format: QuestionFormat;
  answerIndex: number; // 객관식 정답 인덱스
  answers: string[]; // 단답형 허용 정답 목록
}

export type AnswerKey = Record<string, AnswerKeyEntry>;

// 단답형 비교용 정규화: 앞뒤/내부 공백 제거 + 소문자화.
// "2일 뒤" == "2일뒤", "Today" == "today" 처럼 관대하게 채점한다.
function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

// 띄어쓰기 비교용 정규화: 띄어쓰기가 정답 기준이므로 공백을 제거하지 않는다.
// 앞뒤 공백 제거 + 중복 공백 1칸 + 소문자화만 적용한다.
function normalizeSpacing(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

// 한 문항의 응답 여부와 정답 여부를 형식에 맞게 판정한다.
function judge(
  key: AnswerKeyEntry,
  item: ScoreRequestItem | undefined,
): { answered: boolean; correct: boolean } {
  if (!item) return { answered: false, correct: false };
  if (key.format === "short_answer" || key.format === "spacing") {
    const text = item.text;
    if (text == null || text.trim().length === 0)
      return { answered: false, correct: false };
    const norm =
      key.format === "spacing" ? normalizeSpacing(text) : normalize(text);
    const correct = key.answers.some((a) =>
      key.format === "spacing"
        ? normalizeSpacing(a) === norm
        : normalize(a) === norm,
    );
    return { answered: true, correct };
  }
  // multiple_choice
  if (item.choiceIndex === null) return { answered: false, correct: false };
  return { answered: true, correct: item.choiceIndex === key.answerIndex };
}

// 달성 비율(0~1)을 1~9 등급으로 환산한다. 만점에 가까울수록 1등급.
// v1(맞힌 개수)과 v2(획득 점수)가 같은 경계값을 쓰도록 여기 한 곳에 둔다.
function gradeForRatio(ratio: number): number {
  // 9개 구간으로 균등 분할. ratio가 높을수록 좋은(낮은) 등급.
  const grade = 9 - Math.floor(ratio * 9);
  return Math.min(9, Math.max(1, grade));
}

// v1 — 맞힌 개수(0~total) 기준.
export function gradeForCorrect(correct: number, total: number): number {
  if (total <= 0) return 9;
  return gradeForRatio(correct / total);
}

// v2 등급컷 (#89). 하루 만점이 100점으로 고정돼 있어(편성 단계에서 강제) 점수를 그대로 읽는다.
// 균등 분할(9등분)로 두면 "88.9점부터 1등급" 같은 수가 나와 화면에 적을 수가 없다.
// 수능 등급컷을 본떠 상위 구간을 촘촘히, 하위를 넓게 잡는다 — 중간 등급에서 변별이 생긴다.
// GRADE_CUTS[i] = (i+1)등급이 되는 최소 점수.
export const GRADE_CUTS = [90, 83, 73, 63, 49, 37, 27, 20, 0] as const;

// 등급을 받으려면 몇 점이 필요한지. 화면 안내용.
export function scoreForGrade(grade: number): number {
  return GRADE_CUTS[Math.min(9, Math.max(1, grade)) - 1];
}

// 등급 분포 막대의 한 칸 (#95). 축은 득점률(0~100)이고 경계는 GRADE_CUTS를 그대로 쓴다.
// 등급 폭이 고르지 않은 것(9등급 20%p, 2등급 7%p)은 등급컷 자체가 그런 것이라 그대로 보여준다.
export interface GradeSegment {
  grade: number;
  from: number; // 이 등급이 시작되는 득점률 (포함)
  to: number; // 다음 등급이 시작되는 득점률 (미포함, 1등급은 100)
}

export function gradeSegments(): GradeSegment[] {
  return GRADE_CUTS.map((from, i) => ({
    grade: i + 1,
    from,
    to: i === 0 ? 100 : GRADE_CUTS[i - 1],
  }));
}

// v2 — 획득 점수 ÷ 만점 기준 (#89).
// 난이도별 배점이 1/3/8로 벌어져 있어 개수로 세면 킬러 문항의 무게가 사라진다.
export function gradeForScore(score: number, maxScore: number): number {
  if (maxScore <= 0) return 9;
  const percent = (score / maxScore) * 100;
  const index = GRADE_CUTS.findIndex((cut) => percent >= cut);
  return index === -1 ? 9 : index + 1;
}

// 문항별 응답/정답 여부 (통계 집계용). 정답 내용은 노출하지 않는다.
export interface PerQuestionResult {
  questionId: string;
  answered: boolean;
  correct: boolean;
}

export function perQuestionResults(
  answerKey: AnswerKey,
  items: ScoreRequestItem[],
): PerQuestionResult[] {
  const submitted = new Map(items.map((it) => [it.questionId, it]));
  return Object.entries(answerKey).map(([questionId, key]) => {
    const { answered, correct } = judge(key, submitted.get(questionId));
    return { questionId, answered, correct };
  });
}

export function scoreSubmission(
  answerKey: AnswerKey,
  items: ScoreRequestItem[],
): ScoreResult {
  const submitted = new Map(items.map((it) => [it.questionId, it]));

  const typeMap = new Map<QuestionType, TypeStat>();
  let correctCount = 0;
  let reactionSum = 0;
  let reactionCount = 0;

  for (const [questionId, key] of Object.entries(answerKey)) {
    const stat = typeMap.get(key.type) ?? {
      type: key.type,
      correct: 0,
      total: 0,
    };
    stat.total += 1;

    const item = submitted.get(questionId);
    const { answered, correct } = judge(key, item);
    if (correct) {
      stat.correct += 1;
      correctCount += 1;
    }
    if (item != null && answered && item.reactionMs > 0) {
      reactionSum += item.reactionMs;
      reactionCount += 1;
    }

    typeMap.set(key.type, stat);
  }

  const totalCount = Object.keys(answerKey).length;
  const typeStats = [...typeMap.values()];

  // 취약 유형: 유형별 정답률 50% 미만, 정답률 낮은 순
  const weakTypes = typeStats
    .filter((s) => s.total > 0 && s.correct / s.total < 0.5)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)
    .map((s) => s.type);

  const grade = gradeForCorrect(correctCount, totalCount);

  return {
    grade,
    title: GRADE_TITLES[grade] ?? "",
    correctCount,
    totalCount,
    avgReactionMs:
      reactionCount > 0 ? Math.round(reactionSum / reactionCount) : 0,
    weakTypes,
    typeStats,
  };
}
