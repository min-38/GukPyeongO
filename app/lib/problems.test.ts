import { describe, expect, it } from "vitest";

import { BLANK, checkAnswer, fillBlank, MAX_ANSWER_LENGTH } from "./problems";

describe("checkAnswer", () => {
  it("앞뒤 공백을 지운다", () => {
    expect(checkAnswer("  이용 ")).toEqual({ answer: "이용" });
  });

  it("가운데 띄어쓰기는 그대로 둔다", () => {
    expect(checkAnswer("낮 12시")).toEqual({ answer: "낮 12시" });
  });

  it("비었거나 공백뿐이면 막는다", () => {
    expect(checkAnswer("")).toEqual({ error: "답안을 입력해 주세요" });
    expect(checkAnswer("   ")).toEqual({ error: "답안을 입력해 주세요" });
    expect(checkAnswer(undefined)).toEqual({ error: "답안을 입력해 주세요" });
  });

  it("50자를 넘으면 막는다", () => {
    expect(checkAnswer("가".repeat(MAX_ANSWER_LENGTH))).toEqual({
      answer: "가".repeat(MAX_ANSWER_LENGTH),
    });
    expect("error" in checkAnswer("가".repeat(MAX_ANSWER_LENGTH + 1))).toBe(true);
  });
});

describe("fillBlank", () => {
  const body = ["승강기를 이용할 수 없으니", "계단을 이용해 주세요"];

  it("처음 나온 한 곳만 빈칸으로 바꾼다", () => {
    expect(fillBlank(body, "이용")).toEqual([
      `승강기를 ${BLANK}할 수 없으니`,
      "계단을 이용해 주세요",
    ]);
  });

  it("빈칸 글자가 지문에 남지 않는다 (한 번만 나올 때)", () => {
    const out = fillBlank(["점검 중 운행 중지"], "운행");
    expect(out.join("")).not.toContain("운행");
  });

  it("빈칸이 없는 문제는 지문을 그대로 둔다", () => {
    expect(fillBlank(body, undefined)).toBe(body);
  });

  it("빈칸 글자를 못 찾으면 멈춘다", () => {
    expect(() => fillBlank(body, "운행")).toThrow();
  });
});
