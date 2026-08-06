import { describe, expect, it } from "vitest";

import { type AnsweredStep, resumeFrom } from "./today-resume";

// 이어풀기 (#109). "나갔다 돌아왔을 때 어디부터 여는가"를 정하는 셈이다.
// 여기서 틀리면 다 푼 지문을 다시 풀리거나, 안 푼 지문을 건너뛴 채 채점한다.

const scenario = (slug: string, steps: { id: string; points: number }[]) => ({
  slug,
  content: { steps },
});

// 회차 편성: chat1(1문항 5점) → chat(2문항 2점씩) → contract(2문항 3점씩)
const ROUND = [
  scenario("chat1", [{ id: "chat1", points: 5 }]),
  scenario("chat", [
    { id: "m01", points: 2 },
    { id: "m02", points: 2 },
  ]),
  scenario("contract", [
    { id: "c01", points: 3 },
    { id: "c02", points: 3 },
  ]),
];

const answer = (
  slug: string,
  stepKey: string,
  choiceIndex: number | null,
  answerIndex = 1,
): AnsweredStep => ({ slug, stepKey, choiceIndex, answerIndex });

describe("이어풀기 시작 지점", () => {
  it("아무것도 안 풀었으면 처음부터", () => {
    const r = resumeFrom(ROUND, []);
    expect(r.index).toBe(0);
    expect(r.score).toBe(0);
    expect(r.review).toEqual([]);
  });

  it("다 푼 지문 다음부터 연다", () => {
    const r = resumeFrom(ROUND, [
      answer("chat1", "chat1", 1),
      answer("chat", "m01", 1),
      answer("chat", "m02", 1),
    ]);
    expect(r.index).toBe(2);
  });

  it("지문을 반만 풀었으면 그 지문부터 다시 — 건너뛰면 안 푼 문항이 0점으로 굳는다", () => {
    const r = resumeFrom(ROUND, [
      answer("chat1", "chat1", 1),
      answer("chat", "m01", 1), // m02 는 안 풀었다
    ]);
    expect(r.index).toBe(1);
  });

  it("앞 지문을 건너뛰고 뒤를 풀었어도 앞에서 멈춘다", () => {
    // 편성 순서대로 푸는 화면이라 정상적으로는 안 생기지만, 생기면 앞을 먼저 채워야 한다.
    const r = resumeFrom(ROUND, [answer("contract", "c01", 1)]);
    expect(r.index).toBe(0);
  });

  it("전부 풀었으면 지문 수와 같다 — 호출 측이 바로 채점으로 보낸다", () => {
    const r = resumeFrom(ROUND, [
      answer("chat1", "chat1", 1),
      answer("chat", "m01", 1),
      answer("chat", "m02", 1),
      answer("contract", "c01", 1),
      answer("contract", "c02", 1),
    ]);
    expect(r.index).toBe(3);
  });

  it("문항이 없는 지문은 다 푼 것으로 치지 않는다", () => {
    const r = resumeFrom([scenario("empty", [])], []);
    expect(r.index).toBe(0);
  });
});

describe("이어풀기 점수", () => {
  it("맞힌 문항만 더한다", () => {
    const r = resumeFrom(ROUND, [
      answer("chat1", "chat1", 1), // 정답 5점
      answer("chat", "m01", 0), // 오답
      answer("chat", "m02", 1), // 정답 2점
    ]);
    expect(r.index).toBe(2);
    expect(r.score).toBe(7);
  });

  it("무응답(시간 초과)은 오답으로 센다", () => {
    const r = resumeFrom(ROUND, [answer("chat1", "chat1", null)]);
    expect(r.score).toBe(0);
  });

  it("아직 안 연 지문의 점수는 세지 않는다", () => {
    const r = resumeFrom(ROUND, [
      answer("chat1", "chat1", 1),
      answer("chat", "m01", 1), // 이 지문은 미완이라 통째로 제외
    ]);
    expect(r.score).toBe(5);
  });
});

describe("다시 보기 기록 복원", () => {
  it("복원하지 않으면 결과 화면의 앞부분이 빈다 — 푼 문항이 순서대로 담긴다", () => {
    const r = resumeFrom(ROUND, [
      answer("chat", "m02", 0),
      answer("chat", "m01", 1),
      answer("chat1", "chat1", 1),
    ]);
    expect(r.review).toEqual([
      { slug: "chat1", stepKey: "chat1", choiceIndex: 1, answerIndex: 1 },
      { slug: "chat", stepKey: "m01", choiceIndex: 1, answerIndex: 1 },
      { slug: "chat", stepKey: "m02", choiceIndex: 0, answerIndex: 1 },
    ]);
  });
});
