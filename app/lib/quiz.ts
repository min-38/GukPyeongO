// 문제 유형: 공지문, 한자어, 시간 표현, 혼동 표현
export type QuestionType = "notice" | "hanja" | "time" | "confusable";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  notice: "공지문",
  hanja: "한자어",
  time: "시간 표현",
  confusable: "혼동 표현",
};

// 클라이언트로 내려보내도 되는 문제 형태 (정답 제외)
export interface PublicQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  choices: string[];
  timeLimitSec: number;
}
