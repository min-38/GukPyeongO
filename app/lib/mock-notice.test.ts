import { describe, expect, it } from "vitest";

import { MOCK_NOTICE } from "./mock-notice";
import { POINTS_BY_DIFFICULTY } from "./useScenario";

// 공지 유형(#70) UI가 이 mock에 의존하므로 형태가 깨지면 화면이 깨진다.
describe("mock-notice", () => {
  it("문서 1개에 문제가 여러 개 이어진다", () => {
    expect(MOCK_NOTICE.doc.body.length).toBeGreaterThan(0);
    expect(MOCK_NOTICE.steps.length).toBeGreaterThan(1);
    expect(MOCK_NOTICE.sourceLabel.length).toBeGreaterThan(0);
  });

  it("모든 스텝이 유효한 구조를 가진다", () => {
    for (const step of MOCK_NOTICE.steps) {
      expect(step.choices.length).toBeGreaterThanOrEqual(2);
      expect(step.answerIndex).toBeGreaterThanOrEqual(0);
      expect(step.answerIndex).toBeLessThan(step.choices.length);
      expect(POINTS_BY_DIFFICULTY[step.difficulty]).toBeGreaterThan(0);
    }
  });
});
