import { describe, expect, it } from "vitest";

import { MOCK_EMAIL_REPLY } from "./mock-email-reply";
import { MOCK_EMAIL } from "./mock-email";
import { POINTS_BY_DIFFICULTY } from "./useScenario";

// 이메일 유형(#72) UI가 이 mock들에 의존한다. 형태가 깨지면 여기서 먼저 잡는다.
const SCENARIOS = [
  { name: "mock-email (흔적 추적형)", s: MOCK_EMAIL, maxChars: 800 },
  {
    name: "mock-email-reply (답장 대조형)",
    s: MOCK_EMAIL_REPLY,
    maxChars: 900,
  },
];

describe.each(SCENARIOS)("$name", ({ s, maxChars }) => {
  it("회신이 이어진 스레드에 문제가 여러 개 붙는다", () => {
    expect(s.messages.length).toBeGreaterThan(1);
    expect(s.steps.length).toBeGreaterThan(1);
    expect(s.subject.length).toBeGreaterThan(0);
    expect(s.sourceLabel.length).toBeGreaterThan(0);
  });

  it("본문이 상한을 넘지 않는다", () => {
    const total = s.messages.map((m) => m.body.join("")).join("").length;
    expect(total).toBeLessThanOrEqual(maxChars);
  });

  // 한 번 열린 메일은 닫히지 않는다. showUpTo가 줄어들면 UI가 메일을 도로 감춘다.
  it("showUpTo는 오름차순이고 메일 수를 넘지 않는다", () => {
    let prev = 0;
    for (const step of s.steps) {
      const upTo = step.showUpTo ?? s.messages.length;
      expect(upTo).toBeGreaterThanOrEqual(prev);
      expect(upTo).toBeLessThanOrEqual(s.messages.length);
      prev = upTo;
    }
  });

  it("모든 스텝이 유효한 구조를 가진다", () => {
    for (const step of s.steps) {
      expect(step.choices.length).toBeGreaterThanOrEqual(2);
      expect(step.answerIndex).toBeGreaterThanOrEqual(0);
      expect(step.answerIndex).toBeLessThan(step.choices.length);
      expect(POINTS_BY_DIFFICULTY[step.difficulty]).toBeGreaterThan(0);
    }
  });
});

// 흔적 추적형은 스레드를 통째로 놓고 훑는다 — 대조는 접힌 인용으로 한다.
describe("mock-email 흔적 추적형", () => {
  it("첫 메일을 뺀 회신에는 인용문이 있다", () => {
    for (const msg of MOCK_EMAIL.messages.slice(1)) {
      expect(msg.quote?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

// 답장 대조형은 원문/답장 탭으로 갈아끼운다 — 원문을 먼저 풀고 나서 답장이 열려야 한다.
describe("mock-email-reply 답장 대조형", () => {
  it("toggle 레이아웃이다", () => {
    expect(MOCK_EMAIL_REPLY.layout).toBe("toggle");
  });

  it("원문만 놓고 푸는 문제가 먼저 나오고, 그 뒤 답장이 열린다", () => {
    const upTo = MOCK_EMAIL_REPLY.steps.map(
      (s) => s.showUpTo ?? MOCK_EMAIL_REPLY.messages.length
    );
    expect(upTo[0]).toBe(1);
    expect(upTo.filter((n) => n === 1).length).toBeGreaterThanOrEqual(2);
    expect(upTo.at(-1)).toBe(MOCK_EMAIL_REPLY.messages.length);
  });
});
