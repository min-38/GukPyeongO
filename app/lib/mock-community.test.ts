import { describe, expect, it } from "vitest";

import { MOCK_COMMUNITY } from "./mock-community";
import { POINTS_BY_DIFFICULTY } from "./useScenario";

// 커뮤니티 유형(#69) UI가 이 mock에 의존하므로 형태가 깨지면 화면이 깨진다.
describe("mock-community", () => {
  it("한 게시물에 문제가 여러 개 이어진다", () => {
    expect(MOCK_COMMUNITY.steps.length).toBeGreaterThan(1);
    expect(MOCK_COMMUNITY.boardName.length).toBeGreaterThan(0);
  });

  it("게시물이 원글과 전체 댓글을 통째로 가진다", () => {
    expect(MOCK_COMMUNITY.post.body.length).toBeGreaterThan(0);
    expect(MOCK_COMMUNITY.comments.length).toBeGreaterThan(0);
  });

  it("모든 스텝이 유효한 구조를 가진다", () => {
    for (const step of MOCK_COMMUNITY.steps) {
      expect(step.choices.length).toBeGreaterThanOrEqual(2);
      expect(step.answerIndex).toBeGreaterThanOrEqual(0);
      expect(step.answerIndex).toBeLessThan(step.choices.length);
      expect(POINTS_BY_DIFFICULTY[step.difficulty]).toBeGreaterThan(0);
    }
  });

  it("유저 고르기 문제의 선택지는 실제 댓글 작성자다", () => {
    const nicks = MOCK_COMMUNITY.comments.map((c) => c.nick);
    const offtopic = MOCK_COMMUNITY.steps.find((s) => s.id === "offtopic");
    offtopic?.choices.forEach((nick) => expect(nicks).toContain(nick));
  });
});
