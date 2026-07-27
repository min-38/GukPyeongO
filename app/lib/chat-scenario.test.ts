import { describe, expect, it } from "vitest";

import { showsTime, type TimedBubble } from "./chat-scenario";

// 시각은 같은 사람·같은 시각 묶음의 마지막 줄에만 붙는다 (#94).
describe("showsTime", () => {
  const them = (at?: string): TimedBubble => ({
    side: "them",
    speaker: "김부장",
    at,
  });

  it("같은 사람이 같은 시각에 연달아 보내면 마지막 줄에만 붙는다", () => {
    const bubbles = [them("오전 9:17"), them("오전 9:17")];
    expect(showsTime(bubbles, 0)).toBe(false);
    expect(showsTime(bubbles, 1)).toBe(true);
  });

  it("시각이 달라지면 각 줄에 붙는다", () => {
    const bubbles = [them("오전 9:17"), them("오전 9:18")];
    expect(showsTime(bubbles, 0)).toBe(true);
    expect(showsTime(bubbles, 1)).toBe(true);
  });

  it("같은 시각이어도 보낸 쪽이 다르면 각각 붙는다", () => {
    const bubbles: TimedBubble[] = [
      them("오전 9:18"),
      { side: "me", speaker: "나", at: "오전 9:18" },
    ];
    expect(showsTime(bubbles, 0)).toBe(true);
    expect(showsTime(bubbles, 1)).toBe(true);
  });

  it("시각이 없으면 붙이지 않는다", () => {
    expect(showsTime([them(undefined)], 0)).toBe(false);
  });
});
