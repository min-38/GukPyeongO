import { describe, expect, it } from "vitest";

import { dateMark, showsTime, type TimedBubble } from "./chat-scenario";

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

// 대화가 며칠에 걸칠 수 있다. 날이 바뀌는 문항에서만 구분선을 세운다.
describe("dateMark", () => {
  const steps = [
    { date: "2월 3일 월요일" },
    {},
    { date: "2월 3일 월요일" },
    { date: "2월 5일 수요일" },
  ];

  it("첫 날짜는 찍는다", () => {
    expect(dateMark(steps, 0)).toBe("2월 3일 월요일");
  });

  it("날짜를 비운 문항은 앞 날을 이어간다", () => {
    expect(dateMark(steps, 1)).toBeUndefined();
  });

  it("앞 문항과 같은 날이면 찍지 않는다", () => {
    expect(dateMark(steps, 2)).toBeUndefined();
  });

  it("날이 바뀌면 찍는다", () => {
    expect(dateMark(steps, 3)).toBe("2월 5일 수요일");
  });
});
