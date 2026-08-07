"use client";

import { type GradeRank, gradeTheme } from "@/app/lib/quiz";

// 등급별 응시자 수 막대그래프.
// 등급 막대(GradeBar)는 내가 선 자리를 보여주고, 이건 사람들이 어디에 몰렸는지를 보여준다.
// 꾹 눌러야 나오던 인원을 한눈에 펼쳐 둔 것이다.

const MAX_H = 56; // 가장 많은 등급의 막대 높이(px)

export default function GradeDistribution({
  grade,
  rank,
}: {
  grade: number;
  rank: GradeRank;
}) {
  // 옛 회차 결과에는 등급별 인원이 없다.
  if (rank.counts.length === 0) return null;

  const max = Math.max(1, ...rank.counts);

  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-medium text-muted">등급별 응시자</p>

      <div className="flex items-end gap-1">
        {rank.counts.map((count, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] tabular-nums text-muted">{count}</span>
            <div
              className="w-full rounded-t-sm"
              style={{
                height: `${Math.max(2, (count / max) * MAX_H)}px`,
                // 내 등급만 진하게. 나머지는 같은 색을 알파로 낮춘다 — 등급색은 그대로 읽히게.
                // 20%는 라이트 테마의 흰 배경에서 막대가 묻혀 40%로 둔다.
                backgroundColor: `${gradeTheme(i + 1).color}${i + 1 === grade ? "" : "66"}`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="mt-1 flex gap-1">
        {rank.counts.map((_, i) => (
          <span
            key={i}
            className={`flex-1 text-center text-[10px] font-bold tabular-nums ${
              i + 1 === grade ? "text-foreground" : "text-muted"
            }`}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
