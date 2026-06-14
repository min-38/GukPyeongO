import { describe, expect, it } from "vitest";

import type { ScoreRequestItem } from "./quiz";
import { type AnswerKey, gradeForCorrect, scoreSubmission } from "./scoring";

const answerKey: AnswerKey = {
  q1: { type: "time", answerIndex: 0 },
  q2: { type: "time", answerIndex: 1 },
  q3: { type: "hanja", answerIndex: 0 },
  q4: { type: "hanja", answerIndex: 1 },
  q5: { type: "notice", answerIndex: 0 },
};

function pick(questionId: string, choiceIndex: number | null, reactionMs = 1000): ScoreRequestItem {
  return { questionId, choiceIndex, reactionMs };
}

describe("gradeForCorrect", () => {
  it("만점은 1등급", () => {
    expect(gradeForCorrect(10, 10)).toBe(1);
  });

  it("0점은 9등급", () => {
    expect(gradeForCorrect(0, 10)).toBe(9);
  });

  it("등급은 항상 1~9 범위", () => {
    for (let c = 0; c <= 10; c++) {
      const g = gradeForCorrect(c, 10);
      expect(g).toBeGreaterThanOrEqual(1);
      expect(g).toBeLessThanOrEqual(9);
    }
  });
});

describe("scoreSubmission", () => {
  it("모두 정답이면 만점·1등급", () => {
    const items = [
      pick("q1", 0),
      pick("q2", 1),
      pick("q3", 0),
      pick("q4", 1),
      pick("q5", 0),
    ];
    const r = scoreSubmission(answerKey, items);
    expect(r.correctCount).toBe(5);
    expect(r.totalCount).toBe(5);
    expect(r.grade).toBe(1);
    expect(r.weakTypes).toEqual([]);
  });

  it("미응답(null)과 오답은 오답 처리", () => {
    const items = [
      pick("q1", 0), // 정답
      pick("q2", 0), // 오답
      pick("q3", null), // 미응답
      pick("q4", 1), // 정답
      pick("q5", 9), // 오답
    ];
    const r = scoreSubmission(answerKey, items);
    expect(r.correctCount).toBe(2);
  });

  it("정답률 50% 미만 유형을 취약 유형으로 반환", () => {
    const items = [
      pick("q1", 9), // time 오답
      pick("q2", 9), // time 오답
      pick("q3", 0), // hanja 정답
      pick("q4", 1), // hanja 정답
      pick("q5", 9), // notice 오답
    ];
    const r = scoreSubmission(answerKey, items);
    expect(r.weakTypes).toContain("time"); // 0/2
    expect(r.weakTypes).toContain("notice"); // 0/1
    expect(r.weakTypes).not.toContain("hanja"); // 2/2
  });

  it("평균 반응속도는 응답한 문항만 평균", () => {
    const items = [
      pick("q1", 0, 1000),
      pick("q2", 1, 3000),
      pick("q3", null, 0), // 미응답은 평균에서 제외
    ];
    const r = scoreSubmission(answerKey, items);
    expect(r.avgReactionMs).toBe(2000);
  });
});
