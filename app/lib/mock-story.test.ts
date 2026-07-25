import { describe, expect, it } from "vitest";

import { MOCK_STORY } from "./mock-story";
import { POINTS_BY_DIFFICULTY } from "./useScenario";

// 서사 유형(#73) UI가 이 mock에 의존한다. 형태가 깨지면 여기서 먼저 잡는다.
describe("mock-story", () => {
  it("지문 하나에 문제가 여러 개 이어진다", () => {
    expect(MOCK_STORY.body.length).toBeGreaterThan(0);
    expect(MOCK_STORY.steps.length).toBeGreaterThan(1);
    expect(MOCK_STORY.sourceLabel.length).toBeGreaterThan(0);
    expect(MOCK_STORY.title.length).toBeGreaterThan(0);
  });

  // 서사 유형은 길게 간다. 대신 읽는 시간을 따로 주고 문제를 시작한다.
  it("본문은 상한(~1200자)을 넘지 않는다", () => {
    expect(MOCK_STORY.body.join("").length).toBeLessThanOrEqual(1200);
  });

  // 읽기 시간이 모자라면 독해가 아니라 속독 시험이 된다. 분당 400자를 하한으로 본다.
  it("읽기 시간이 본문 길이에 비해 충분하다", () => {
    const charsPerMinute = MOCK_STORY.body.join("").length / (MOCK_STORY.readSec / 60);
    expect(charsPerMinute).toBeLessThanOrEqual(400);
  });

  it("모든 스텝이 유효한 구조를 가진다", () => {
    for (const step of MOCK_STORY.steps) {
      expect(step.choices.length).toBeGreaterThanOrEqual(2);
      expect(step.answerIndex).toBeGreaterThanOrEqual(0);
      expect(step.answerIndex).toBeLessThan(step.choices.length);
      expect(POINTS_BY_DIFFICULTY[step.difficulty]).toBeGreaterThan(0);
    }
  });

  // 감정·심정·분위기·주제는 본문이 확정하지 못한다 — 문해력이 아니라 작품 이해의 영역이다.
  it("감상을 묻는 문항이 없다", () => {
    const banned = ["심정", "심경", "기분", "분위기", "정서", "주제", "느낌"];
    for (const step of MOCK_STORY.steps) {
      // 선택지도 본다 — 물음이 명제여도 답이 감상이면 채점자가 정하는 문제가 된다.
      for (const text of [step.prompt, ...step.choices]) {
        for (const word of banned) {
          expect(text).not.toContain(word);
        }
      }
    }
  });
});
