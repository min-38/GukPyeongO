"use client";

import Link from "next/link";

import { DIFFICULTY_LABELS } from "@/app/lib/quiz";
import {
  type AdminScenario,
  correctRate,
  SCENARIO_KIND_LABELS,
  SCENARIO_STATUS_LABELS,
  SCENARIO_STATUSES,
  type ScenarioStatus,
} from "@/app/lib/scenario-admin";

import { useState } from "react";

// 시나리오 목록 (#75, #66).
// 편집은 별도 페이지(/admin/scenarios/…)에서 한다 — 지문·문항이 길어 목록에 펼치면 화면을 다 먹는다.

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

  const filtered =
    statusFilter === "all"
      ? scenarios
      : scenarios.filter((s) => s.status === statusFilter);

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          문제 <span className="text-muted">({filtered.length})</span>
        </h2>
        <Link
          href="/admin/scenarios/new"
          className="rounded-xl bg-brand px-3 py-1.5 text-sm font-semibold text-brand-foreground"
        >
          + 문제 추가
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
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

      <ul className="mt-4 flex flex-col gap-3">
        {filtered.map((s) => (
          <li
            key={s.id}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand/10 px-2 py-0.5 font-bold text-brand">
                  {SCENARIO_KIND_LABELS[s.kind]}
                </span>
                <span>{SCENARIO_STATUS_LABELS[s.status]}</span>
                <span>· 문항 {s.steps.length}개</span>
                <span>· /{s.slug}</span>
              </span>
              <span className="flex gap-3">
                <Link
                  href={`/admin/scenarios/${s.id}`}
                  className="font-medium text-brand"
                >
                  수정
                </Link>
                <button
                  onClick={() => remove(s)}
                  className="font-medium text-red-500"
                >
                  삭제
                </button>
              </span>
            </div>

            <p className="mt-2 font-bold">{s.title || "(제목 없음)"}</p>
            <p className="text-xs text-muted">
              화면 라벨 {s.sourceLabel || "(없음)"}
            </p>

            <ol className="mt-2 flex flex-col gap-1 text-sm text-muted">
              {s.steps.map((step) => {
                const rate = correctRate(step);
                return (
                  <li key={step.id || step.stepKey} className="truncate">
                    <span className="text-foreground">{step.prompt}</span>
                    <span className="ml-2 text-xs">
                      {step.type} · {DIFFICULTY_LABELS[step.difficulty] ?? ""}
                      {rate !== null && ` · 정답률 ${rate}%`}
                    </span>
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-8 text-center text-sm text-muted">
            문제가 없습니다.
          </li>
        )}
      </ul>
    </section>
  );
}
