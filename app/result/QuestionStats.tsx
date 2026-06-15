"use client";

import { useEffect, useState } from "react";

import { QUESTION_TYPE_LABELS, type QuestionStat } from "@/app/lib/quiz";

export default function QuestionStats() {
  const [stats, setStats] = useState<QuestionStat[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/stats")
      .then((res) =>
        res.ok
          ? (res.json() as Promise<{ stats: QuestionStat[] }>)
          : Promise.reject(new Error())
      )
      .then((data) => {
        if (active) setStats(data.stats);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (failed) return null;

  return (
    <section className="mt-10">
      <h3 className="text-xl font-extrabold">📊 다른 사람들은?</h3>
      <p className="mt-1 text-sm text-muted">문제별 정답률이에요.</p>

      <ul className="mt-4 flex flex-col gap-3">
        {stats === null
          ? Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-surface-muted"
              />
            ))
          : stats.map((s, i) => (
              <li
                key={s.id}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-snug">
                    <span className="text-muted">Q{i + 1}. </span>
                    {s.prompt}
                  </p>
                  <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                    {QUESTION_TYPE_LABELS[s.type]}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${s.correctRate}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-extrabold tabular-nums">
                    {s.correctRate}%
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-muted">
                  {s.attempts === 0
                    ? "아직 응답이 없어요"
                    : `${s.attempts}명 중 ${s.correctCount}명 정답`}
                </p>
              </li>
            ))}
      </ul>
    </section>
  );
}
