import { describe, expect, it } from "vitest";

import { pickStratified } from "./quiz";

interface Q {
  id: string;
  type: string;
  difficulty: number;
}

// 유형 t, 난이도 d 문제를 n개 만든다
function make(type: string, difficulty: number, n: number): Q[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${type}-${difficulty}-${i}`,
    type,
    difficulty,
  }));
}

const mix = { 1: 3, 2: 4, 3: 3 };

function countByDifficulty(qs: Q[]): Record<number, number> {
  const c: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  for (const q of qs) c[q.difficulty] += 1;
  return c;
}

function maxPerType(qs: Q[]): number {
  const c = new Map<string, number>();
  for (const q of qs) c.set(q.type, (c.get(q.type) ?? 0) + 1);
  return Math.max(...c.values());
}

describe("pickStratified", () => {
  // 난이도·유형이 모두 충분한 풀
  const richPool = [
    ...make("time", 1, 10),
    ...make("hanja", 1, 10),
    ...make("notice", 2, 10),
    ...make("confusable", 2, 10),
    ...make("idiom", 3, 10),
    ...make("literary", 3, 10),
  ];

  it("요청한 개수만큼 출제한다", () => {
    expect(pickStratified(richPool, 10, mix)).toHaveLength(10);
  });

  it("풀이 충분하면 난이도 분포(3·4·3)를 정확히 지킨다", () => {
    for (let i = 0; i < 50; i++) {
      const picked = pickStratified(richPool, 10, mix);
      expect(countByDifficulty(picked)).toEqual({ 1: 3, 2: 4, 3: 3 });
    }
  });

  it("중복 없이 서로 다른 문제를 출제한다", () => {
    const picked = pickStratified(richPool, 10, mix);
    expect(new Set(picked.map((q) => q.id)).size).toBe(picked.length);
  });

  it("유형이 다양하면 한 유형으로 쏠리지 않는다", () => {
    // 6개 유형 × 10문제 = 매 응시 유형당 최대 2개 수준으로 분산되어야 한다
    for (let i = 0; i < 50; i++) {
      const picked = pickStratified(richPool, 10, mix);
      expect(maxPerType(picked)).toBeLessThanOrEqual(3);
    }
  });

  it("특정 난이도가 부족하면 남은 문제로 개수를 채운다", () => {
    // 어려움(3) 문제가 전혀 없어도 10개를 채워야 한다
    const noHard = [...make("time", 1, 10), ...make("notice", 2, 10)];
    const picked = pickStratified(noHard, 10, mix);
    expect(picked).toHaveLength(10);
    expect(countByDifficulty(picked)[3]).toBe(0);
  });

  it("풀이 요청 개수보다 적으면 있는 만큼만 출제한다", () => {
    const small = [...make("time", 1, 2), ...make("notice", 2, 3)];
    const picked = pickStratified(small, 10, mix);
    expect(picked).toHaveLength(5);
  });

  it("모든 문제가 같은 난이도여도 개수를 채운다(기존 데이터 호환)", () => {
    const allMedium = [
      ...make("time", 2, 5),
      ...make("hanja", 2, 5),
      ...make("notice", 2, 5),
    ];
    const picked = pickStratified(allMedium, 10, mix);
    expect(picked).toHaveLength(10);
    expect(countByDifficulty(picked)).toEqual({ 1: 0, 2: 10, 3: 0 });
  });
});
