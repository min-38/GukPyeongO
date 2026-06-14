import {
  GRADE_TITLES,
  type QuestionType,
  type ScoreRequestItem,
  type ScoreResult,
  type TypeStat,
} from "./quiz";

// 채점에 필요한 문제별 정답 정보 (route handler가 서버 전용 데이터에서 주입)
export interface AnswerKeyEntry {
  type: QuestionType;
  answerIndex: number;
}

export type AnswerKey = Record<string, AnswerKeyEntry>;

// 맞힌 개수(0~total)를 1~9 등급으로 환산한다.
// 만점에 가까울수록 1등급, 적게 맞힐수록 9등급.
export function gradeForCorrect(correct: number, total: number): number {
  if (total <= 0) return 9;
  const ratio = correct / total;
  // 9개 구간으로 균등 분할. ratio가 높을수록 좋은(낮은) 등급.
  const grade = 9 - Math.floor(ratio * 9);
  return Math.min(9, Math.max(1, grade));
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
    const isCorrect = item != null && item.choiceIndex === key.answerIndex;
    if (isCorrect) {
      stat.correct += 1;
      correctCount += 1;
    }
    if (item != null && item.choiceIndex !== null && item.reactionMs > 0) {
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
