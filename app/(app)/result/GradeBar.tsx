"use client";

import { useRef, useState } from "react";

import { type GradeRank, gradeTheme } from "@/app/lib/quiz";
import { gradeSegments } from "@/app/lib/scoring";

// 등급 분포 막대 (#95).
// 왼쪽이 1등급이다. 득점률 축을 그대로 그리면 1등급이 오른쪽 끝에 가는데,
// 등급은 1이 위라 왼쪽부터 읽는 눈과 어긋난다. 그래서 축을 뒤집어 그린다 — x = 100 - 득점률.
// 칸 폭과 경계는 등급컷(GRADE_CUTS) 그대로다. 9등급이 넓고 2등급이 좁은 건 등급컷이 그런 것.

// 견준 사람이 이만큼도 안 되면 상위 %를 적지 않는다. 응시자 서넛일 때
// "상위 33%"는 등수를 백분율로 부풀린 말이라 읽는 사람을 속인다.
const MIN_POPULATION = 20;

// 길게 누른 것으로 볼 시간. 스크롤하려고 스친 손가락에는 반응하지 않을 만큼.
const LONG_PRESS_MS = 350;

const x = (scorePercent: number) => 100 - scorePercent;

export default function GradeBar({
  grade,
  rank,
}: {
  grade: number;
  rank: GradeRank;
}) {
  const segments = gradeSegments();
  // 지금 인원을 보여줄 등급. PC는 마우스를 올리면, 모바일은 꾹 누르면 잡힌다.
  const [active, setActive] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  function clearTimer() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }

  const activeSegment = segments.find((s) => s.grade === active);

  return (
    <div>
      {/* 칸마다 그 등급의 테마색. 내 등급만 진하게 두고 나머지는 흐려 위치가 먼저 읽히게. */}
      <div className="relative h-5 touch-none select-none">
        {/* 인원 말풍선. 막대 위로 띄워 손가락에 가리지 않게 한다.
            자리를 차지하지 않게 겹쳐 올린다 — 빈 줄로 두면 안 눌렀을 때 위가 휑하다. */}
        {activeSegment && (
          <span
            className="absolute bottom-full z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-[11px] font-bold text-surface"
            style={{
              left: `clamp(2.5rem, ${x((activeSegment.from + activeSegment.to) / 2)}%, calc(100% - 2.5rem))`,
            }}
          >
            {activeSegment.grade}등급 {rank.counts[activeSegment.grade - 1] ?? 0}
            명
          </span>
        )}
        {segments.map((s) => (
          <button
            key={s.grade}
            type="button"
            aria-label={`${s.grade}등급 ${rank.counts[s.grade - 1] ?? 0}명`}
            className={`absolute top-0 grid h-5 place-items-center border-r border-surface text-[10px] font-bold first:border-r-0 ${
              s.grade === grade ? "text-white" : "text-muted"
            }`}
            style={{
              left: `${x(s.to)}%`,
              width: `${s.to - s.from}%`,
              // 내 등급이 아닌 칸은 같은 색을 알파로 낮춘다. 요소 opacity를 쓰면 숫자까지 흐려진다.
              backgroundColor: `${gradeTheme(s.grade).color}${s.grade === grade ? "" : "33"}`,
            }}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") setActive(s.grade);
            }}
            onPointerLeave={() => {
              clearTimer();
              setActive(null);
            }}
            onPointerDown={(e) => {
              if (e.pointerType === "mouse") return;
              clearTimer();
              timer.current = window.setTimeout(
                () => setActive(s.grade),
                LONG_PRESS_MS,
              );
            }}
            onPointerUp={() => {
              clearTimer();
              setActive(null);
            }}
            onPointerCancel={() => {
              clearTimer();
              setActive(null);
            }}
          >
            {s.grade}
          </button>
        ))}
      </div>

      {/* 내가 선 자리. 막대 밖으로 나가지 않게 좌우 끝에서 자기 폭만큼 당겨준다. */}
      <div className="relative h-3">
        <span
          className="absolute -translate-x-1/2 text-[10px] leading-3 text-red-500"
          style={{
            left: `clamp(0.4rem, ${x(rank.percent)}%, calc(100% - 0.4rem))`,
          }}
          aria-hidden
        >
          ▲
        </span>
      </div>

      {/* 등급이 갈리는 점수. 경계마다 하나씩 — 몇 점부터 그 등급인지 눈으로 세어볼 수 있게. */}
      <div className="relative h-4">
        {segments
          .filter((s) => s.from > 0)
          .map((s) => (
            <span
              key={s.grade}
              className="absolute -translate-x-1/2 text-[10px] tabular-nums leading-4 text-muted"
              style={{ left: `${x(s.from)}%` }}
            >
              {s.from}
            </span>
          ))}
      </div>

      <p className="mt-1 text-center text-sm text-muted">
        {rank.total >= MIN_POPULATION
          ? `금일 응시자 ${rank.total.toLocaleString()}명 중 상위 ${rank.topPercent}%`
          : `지금까지 ${rank.total.toLocaleString()}명이 응시했어요`}
      </p>
    </div>
  );
}
