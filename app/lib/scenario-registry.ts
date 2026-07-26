import { MOCK_COMMUNITY } from "./mock-community";
import { MOCK_EMAIL } from "./mock-email";
import { MOCK_EMAIL_REPLY } from "./mock-email-reply";
import { MOCK_NEWS } from "./mock-news";
import { MOCK_SCENARIO } from "./mock-questions";
import { MOCK_NOTICE } from "./mock-notice";
import { MOCK_STORY } from "./mock-story";

// 시나리오 전체 목록 (#74).
// mock → DB 시드 생성의 기준이 된다. 새 유형을 추가하면 여기에도 등록해야 시드에 잡힌다.
export type ScenarioKind = "doc" | "community" | "chat" | "email" | "story";

// DB의 scenario_steps 한 행에 대응. 어느 유형이든 문항 구조는 같다(showUpTo만 이메일 전용).
export interface ScenarioStepSeed {
  id: string;
  type: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  difficulty: number;
  timeLimitSec: number;
  showUpTo?: number;
  // 메신저 전용(#80) — scenario_steps.extra 로 저장된다.
  context?: { speaker: string; text: string }[];
  reactCorrect?: string;
  reactWrong?: string;
  reactTimeout?: string;
}

export interface ScenarioSeed {
  slug: string;
  kind: ScenarioKind;
  sourceLabel: string;
  sortOrder: number;
  payload: Record<string, unknown>; // 지문(문항 제외)
  steps: ScenarioStepSeed[];
}

// mock 객체를 지문(payload)과 문항(steps)으로 가른다.
// payload는 표면 컴포넌트가 그대로 받는 모양이어야 하므로 steps만 떼어낸다.
function split(
  slug: string,
  kind: ScenarioKind,
  sortOrder: number,
  mock: { sourceLabel?: string; boardName?: string; steps: ScenarioStepSeed[] }
): ScenarioSeed {
  const { steps, ...payload } = mock;
  return {
    slug,
    kind,
    sourceLabel: mock.sourceLabel ?? mock.boardName ?? "",
    sortOrder,
    payload,
    steps,
  };
}

export const SCENARIO_SEEDS: ScenarioSeed[] = [
  split("community", "community", 1, MOCK_COMMUNITY),
  split("notice", "doc", 2, MOCK_NOTICE),
  split("news", "doc", 3, MOCK_NEWS),
  split("email", "email", 4, MOCK_EMAIL),
  split("email-reply", "email", 5, MOCK_EMAIL_REPLY),
  split("story", "story", 6, MOCK_STORY),
  split("chat", "chat", 7, {
    ...MOCK_SCENARIO,
    sourceLabel: MOCK_SCENARIO.roomTitle,
  }),
];
