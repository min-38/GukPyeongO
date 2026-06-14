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

// /api/score 응답: 채점 결과 + 등급 서명 토큰 (댓글 작성 시 등급 신뢰용)
export interface ScoreResponse extends ScoreResult {
  gradeToken: string;
}

// 관리자 화면용 문제 형태 (정답 포함 — 인증된 관리자에게만 노출)
export interface AdminQuestion extends PublicQuestion {
  answerIndex: number;
}

// 댓글
export const MAX_COMMENT_LENGTH = 300;

export interface Comment {
  id: string;
  content: string;
  grade: number;
  createdAt: string;
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

// 등급별 시각 테마 (결과 화면 표현용 — 컬러/이모지/한줄평)
export interface GradeTheme {
  color: string; // 큰 등급 숫자·강조 컬러
  emoji: string;
  blurb: string; // 가벼운 한줄평 (모욕 금지)
}

const GRADE_THEMES: Record<number, GradeTheme> = {
  1: { color: "#f59e0b", emoji: "🏆", blurb: "검색 없이 이 정도면 진짜 고수." },
  2: { color: "#10b981", emoji: "🎉", blurb: "공지문 정도는 가뿐하네요." },
  3: { color: "#14b8a6", emoji: "✨", blurb: "사흘이 며칠인지 확실히 아는 사람." },
  4: { color: "#6366f1", emoji: "🙂", blurb: "안정권. 살짝만 더 가면 상위권." },
  5: { color: "#7c3aed", emoji: "😐", blurb: "딱 평균, 그래서 국평오." },
  6: { color: "#f97316", emoji: "😅", blurb: "가끔 헷갈리는 그 느낌 아니까." },
  7: { color: "#fb7185", emoji: "😬", blurb: "'금일'에서 한 번 흔들렸죠?" },
  8: { color: "#ef4444", emoji: "🫠", blurb: "공지문이 좀 어려웠나 봐요." },
  9: { color: "#dc2626", emoji: "😭", blurb: "괜찮아요, 다시 도전하면 됩니다." },
};

export function gradeTheme(grade: number): GradeTheme {
  return GRADE_THEMES[grade] ?? GRADE_THEMES[5];
}
