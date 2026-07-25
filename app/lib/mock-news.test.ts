import { describe, expect, it } from "vitest";

import { MOCK_NEWS } from "./mock-news";
import { POINTS_BY_DIFFICULTY } from "./useScenario";

// 신문 유형(#71) UI가 이 mock에 의존하므로 형태가 깨지면 화면이 깨진다.
describe("mock-news", () => {
  it("기사 1개에 문제가 여러 개 이어진다", () => {
    expect(MOCK_NEWS.doc.body.length).toBeGreaterThan(0);
    expect(MOCK_NEWS.steps.length).toBeGreaterThan(1);
    expect(MOCK_NEWS.sourceLabel.length).toBeGreaterThan(0);
  });

  it("본문은 상한(~650자)을 넘지 않는다 — 신문은 길지만 모바일 한계는 있다", () => {
    const chars = MOCK_NEWS.doc.body.join("").length;
    expect(chars).toBeLessThanOrEqual(650);
  });

  it("모든 스텝이 유효한 구조를 가진다", () => {
    for (const step of MOCK_NEWS.steps) {
      expect(step.choices.length).toBeGreaterThanOrEqual(2);
      expect(step.answerIndex).toBeGreaterThanOrEqual(0);
      expect(step.answerIndex).toBeLessThan(step.choices.length);
      expect(POINTS_BY_DIFFICULTY[step.difficulty]).toBeGreaterThan(0);
    }
  });
});
