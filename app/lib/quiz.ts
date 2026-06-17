// 문제 유형 키. 유형은 DB(question_types)에서 관리되므로 임의 문자열을 허용한다.
// 아래 QUESTION_TYPE_LABELS는 내장(기본) 유형의 fallback 라벨이며, DB 라벨이 우선한다.
export type QuestionType = string;

// 내장 유형 fallback 라벨 (DB 조회 전/실패 시 사용). DB의 question_types가 정본이다.
export const QUESTION_TYPE_LABELS: Record<string, string> = {
  notice: "공지문",
  hanja: "한자어",
  time: "시간 표현",
  confusable: "혼동 표현",
  idiom: "사자성어",
  reading: "독해",
};

// DB로 관리되는 유형 정의 (관리자 유형 관리 + 공개 라벨/이모지 표시용)
export interface QuestionTypeDef {
  key: string;
  label: string;
  emoji: string;
  sortOrder: number;
}

// 유형 키 → 라벨 해석 (DB 맵 우선, 내장 fallback, 최후엔 키 그대로)
export function resolveTypeLabel(
  type: string,
  labels?: Record<string, string>
): string {
  return labels?.[type] ?? QUESTION_TYPE_LABELS[type] ?? type;
}

// 문제 형식: 객관식(보기 선택) / 단답형(직접 입력) / 띄어쓰기(문장 교정)
export type QuestionFormat = "multiple_choice" | "short_answer" | "spacing";

export const QUESTION_FORMAT_LABELS: Record<QuestionFormat, string> = {
  multiple_choice: "객관식",
  short_answer: "단답형",
  spacing: "띄어쓰기",
};

// 한 응시당 문제 풀에서 무작위로 출제하는 문제 수
export const QUIZ_SIZE = 10;

// 문제 난이도: 1=쉬움, 2=보통, 3=어려움
export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "쉬움",
  2: "보통",
  3: "어려움",
};

// 한 세트의 난이도 목표 분포. 합은 QUIZ_SIZE와 같게 유지한다.
// 이 분포로 층화 출제해 매 응시의 난이도 구성이 일정하도록 보장한다.
export const DIFFICULTY_MIX: Record<number, number> = { 1: 3, 2: 4, 3: 3 };

// 테스트 모드: 빠른(10문제) / 정밀(30문제). 두 모드 모두 난이도 3:4:3 비율을 유지한다.
export type QuizMode = "quick" | "deep";

export interface QuizModeConfig {
  label: string;
  emoji: string;
  size: number; // 출제 문항 수
  mix: Record<number, number>; // 난이도 분포 (합 = size)
  tagline: string; // 모드 선택 화면 한 줄 소개
  estimate: string; // 예상 소요 시간
}

export const QUIZ_MODES: Record<QuizMode, QuizModeConfig> = {
  quick: {
    label: "빠른 테스트",
    emoji: "⚡",
    size: QUIZ_SIZE, // 10
    mix: DIFFICULTY_MIX, // 3 / 4 / 3
    tagline: "가볍게 내 등급만 빠르게",
    estimate: "약 2~3분",
  },
  deep: {
    label: "정밀 테스트",
    emoji: "🎯",
    size: 30,
    mix: { 1: 9, 2: 12, 3: 9 }, // 9 / 12 / 9 — 동일 비율, 3배
    tagline: "더 많은 문제로 정확하게",
    estimate: "약 7~8분",
  },
};

export const DEFAULT_QUIZ_MODE: QuizMode = "quick";

export function isQuizMode(value: unknown): value is QuizMode {
  return value === "quick" || value === "deep";
}

// Fisher-Yates 셔플 (원본 불변)
function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 난이도별 목표 분포(mix)에 맞춰 size개를 출제한다.
//  · 난이도 보장: 풀이 충분하면 쉬움/보통/어려움이 mix 비율대로 섞인다.
//  · 유형 분산: 매 선택마다 지금까지 가장 적게 뽑힌 유형을 우선해 한 유형 쏠림을 막는다.
//  · 부족 보정: 특정 난이도 문제가 모자라면 남은 문제로 채워 항상 size개(풀이 충분할 때)를 채운다.
export function pickStratified<T extends { type: string; difficulty: number }>(
  pool: readonly T[],
  size: number,
  mix: Record<number, number>
): T[] {
  // 난이도별 후보 큐 (사전 셔플로 동일 유형·난이도 내 순서도 무작위)
  const byDifficulty = new Map<number, T[]>();
  for (const q of shuffle(pool)) {
    const list = byDifficulty.get(q.difficulty) ?? [];
    list.push(q);
    byDifficulty.set(q.difficulty, list);
  }

  const picked: T[] = [];
  const typeCount = new Map<string, number>();

  // 후보 목록에서 현재 가장 적게 뽑힌 유형의 문제 1개를 꺼낸다(꺼낸 항목은 제거).
  const takeDiverse = (candidates: T[]): T | undefined => {
    if (candidates.length === 0) return undefined;
    let bestIdx = 0;
    let bestCount = Infinity;
    for (let i = 0; i < candidates.length; i++) {
      const c = typeCount.get(candidates[i].type) ?? 0;
      if (c < bestCount) {
        bestCount = c;
        bestIdx = i;
      }
    }
    const [chosen] = candidates.splice(bestIdx, 1);
    typeCount.set(chosen.type, (typeCount.get(chosen.type) ?? 0) + 1);
    return chosen;
  };

  // 1차: 난이도 목표만큼 채운다
  for (const [difficulty, want] of Object.entries(mix)) {
    const candidates = byDifficulty.get(Number(difficulty)) ?? [];
    for (let i = 0; i < want && picked.length < size; i++) {
      const q = takeDiverse(candidates);
      if (q) picked.push(q);
    }
  }

  // 2차: 부족분(난이도 풀이 모자랐던 경우)을 남은 전체에서 채운다
  if (picked.length < size) {
    const rest: T[] = [];
    for (const list of byDifficulty.values()) rest.push(...list);
    while (picked.length < size) {
      const q = takeDiverse(rest);
      if (!q) break;
      picked.push(q);
    }
  }

  // 난이도 순으로 나열되지 않도록 최종 셔플
  return shuffle(picked);
}

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

// 문항별 내 정답 여부 (결과 화면 표시용 — 정답 내용은 포함하지 않음)
export interface QuestionResult {
  questionId: string;
  correct: boolean;
}

// /api/score 응답: 채점 결과 + 등급 서명 토큰 + 문항별 내 정답 여부
// typeLabels: 유형 키 → 라벨 맵 (취약 유형 표시용, DB 라벨 반영)
export interface ScoreResponse extends ScoreResult {
  gradeToken: string;
  perQuestion: QuestionResult[];
  typeLabels: Record<string, string>;
}

// 결과 화면이 sessionStorage에서 읽는 형태: 채점 응답 + 응시한 테스트 모드.
// mode는 결과/인증샷에 "빠른/정밀 테스트"를 표시하기 위해 함께 저장한다.
export interface StoredResult extends ScoreResponse {
  mode: QuizMode;
}

// 관리자 화면용 문제 형태 (정답 포함 — 인증된 관리자에게만 노출)
// answerIndex는 객관식 정답, answers는 단답형 허용 정답 목록.
export interface AdminQuestion extends PublicQuestion {
  answerIndex: number;
  answers: string[];
  difficulty: number; // 1=쉬움, 2=보통, 3=어려움
}

// 문제 변경 로그 (감사 로그)
export type AuditAction = "create" | "update" | "delete";

export interface QuestionAudit {
  id: string;
  action: AuditAction;
  questionId: string | null;
  snapshot: AdminQuestion | null; // 변경 후(생성/수정) 또는 삭제된 문제 스냅샷
  createdAt: string;
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: "생성",
  update: "수정",
  delete: "삭제",
};

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
export const MAX_NICKNAME_LENGTH = 16;

export interface Comment {
  id: string;
  content: string;
  grade: number;
  nickname: string;
  ipMasked: string; // 마스킹된 IP (원본은 서버에 저장하지 않음)
  createdAt: string;
}

// IPv4를 앞 2옥텟만 남기고 마스킹 (123.45.67.89 → 123.45.*.*)
export function maskIp(ip: string | null | undefined): string {
  if (!ip) return "비공개";
  const v4 = ip.trim().split(".");
  if (v4.length === 4 && v4.every((p) => /^\d{1,3}$/.test(p))) {
    return `${v4[0]}.${v4[1]}.*.*`;
  }
  return "비공개"; // IPv6 등은 비공개 처리
}

// 기본 닉네임 생성 (랜덤 단어 + 숫자 조합, 중복 허용). 예: 아무개1235, 행인4821
const NICKNAME_WORDS = [
  "아무개",
  "행인",
  "익명",
  "나그네",
  "구경꾼",
  "지나가던이",
  "손님",
  "불특정",
];
export function randomNickname(): string {
  const word = NICKNAME_WORDS[Math.floor(Math.random() * NICKNAME_WORDS.length)];
  return `${word}${Math.floor(1000 + Math.random() * 9000)}`;
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

// 등급별 RPG 페르소나(직업 클래스) — 결과 화면의 메인.
// 톤: 레트로 RPG. 상위는 영웅 칭호, 하위는 인게임 상태로 따끔하게(인신공격 금지).
export const GRADE_TITLES: Record<number, string> = {
  1: "대현자",
  2: "왕립 학자",
  3: "숙련된 모험가",
  4: "견습 기사",
  5: "떠돌이 여행자",
  6: "수련생",
  7: "마을 주민",
  8: "길 잃은 초심자",
  9: "갓 깨어난 슬라임",
};

// 등급별 시각 테마 (결과 화면 표현용 — 컬러/이모지/한줄평)
export interface GradeTheme {
  color: string; // 페르소나 이름·강조 컬러
  emoji: string;
  blurb: string; // 가벼운 한줄평 (성장/도전 톤, 모욕 금지)
}

const GRADE_THEMES: Record<number, GradeTheme> = {
  1: { color: "#f59e0b", emoji: "🧙", blurb: "검색 마법 없이 이 경지라니. 길드가 당신을 찾고 있습니다." },
  2: { color: "#10b981", emoji: "📜", blurb: "왕국의 고문서쯤은 막힘없이 해독하는 두뇌." },
  3: { color: "#14b8a6", emoji: "⚔️", blurb: "웬만한 던전 비문은 술술 읽어내는 베테랑." },
  4: { color: "#6366f1", emoji: "🛡️", blurb: "가능성이 보입니다. 검을 조금만 더 갈면 정예." },
  5: { color: "#7c3aed", emoji: "🧭", blurb: "딱 평균. 여기서부터가 진짜 모험입니다." },
  6: { color: "#f97316", emoji: "🪄", blurb: "기초 주문서가 아직 버겁군요. 수련이 필요합니다." },
  7: { color: "#fb7185", emoji: "🏘️", blurb: "모험은 이릅니다. 마을 간판부터 천천히 읽어봅시다." },
  8: { color: "#ef4444", emoji: "🌫️", blurb: "심각합니다. 글자 앞에서 길을 잃었어요." },
  9: { color: "#dc2626", emoji: "🟢", blurb: "긴급 상황. 튜토리얼 마을로 돌아가야 할 수준입니다." },
};

export function gradeTheme(grade: number): GradeTheme {
  return GRADE_THEMES[grade] ?? GRADE_THEMES[5];
}
