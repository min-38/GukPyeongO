"use client";

import Link from "next/link";

import { type AdminStepRating } from "@/app/lib/quiz";
import { stepPoints } from "@/app/lib/scenario-points";

import PageHeader from "./PageHeader";
import { LABEL } from "./ui";

import {
  type AdminScenario,
  correctRate,
  SCENARIO_KIND_LABELS,
  SCENARIO_KINDS,
  SCENARIO_STATUS_LABELS,
  SCENARIO_STATUSES,
  type ScenarioKind,
  type ScenarioStatus,
} from "@/app/lib/scenario-admin";

import { useEffect, useState } from "react";

// 시나리오 목록 (#75, #66).
// 편집은 별도 페이지(/admin/scenarios/…)에서 한다 — 지문·문항이 길어 목록에 펼치면 화면을 다 먹는다.

const TH = `pb-2 pr-4 ${LABEL}`;
// 제목만 줄바꿈되고 나머지 열은 한 줄로 — 안 그러면 좁은 열에서 글자가 세로로 쌓인다.
const NOWRAP = "whitespace-nowrap";

export default function ScenarioTab({
  scenarios,
  onDeleted,
}: {
  scenarios: AdminScenario[];
  onDeleted: (id: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<ScenarioStatus | "all">(
    "all",
  );
  const [kindFilter, setKindFilter] = useState<ScenarioKind | "all">("all");
  // 유저가 남긴 별점(#96) — 어떤 문제가 좋았는지가 목록에서 바로 보여야 다음 편성에 쓴다.
  const [ratings, setRatings] = useState<Map<string, { avg: number; n: number }>>(
    new Map(),
  );

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/step-feedback")
      .then((r) => r.json() as Promise<{ ratings?: AdminStepRating[] }>)
      .then((d) => {
        if (!alive) return;
        // 문항별 평균을 문제 단위로 다시 묶는다. 평가 수로 가중해야 문항 하나가 판을 흔들지 않는다.
        const acc = new Map<string, { sum: number; n: number }>();
        for (const r of d.ratings ?? []) {
          const cur = acc.get(r.scenarioId) ?? { sum: 0, n: 0 };
          cur.sum += r.average * r.count;
          cur.n += r.count;
          acc.set(r.scenarioId, cur);
        }
        setRatings(
          new Map(
            [...acc].map(([id, v]) => [
              id,
              { avg: Math.round((v.sum / v.n) * 10) / 10, n: v.n },
            ]),
          ),
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // 목록은 서버가 최근 수정순으로 준다(#99). 여기서는 걸러내기만 한다.
  const filtered = scenarios.filter(
    (s) =>
      (statusFilter === "all" || s.status === statusFilter) &&
      (kindFilter === "all" || s.kind === kindFilter),
  );

  async function remove(s: AdminScenario) {
    if (
      !confirm(
        `'${s.title || s.slug}' 문제를 삭제할까요? 문항도 함께 지워집니다.`,
      )
    )
      return;
    const res = await fetch(`/api/admin/scenarios?id=${s.id}`, {
      method: "DELETE",
    });
    if (res.ok) onDeleted(s.id);
  }

  return (
    <section>
      <PageHeader
        title="문제"
        count={filtered.length}
        desc="최근에 고친 문제가 위로 옵니다."
        actions={
          <Link
            href="/admin/scenarios/new"
            className="rounded-xl bg-brand px-3 py-1.5 text-sm font-bold text-brand-foreground"
          >
            문제 추가
          </Link>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {(["all", ...SCENARIO_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              statusFilter === s
                ? "bg-brand text-brand-foreground"
                : "bg-surface-muted text-muted"
            }`}
          >
            {s === "all" ? "전체" : SCENARIO_STATUS_LABELS[s]}{" "}
            {s === "all"
              ? scenarios.length
              : scenarios.filter((x) => x.status === s).length}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {(["all", ...SCENARIO_KINDS] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKindFilter(k)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              kindFilter === k
                ? "bg-brand text-brand-foreground"
                : "bg-surface-muted text-muted"
            }`}
          >
            {k === "all" ? "모든 유형" : SCENARIO_KIND_LABELS[k]}{" "}
            {k === "all"
              ? scenarios.length
              : scenarios.filter((x) => x.kind === k).length}
          </button>
        ))}
      </div>

      {/* 데스크톱 전용 화면이라 폭을 다 쓴다(#66, #99). 한 줄이 문제 하나 —
          제목·유형·문항·배점·상태가 한눈에 비교되어야 편성할 때 고르기 쉽다. */}
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className={TH}>제목</th>
            <th className={`${TH} ${NOWRAP}`}>유형</th>
            <th className={`${TH} ${NOWRAP} text-right`}>문항</th>
            <th className={`${TH} ${NOWRAP} text-right`}>배점</th>
            <th className={`${TH} ${NOWRAP} text-right`}>정답률</th>
            <th className={`${TH} ${NOWRAP} text-right`}>별점</th>
            <th className={`${TH} ${NOWRAP}`}>상태</th>
            <th className={`${TH} ${NOWRAP}`} />
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => {
            const points = s.steps.reduce(
              (sum, step) => sum + stepPoints(step),
              0,
            );
            // 문항별 정답률의 평균 — 이 문제가 통째로 어려웠는지 가늠하는 값.
            const rates = s.steps
              .map((step) => correctRate(step))
              .filter((r): r is number => r !== null);
            const rating = ratings.get(s.id);
            const avgRate = rates.length
              ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
              : null;

            return (
              <tr
                key={s.id}
                className="border-b border-border align-middle hover:bg-surface-muted/50"
              >
                <td className="w-full py-3 pr-4">
                  <Link
                    href={`/admin/scenarios/${s.id}`}
                    className="font-bold hover:text-brand"
                  >
                    {s.title || "(제목 없음)"}
                  </Link>
                  <p className="text-xs text-muted">/{s.slug}</p>
                </td>
                <td className={`py-3 pr-4 text-muted ${NOWRAP}`}>
                  {SCENARIO_KIND_LABELS[s.kind]}
                </td>
                <td className={`py-3 pr-4 text-right tabular-nums ${NOWRAP}`}>
                  {s.steps.length}
                </td>
                <td className={`py-3 pr-4 text-right tabular-nums ${NOWRAP}`}>
                  {points}
                </td>
                <td
                  className={`py-3 pr-4 text-right tabular-nums text-muted ${NOWRAP}`}
                >
                  {avgRate === null ? "—" : `${avgRate}%`}
                </td>
                <td className={`py-3 pr-4 text-right tabular-nums ${NOWRAP}`}>
                  {rating ? (
                    <span className="font-bold text-amber-500">
                      ★ {rating.avg.toFixed(1)}
                      <span className="ml-1 text-[11px] font-medium text-muted">
                        {rating.n}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className={`py-3 pr-4 ${NOWRAP}`}>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      s.status === "published"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : s.status === "held"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-surface-muted text-muted"
                    }`}
                  >
                    {SCENARIO_STATUS_LABELS[s.status]}
                  </span>
                </td>
                <td className={`py-3 text-right ${NOWRAP}`}>
                  {/* 지우는 일은 되돌릴 수 없다 — 글자로 크게 두면 눌러야 할 것처럼 보인다.
                      작게 두고, 누르면 확인부터 받는다. */}
                  <button
                    onClick={() => remove(s)}
                    aria-label={`${s.title || s.slug} 삭제`}
                    title="삭제"
                    className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-red-500/10 hover:text-red-500"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-muted">
          이 조건에 맞는 문제가 없습니다.
        </p>
      )}
    </section>
  );
}
