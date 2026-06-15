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

// 한 문항의 응답 여부와 정답 여부를 형식에 맞게 판정한다.
function judge(
  key: AnswerKeyEntry,
  item: ScoreRequestItem | undefined
): { answered: boolean; correct: boolean } {
  if (!item) return { answered: false, correct: false };
  if (key.format === "short_answer") {
    const text = item.text;
    if (text == null || text.trim().length === 0)
      return { answered: false, correct: false };
    const norm = normalize(text);
    const correct = key.answers.some((a) => normalize(a) === norm);
    return { answered: true, correct };
  }
  // multiple_choice
  if (item.choiceIndex === null) return { answered: false, correct: false };
  return { answered: true, correct: item.choiceIndex === key.answerIndex };
}

// 맞힌 개수(0~total)를 1~9 등급으로 환산한다.
// 만점에 가까울수록 1등급, 적게 맞힐수록 9등급.
export function gradeForCorrect(correct: number, total: number): number {
  if (total <= 0) return 9;
  const ratio = correct / total;
  // 9개 구간으로 균등 분할. ratio가 높을수록 좋은(낮은) 등급.
  const grade = 9 - Math.floor(ratio * 9);
  return Math.min(9, Math.max(1, grade));
}

// 문항별 응답/정답 여부 (통계 집계용). 정답 내용은 노출하지 않는다.
export interface PerQuestionResult {
  questionId: string;
  answered: boolean;
  correct: boolean;
}

export function perQuestionResults(
  answerKey: AnswerKey,
  items: ScoreRequestItem[]
): PerQuestionResult[] {
  const submitted = new Map(items.map((it) => [it.questionId, it]));
  return Object.entries(answerKey).map(([questionId, key]) => {
    const { answered, correct } = judge(key, submitted.get(questionId));
    return { questionId, answered, correct };
  });
}

export function scoreSubmission(
  answerKey: AnswerKey,
  items: ScoreRequestItem[]
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
    avgReactionMs: reactionCount > 0 ? Math.round(reactionSum / reactionCount) : 0,
    weakTypes,
    typeStats,
  };
}
