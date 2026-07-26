// 시나리오 출제 규칙 (#76).
// 지금까지 mock 테스트로만 막던 규칙을 저장 시점으로 옮긴다.
// 어드민 입력이 열리면 테스트는 시드 데이터에만 걸리므로 규칙이 무력화되기 때문.
//
// 거부(errors)와 경고(warnings)를 나눈 기준:
//   거부 — 어기면 화면이 깨지거나 시험이 성립하지 않는 것(순서가 뒤집힌 메일 공개, 읽을 시간 부족)
//   경고 — 품질 판단이라 운영자가 사정을 알 수도 있는 것(길이 상한, 감상 어휘)
// 구조 정합성(보기 2개 이상, 정답 범위, 난이도 등)은 라우트의 parseInput이 이미 거부한다.

import { type ScenarioKind } from "./scenario-admin";

// 본문 길이 상한(자). 모바일에서 읽히는 한계 — mock 테스트의 값과 같은 기준.
const BODY_LIMITS: Partial<Record<ScenarioKind, number>> = {
  doc: 650,
  email: 900,
  story: 1200,
};

// 분당 읽기 속도 상한. 이보다 빠르게 읽어야 하면 독해가 아니라 속독 시험이 된다.
export const MAX_CHARS_PER_MINUTE = 400;

// 감정·심정·분위기·주제는 본문이 확정하지 못한다. 채점자가 정하는 문제가 되어버린다(#73).
const IMPRESSION_WORDS = [
  "심정",
  "심경",
  "기분",
  "분위기",
  "정서",
  "주제",
  "느낌",
];

export interface RuleStep {
  prompt: string;
  choices: string[];
  showUpTo?: number | null;
}

export interface RuleResult {
  errors: string[];
  warnings: string[];
}

// 유형별로 본문이 어디 있는지 다르다. 없는 유형(chat)은 빈 문자열.
function bodyText(
  kind: ScenarioKind,
  payload: Record<string, unknown>,
): string {
  const p = payload as {
    body?: string[];
    doc?: { body?: string[] };
    post?: { body?: string[] };
    messages?: { body?: string[] }[];
  };
  switch (kind) {
    case "doc":
      return (p.doc?.body ?? []).join("");
    case "story":
      return (p.body ?? []).join("");
    case "community":
      return (p.post?.body ?? []).join("");
    case "email":
      return (p.messages ?? []).map((m) => (m.body ?? []).join("")).join("");
    default:
      return "";
  }
}

export function checkScenarioRules(
  kind: ScenarioKind,
  payload: Record<string, unknown>,
  steps: RuleStep[],
): RuleResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const body = bodyText(kind, payload);
  if (kind !== "chat" && body.trim().length === 0) {
    errors.push("지문 본문이 비어 있습니다.");
  }

  if (kind === "chat") {
    // 메신저는 지문 자리에 방 제목·상대 화자만 있다. 화자가 없으면 반응 대사를 누가 하는지 모른다.
    const p = payload as { roomTitle?: unknown; speaker?: unknown };
    if (typeof p.roomTitle !== "string" || p.roomTitle.trim().length === 0)
      errors.push("대화방 제목을 입력해주세요.");
    if (typeof p.speaker !== "string" || p.speaker.trim().length === 0)
      errors.push("상대 화자를 입력해주세요.");
  }

  const limit = BODY_LIMITS[kind];
  if (limit !== undefined && body.length > limit) {
    warnings.push(
      `본문이 ${body.length}자입니다. 권장 상한 ${limit}자를 넘으면 모바일에서 읽기 어렵습니다.`,
    );
  }

  if (kind === "story") {
    const readSec = Number((payload as { readSec?: unknown }).readSec ?? 0);
    if (!Number.isFinite(readSec) || readSec <= 0) {
      errors.push("읽기 시간(readSec)을 1초 이상으로 지정해주세요.");
    } else if (body.length > 0) {
      const perMinute = body.length / (readSec / 60);
      if (perMinute > MAX_CHARS_PER_MINUTE) {
        const needed = Math.ceil((body.length / MAX_CHARS_PER_MINUTE) * 60);
        errors.push(
          `읽기 시간이 부족합니다. 본문 ${body.length}자에는 ${needed}초 이상이 필요합니다(현재 ${readSec}초).`,
        );
      }
    }
  }

  if (kind === "email") {
    const messageCount = ((payload as { messages?: unknown[] }).messages ?? [])
      .length;
    let prev = 0;
    for (const [i, step] of steps.entries()) {
      const upTo = step.showUpTo ?? messageCount;
      if (upTo > messageCount) {
        errors.push(
          `${i + 1}번 문항: 공개 범위(${upTo})가 메일 수(${messageCount})를 넘습니다.`,
        );
      } else if (upTo < prev) {
        // 한 번 열린 메일은 닫히지 않는다. 줄어들면 UI가 메일을 도로 감춘다.
        errors.push(
          `${i + 1}번 문항: 공개 범위가 앞 문항(${prev})보다 줄었습니다.`,
        );
      }
      prev = Math.max(prev, upTo);
    }
  }

  if (kind === "story") {
    for (const [i, step] of steps.entries()) {
      // 물음이 명제여도 답이 감상이면 채점자가 정하는 문제가 된다 — 선택지도 본다.
      for (const text of [step.prompt, ...step.choices]) {
        const hit = IMPRESSION_WORDS.find((w) => text.includes(w));
        if (hit) {
          warnings.push(
            `${i + 1}번 문항에 감상 어휘 '${hit}'가 있습니다. 본문이 확정하지 못하는 것을 묻고 있지 않은지 확인해주세요.`,
          );
          break;
        }
      }
    }
  }

  return { errors, warnings };
}
