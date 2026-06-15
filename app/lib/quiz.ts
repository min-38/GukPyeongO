// 문제 유형: 공지문, 한자어, 시간 표현, 혼동 표현
export type QuestionType = "notice" | "hanja" | "time" | "confusable";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  notice: "공지문",
  hanja: "한자어",
  time: "시간 표현",
  confusable: "혼동 표현",
};

// 문제 형식: 객관식(보기 선택) / 단답형(직접 입력)
export type QuestionFormat = "multiple_choice" | "short_answer";

export const QUESTION_FORMAT_LABELS: Record<QuestionFormat, string> = {
  multiple_choice: "객관식",
  short_answer: "단답형",
};

// 클라이언트로 내려보내도 되는 문제 형태 (정답 제외)
// short_answer는 choices가 비어 있고 정답은 서버에만 존재한다.
export interface PublicQuestion {
  id: string;
  type: QuestionType;
  format: QuestionFormat;
  prompt: string;
  choices: string[];
  timeLimitSec: number;
}

// 채점 요청: 문제별 사용자의 선택/입력과 반응속도
export interface ScoreRequestItem {
  questionId: string;
  choiceIndex: number | null; // 객관식 선택 (null = 미응답)
  text: string | null; // 단답형 입력 (null = 미응답)
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
// answerIndex는 객관식 정답, answers는 단답형 허용 정답 목록.
export interface AdminQuestion extends PublicQuestion {
  answerIndex: number;
  answers: string[];
}

// 문제별 통계 (맞춘 사람 수·정답률) — 공개 노출용, 정답은 포함하지 않는다.
export interface QuestionStat {
  id: string;
  type: QuestionType;
  prompt: string;
  attempts: number;
  correctCount: number;
  correctRate: number; // 0~100 정수 (attempts가 0이면 0)
}

// 댓글
export const MAX_COMMENT_LENGTH = 300;

export interface Comment {
  id: string;
  content: string;
  grade: number;
  createdAt: string;
}

// 문제 오류 신고
export const REPORT_REASONS = [
  "정답이 이상해요",
  "오타·표현 오류",
  "문제가 모호해요",
  "기타",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const MAX_REPORT_DETAIL_LENGTH = 200;

export interface Report {
  id: string;
  questionId: string;
  reason: string;
  detail: string | null;
  status: "open" | "resolved";
  createdAt: string;
}

// 관리자 신고 목록용 (어떤 문제인지 prompt 동봉)
export interface AdminReport extends Report {
  questionPrompt: string;
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
