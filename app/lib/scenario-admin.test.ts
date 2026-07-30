import { describe, expect, it } from "vitest";

import { type AdminScenarioStep, removeChoice } from "./scenario-admin";

function step(choices: string[], answerIndex: number): AdminScenarioStep {
  return {
    id: "",
    stepKey: "gist",
    type: "주제",
    prompt: "무엇을 말하고 있나요?",
    choices,
    answerIndex,
    difficulty: 2,
    points: 10,
    timeLimitSec: 30,
    showUpTo: null,
    extra: {},
    attempts: 0,
    correctCount: 0,
  };
}

// 정답을 놓치면 출제자도 모르는 채로 오답이 정답으로 나간다 — 자리 계산만 검사한다.
describe("removeChoice", () => {
  it("정답보다 앞 보기를 지우면 정답이 한 칸 당겨진다", () => {
    const next = removeChoice(step(["A", "B", "C"], 1), 0);
    expect(next.choices).toEqual(["B", "C"]);
    expect(next.choices[next.answerIndex]).toBe("B");
  });

  it("정답보다 뒤 보기를 지우면 정답 자리는 그대로다", () => {
    const next = removeChoice(step(["A", "B", "C"], 1), 2);
    expect(next.choices).toEqual(["A", "B"]);
    expect(next.choices[next.answerIndex]).toBe("B");
  });

  it("정답 자체를 지우면 첫 보기로 돌아간다", () => {
    const next = removeChoice(step(["A", "B", "C"], 1), 1);
    expect(next.choices).toEqual(["A", "C"]);
    expect(next.answerIndex).toBe(0);
  });

  it("정답 자리는 언제나 남은 보기 안을 가리킨다", () => {
    const choices = ["A", "B", "C", "D"];
    for (let answer = 0; answer < choices.length; answer += 1) {
      for (let removed = 0; removed < choices.length; removed += 1) {
        const next = removeChoice(step(choices, answer), removed);
        expect(next.answerIndex).toBeGreaterThanOrEqual(0);
        expect(next.answerIndex).toBeLessThan(next.choices.length);
      }
    }
  });
});
