// 시나리오 어드민이 주고받는 형태 (#75).
// DB는 지문(scenarios)과 문항(scenario_steps)을 나눠 갖지만,
// 어드민 화면은 "지문 1개 + 문항 N개"를 한 덩어리로 다룬다.

import { type ScenarioKind } from "./scenario-registry";

export type { ScenarioKind };

export const SCENARIO_KINDS: ScenarioKind[] = [
  "doc",
  "community",
  "chat",
  "email",
  "story",
];

export const SCENARIO_KIND_LABELS: Record<ScenarioKind, string> = {
  doc: "문서형(공지·신문)",
  community: "커뮤니티",
  chat: "메신저",
  email: "이메일",
  story: "서사",
};

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
  timeLimitSec: number;
  showUpTo: number | null; // 이메일 전용(순차 공개)
  attempts: number;
  correctCount: number;
}

export interface AdminScenario {
  id: string;
  slug: string;
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
