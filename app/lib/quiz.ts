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

// 채점 요청: 문제별 사용자의 선택과 반응속도
export interface ScoreRequestItem {
  questionId: string;
  choiceIndex: number | null; // null = 미응답/시간초과
  reactionMs: number;
}

// 유형별 정답 통계 (취약 유형 산출 근거)
export interface TypeStat {
  type: QuestionType;
  correct: number;
  total: number;
}

// 채점 결과를 테스트 화면 → 결과 페이지로 전달하는 sessionStorage 키
export const RESULT_STORAGE_KEY = "gukpyeongo:result";

// 채점 결과
export interface ScoreResult {
  grade: number; // 1~9
  title: string;
  correctCount: number;
  totalCount: number;
  avgReactionMs: number;
  weakTypes: QuestionType[];
  typeStats: TypeStat[];
}

// 등급별 칭호 (톤앤매너: 놀리되 모욕하지 않기)
export const GRADE_TITLES: Record<number, string> = {
  1: "국평오 정복자",
  2: "공지문 마스터",
  3: "사흘 완벽 이해",
  4: "금일 안정권",
  5: "딱 평균, 국평오",
  6: "가끔 흔들리는 중",
  7: "금일에서 흔들림",
  8: "공지문 생존 위기",
  9: "사흘 피해자 모임",
};
