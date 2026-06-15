import { describe, expect, it } from "vitest";

import type { ScoreRequestItem } from "./quiz";
import { type AnswerKey, gradeForCorrect, scoreSubmission } from "./scoring";

const mc = (type: AnswerKey[string]["type"], answerIndex: number) =>
  ({ type, format: "multiple_choice", answerIndex, answers: [] }) as const;

const answerKey: AnswerKey = {
  q1: mc("time", 0),
  q2: mc("time", 1),
  q3: mc("hanja", 0),
  q4: mc("hanja", 1),
  q5: mc("notice", 0),
};

function pick(
  questionId: string,
  choiceIndex: number | null,
  reactionMs = 1000
): ScoreRequestItem {
  return { questionId, choiceIndex, text: null, reactionMs };
}

function typeText(
  questionId: string,
  text: string | null,
  reactionMs = 1000
): ScoreRequestItem {
  return { questionId, choiceIndex: null, text, reactionMs };
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

describe("scoreSubmission - 단답형(short_answer)", () => {
  const saKey: AnswerKey = {
    s1: {
      type: "time",
      format: "short_answer",
      answerIndex: 0,
      answers: ["오늘"],
    },
    s2: {
      type: "time",
      format: "short_answer",
      answerIndex: 0,
      answers: ["2일 뒤", "이틀 뒤"],
    },
  };

  it("정규화(공백/대소문자) 후 일치하면 정답", () => {
    const r = scoreSubmission(saKey, [
      typeText("s1", "  오늘 "), // 공백 무시 → 정답
      typeText("s2", "2일뒤"), // 공백 제거 후 "2일 뒤"와 일치 → 정답
    ]);
    expect(r.correctCount).toBe(2);
  });

  it("허용 정답 목록 중 하나라도 맞으면 정답", () => {
    const r = scoreSubmission(saKey, [typeText("s2", "이틀 뒤")]);
    expect(r.correctCount).toBe(1);
  });

  it("빈 문자열/오답은 오답 처리", () => {
    const r = scoreSubmission(saKey, [
      typeText("s1", "  "), // 공백만 → 미응답
      typeText("s2", "내일"), // 오답
    ]);
    expect(r.correctCount).toBe(0);
  });

  it("객관식과 단답형 혼합 채점", () => {
    const mixed: AnswerKey = { q1: mc("time", 0), s1: saKey.s1 };
    const r = scoreSubmission(mixed, [pick("q1", 0), typeText("s1", "오늘")]);
    expect(r.correctCount).toBe(2);
    expect(r.totalCount).toBe(2);
    expect(r.grade).toBe(1);
  });
});

describe("scoreSubmission - 띄어쓰기(spacing)", () => {
  const spKey: AnswerKey = {
    p1: {
      type: "confusable",
      format: "spacing",
      answerIndex: 0,
      answers: ["나는 학교에 간다"],
    },
  };

  it("띄어쓰기가 정확하면 정답 (앞뒤/중복 공백은 관대)", () => {
    const r = scoreSubmission(spKey, [typeText("p1", "  나는  학교에 간다 ")]);
    expect(r.correctCount).toBe(1);
  });

  it("띄어쓰기가 틀리면 오답 (공백을 무시하지 않음)", () => {
    const r = scoreSubmission(spKey, [typeText("p1", "나는학교에간다")]);
    expect(r.correctCount).toBe(0);
  });
});
