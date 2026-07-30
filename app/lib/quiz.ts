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
  labels?: Record<string, string>,
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
  mix: Record<number, number>,
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
  // v2 회차(오늘의 문제)는 v1 응시 모드(빠른/정밀)에 해당하지 않는다.
  // 결과 화면이 쓸 라벨을 직접 넘긴다(#89). 없으면 모드 라벨을 쓴다.
  modeLabel?: string;
  // v2는 등급을 점수로 매긴다(#89). 맞힌 개수만으로는 킬러 문항의 무게가 안 보인다.
  score?: number;
  maxScore?: number;
  // 채점을 끝낸 시각(ISO). 서버 시계로 찍는다 — 기기 시계는 어긋나 있을 수 있다(#95).
  finishedAt?: string;
  // 등급 분포 속 내 위치(#95). 응시 기록이 없는 회차(v1)에는 없다.
  rank?: GradeRank;
  // 문제 다시 보기가 읽는 문항별 내 답과 정답(#96). v1 회차에는 없다.
  review?: ReviewStep[];
  // 어느 회차를 푼 결과인지(#100). 다시 보기가 그 회차의 지문을 다시 읽어온다.
  // 회차가 없던 시절에 저장된 기록에는 없다.
  roundId?: string;
}

// 문제 다시 보기 한 문항 (#96).
// 지문과 보기 글은 화면이 서버에서 따로 받아온다 — 여기엔 답만 담는다.
export interface ReviewStep {
  slug: string;
  stepKey: string;
  choiceIndex: number | null; // 내가 고른 보기. null이면 시간 초과 등으로 못 푼 문항
  answerIndex: number;
}

// 문항 별점 (#96). 별점은 필수, 한마디는 선택.
export const MAX_RATING_COMMENT_LENGTH = 200;
export const RATING_STARS = [1, 2, 3, 4, 5] as const;

// 어드민 항의 목록 한 줄 (#96). 어느 문항인지 알아볼 수 있게 문제 제목과 질문을 동봉한다.
export interface AdminStepReport {
  id: string;
  reason: string;
  detail: string | null;
  status: "open" | "resolved";
  createdAt: string;
  scenarioTitle: string;
  stepPrompt: string;
}

// 어드민 별점 집계 한 줄 (#96). 다음 문제를 어느 쪽으로 낼지 보는 자리라 문항 단위로 묶는다.
export interface AdminStepRating {
  stepId: string;
  scenarioId: string;
  scenarioTitle: string;
  stepPrompt: string;
  average: number;
  count: number;
  comments: string[];
}

// 등급 분포 막대가 쓰는 값 (#95).
export interface GradeRank {
  percent: number; // 내 득점률 — 막대 위 표식의 위치
  topPercent: number; // 상위 몇 % (1~100)
  total: number; // 견준 응시자 수. 적으면 화면에서 수치를 감춘다
  counts: number[]; // 등급별 응시자 수. counts[0]이 1등급
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
  const word =
    NICKNAME_WORDS[Math.floor(Math.random() * NICKNAME_WORDS.length)];
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

// 패치노트 (#41) — 서비스 업데이트 내역. 공개 /patch 페이지에 노출.
export const PATCH_TYPES = ["new", "fix", "improve"] as const;
export type PatchType = (typeof PATCH_TYPES)[number];

export const PATCH_TYPE_LABELS: Record<PatchType, string> = {
  new: "신규",
  fix: "수정",
  improve: "개선",
};

export const MAX_PATCH_VERSION_LENGTH = 30;
export const MAX_PATCH_CONTENT_LENGTH = 2000;

export interface PatchNote {
  id: string;
  version: string;
  type: PatchType;
  content: string;
  patchedAt: string; // 패치 적용 일시 (ISO)
  createdAt: string;
}

// 등급별 동물 캐릭터 — 결과 화면의 메인 (#106).
// 등급이 낮아질수록 인지능력이 낮은 동물이 온다. 수식은 그림의 표정과 맞춘다
// (1등급 범고래는 왕관을, 6등급 토끼는 놀란 눈을 하고 있다).
// 톤: 위는 치켜세우고 아래는 따끔하게 — 다만 읽는 습관을 말할 뿐 사람을 깎지 않는다.
export const GRADE_TITLES: Record<number, string> = {
  1: "왕관 쓴 범고래",
  2: "안경 쓴 코끼리",
  3: "똑똑한 돼지",
  4: "새침한 고양이",
  5: "무리 속 양",
  6: "놀란 토끼",
  7: "느긋한 거북",
  8: "멍한 개구리",
  9: "기죽은 모기",
};

// 등급별 시각 테마 (결과 화면 표현용 — 컬러/이모지/한줄평)
export interface GradeTheme {
  color: string; // 페르소나 이름·강조 컬러
  emoji: string;
  // 등급 아래 한 줄(#95). 일상에서 겪는 장면으로 등급을 실감하게 한다.
  // 등급마다 여러 줄을 두고 하나를 고른다 — 다시 응시했을 때 같은 문장이 또 나오면 김이 샌다.
  blurbs: string[];
}

const GRADE_THEMES: Record<number, GradeTheme> = {
  1: {
    color: "#f59e0b",
    emoji: "🐋",
    blurbs: [
      "지능과 전략으로 바다를 지배하는 최상위 포식자.",
    ],
  },
  2: {
    color: "#10b981",
    emoji: "🐘",
    blurbs: [
      "뛰어난 기억력과 판단력을 지닌 육지의 거인.",
    ],
  },
  3: {
    color: "#14b8a6",
    emoji: "🐷",
    blurbs: [
      "생각보다 영리하지만, 중요한 단서를 종종 흘리는 돼지.",
    ],
  },
  4: {
    color: "#6366f1",
    emoji: "🐱",
    blurbs: [
      "보고 싶은 것만 보고, 관심 없는 문장은 넘겨버리는 고양이.",
    ],
  },
  5: {
    color: "#7c3aed",
    emoji: "🐑",
    blurbs: [
      "남들이 읽는 만큼만 읽고, 남들이 놓치는 만큼 놓치는 양.",
    ],
  },
  6: {
    color: "#f97316",
    emoji: "🐰",
    blurbs: [
      "빨리 읽고 빨리 판단하지만, 그만큼 자주 틀리는 토끼.",
    ],
  },
  7: {
    color: "#fb7185",
    emoji: "🐢",
    blurbs: [
      "천천히 읽는데도 정작 핵심은 놓치는 거북이.",
    ],
  },
  8: {
    color: "#ef4444",
    emoji: "🐸",
    blurbs: [
      "눈앞의 단어에만 반응하고 문장의 뜻은 놓치는 개구리.",
    ],
  },
  9: {
    color: "#dc2626",
    emoji: "🦟",
    blurbs: [
      "글 위를 맴돌았지만 이해한 내용은 거의 없는 모기.",
    ],
  },
};

// 등급 아래 한 줄 고르기(#95). 무작위로 뽑으면 서버·클라이언트 렌더가 어긋나므로
// 결과에서 뽑은 값(seed)으로 고른다 — 같은 결과는 늘 같은 문장, 다른 회차는 다른 문장.
export function gradeBlurb(grade: number, seed: number): string {
  const list = gradeTheme(grade).blurbs;
  return list[Math.abs(Math.trunc(seed)) % list.length];
}

export function gradeTheme(grade: number): GradeTheme {
  return GRADE_THEMES[grade] ?? GRADE_THEMES[5];
}
