// 시나리오 어드민이 주고받는 형태 (#75).
// DB는 지문(scenarios)과 문항(scenario_steps)을 나눠 갖지만,
// 어드민 화면은 "지문 1개 + 문항 N개"를 한 덩어리로 다룬다.

// 렌더링 표면 종류. DB의 scenarios.kind 와 같은 값.
// 공지와 신문은 화면이 같지만 유형은 나눈다 — 유형별 튜토리얼·안내가 갈라진다(#92).
export type ScenarioKind =
  | "notice"
  | "news"
  | "community"
  | "chat"
  | "email"
  | "story"
  | "contract"
  | "manual"
  | "word";

export const SCENARIO_KINDS: ScenarioKind[] = [
  "notice",
  "news",
  "community",
  "chat",
  "email",
  "story",
  "contract",
  "manual",
  "word",
];

export const SCENARIO_KIND_LABELS: Record<ScenarioKind, string> = {
  notice: "공지",
  news: "신문",
  community: "커뮤니티",
  chat: "메신저",
  email: "이메일",
  story: "서사",
  contract: "계약서",
  manual: "사용설명서",
  word: "어휘",
};

// 유형 이름 그대로 화면에 다는 제목(#99). 튜토리얼 제목과 푸는 화면 상단바가 같은 값을 쓴다 —
// 게시판 이름·방 제목을 문제마다 따로 지정하지 않아도 무슨 유형인지 늘 보인다.
export const SCENARIO_KIND_TITLES: Record<ScenarioKind, string> = {
  notice: "공지사항",
  news: "신문",
  community: "커뮤니티",
  chat: "메신저",
  email: "이메일",
  story: "서사",
  contract: "계약서",
  manual: "사용설명서",
  word: "어휘",
};

// 유형이 무엇을 재는지. 목록에서 어떤 유형에 문제를 더 채울지 판단하는 데 쓴다(#92).
export const SCENARIO_KIND_DESCRIPTIONS: Record<ScenarioKind, string> = {
  notice: "안내문에 숨은 조건과 낚시 문구를 가려낸다",
  news: "기사에서 제목낚시와 사실·추측을 갈라낸다",
  community: "게시물과 댓글에서 요지·반어·논점 이탈을 짚는다",
  chat: "대화 맥락을 읽고 보낼 답장을 고른다",
  email: "회신 스레드를 훑거나 원문과 답장을 대조한다",
  story: "긴 이야기를 읽고 세부·생략·서술자를 따진다",
  contract: "조항에 묶이는 의무와 돈을 조문에서 짚어낸다",
  manual: "절차의 순서와 경고가 미치는 범위를 가려낸다",
  word: "한자어·사자성어·속담 같은 낱말의 뜻을 짚는다",
};

// 지문이 없는 유형 — 문항만으로 성립한다.
// 메신저는 대화가 문항마다 흩어져 있고, 어휘는 낱말 하나를 묻는다.
// 지문 필수 검사(scenario-rules)와 어드민의 지문 단계(ScenarioForm)가 이 판정을 쓴다.
export function isBodylessKind(kind: ScenarioKind): boolean {
  return kind === "chat" || kind === "word";
}

export type ScenarioStatus = "draft" | "published" | "held";

export const SCENARIO_STATUSES: ScenarioStatus[] = [
  "draft",
  "published",
  "held",
];

export const SCENARIO_STATUS_LABELS: Record<ScenarioStatus, string> = {
  draft: "초안",
  published: "게시",
  held: "보류",
};

export interface AdminScenarioStep {
  id: string; // DB uuid. 새로 추가한 문항은 빈 문자열.
  stepKey: string; // 사람이 읽는 식별자(gist, irony …). 시나리오 안에서 유일.
  type: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  difficulty: number;
  points: number; // 문항 배점(#99). 하루 만점 100점을 이 값들로 맞춘다.
  timeLimitSec: number;
  showUpTo: number | null; // 이메일 전용(순차 공개)
  // 유형별 추가 필드(#80). 메신저는 여기에 context·reactCorrect·reactWrong·reactTimeout을 담는다.
  extra: Record<string, unknown>;
  attempts: number;
  correctCount: number;
}

export interface AdminScenario {
  id: string;
  slug: string;
  // 만드는 사람이 목록·편성에서 알아보는 이름(#92).
  // 푸는 사람이 보는 표시 라벨(sourceLabel)과 다르다.
  title: string;
  kind: ScenarioKind;
  sourceLabel: string;
  status: ScenarioStatus;
  sortOrder: number;
  payload: Record<string, unknown>; // 유형별 지문. 편집기는 #79~#83에서.
  steps: AdminScenarioStep[];
}

// 문항 정답률. 시도가 없으면 null(0%와 구분한다).
export function correctRate(step: AdminScenarioStep): number | null {
  if (step.attempts <= 0) return null;
  return Math.round((step.correctCount / step.attempts) * 100);
}
