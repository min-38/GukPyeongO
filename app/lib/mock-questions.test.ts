import { describe, expect, it } from "vitest";

import { MOCK_SCENARIO, POINTS_BY_DIFFICULTY } from "./mock-questions";

// UI(#67)가 mock 시나리오에 의존하므로 형태가 깨지면 화면이 깨진다.
// 최소 무결성만 지킨다.
describe("mock-scenario", () => {
  it("배점은 난이도가 높을수록 크다 (킬러 우대)", () => {
    expect(POINTS_BY_DIFFICULTY[1]).toBeLessThan(POINTS_BY_DIFFICULTY[2]);
    expect(POINTS_BY_DIFFICULTY[2]).toBeLessThan(POINTS_BY_DIFFICULTY[3]);
  });

  it("한 시나리오에 문제가 여러 개 이어진다", () => {
    expect(MOCK_SCENARIO.steps.length).toBeGreaterThan(1);
    expect(MOCK_SCENARIO.roomTitle.length).toBeGreaterThan(0);
    expect(MOCK_SCENARIO.speaker.length).toBeGreaterThan(0);
  });

  it("모든 문제가 유효한 구조를 가진다", () => {
    for (const step of MOCK_SCENARIO.steps) {
      expect(step.context.length).toBeGreaterThan(0);
      expect(step.choices.length).toBeGreaterThanOrEqual(2);
      // 정답 인덱스는 선택지 범위 안
      expect(step.answerIndex).toBeGreaterThanOrEqual(0);
      expect(step.answerIndex).toBeLessThan(step.choices.length);
      // 정답/오답/무응답 반응 대사 존재 (셋이 서로 달라야 상황이 구분된다)
      expect(step.reactCorrect.length).toBeGreaterThan(0);
      expect(step.reactWrong.length).toBeGreaterThan(0);
      expect(step.reactTimeout.length).toBeGreaterThan(0);
      expect(step.reactTimeout).not.toBe(step.reactWrong);
      // 배점 매핑에 존재하는 난이도
      expect(POINTS_BY_DIFFICULTY[step.difficulty]).toBeGreaterThan(0);
    }
  });
});
