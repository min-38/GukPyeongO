import { describe, expect, it } from "vitest";

import { gradeBlurb, gradeTheme } from "./quiz";

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// 등급 아래 한 줄 (#95).
describe("gradeBlurb", () => {
  it("모든 등급이 문장을 갖는다", () => {
    for (const grade of GRADES) {
      expect(gradeTheme(grade).blurbs.length).toBeGreaterThan(0);
      expect(gradeBlurb(grade, 0)).toBeTruthy();
    }
  });

  it("어떤 seed에도 그 등급의 문장만 돌려준다", () => {
    for (const grade of GRADES) {
      const list = gradeTheme(grade).blurbs;
      for (const seed of [-7, 0, 1, 1_753_000_000, 2.9]) {
        expect(list).toContain(gradeBlurb(grade, seed));
      }
    }
  });

  it("같은 결과는 같은 문장을 준다 — 새로고침에 문장이 바뀌면 안 된다", () => {
    expect(gradeBlurb(3, 12345)).toBe(gradeBlurb(3, 12345));
  });

  it("seed가 달라지면 문장도 돌아간다", () => {
    const list = gradeTheme(5).blurbs;
    const seen = new Set(list.map((_, i) => gradeBlurb(5, i)));
    expect(seen.size).toBe(list.length);
  });
});
