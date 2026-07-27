import { describe, expect, it } from "vitest";

import { GRADE_CUTS, gradeForScore, gradeSegments } from "./scoring";

// 등급 분포 막대의 눈금 (#95). 막대와 실제 등급 판정이 어긋나면
// "1등급인데 표식은 2등급 칸에" 같은 화면이 나온다.
describe("gradeSegments", () => {
  const segments = gradeSegments();

  it("9개 칸이 0부터 100까지 빈틈없이 이어진다", () => {
    expect(segments).toHaveLength(9);
    expect(segments[8].from).toBe(0);
    expect(segments[0].to).toBe(100);
    for (let i = 0; i < segments.length - 1; i += 1) {
      expect(segments[i].from).toBe(segments[i + 1].to);
    }
  });

  it("칸의 시작 득점률이 그 등급으로 판정된다", () => {
    for (const s of segments) {
      expect(gradeForScore(s.from, 100)).toBe(s.grade);
    }
  });

  it("칸 경계 바로 아래는 한 등급 낮다", () => {
    for (const s of segments.filter((x) => x.from > 0)) {
      expect(gradeForScore(s.from - 0.1, 100)).toBe(s.grade + 1);
    }
  });

  it("등급컷을 그대로 쓴다", () => {
    expect(segments.map((s) => s.from)).toEqual([...GRADE_CUTS]);
  });
});
