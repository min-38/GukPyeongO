"use client";

import Link from "next/link";
import { useState } from "react";

import { POINTS_BY_DIFFICULTY } from "@/app/lib/scenario-points";
import {
  type AdminScenario,
  SCENARIO_KIND_DESCRIPTIONS,
  SCENARIO_KIND_LABELS,
  SCENARIO_KINDS,
  SCENARIO_STATUS_LABELS,
  type ScenarioKind,
} from "@/app/lib/scenario-admin";

// 유형 페이지 (#92).
// 유형은 표면 컴포넌트와 1:1로 묶여 있어 여기서 새로 만들 수는 없다.
// 어떤 유형에 문제가 몇 개 있고 무엇이 모자란지 보고, 그 유형의 문제로 바로 가는 자리다.

function points(s: AdminScenario): number {
  return s.steps.reduce(
    (sum, step) =>
      sum + (POINTS_BY_DIFFICULTY[step.difficulty as 1 | 2 | 3] ?? 0),
    0,
  );
}

export default function KindTab({ scenarios }: { scenarios: AdminScenario[] }) {
  const [selected, setSelected] = useState<ScenarioKind>("notice");
  const inKind = scenarios.filter((s) => s.kind === selected);

  return (
    <section>
      <h2 className="text-xl font-bold">유형</h2>
      <p className="mt-1 text-sm text-muted">
        유형은 화면(표면)과 짝지어져 있어 새로 만들 수 없습니다. 문제를 유형별로
        모아 봅니다.
      </p>

      <div className="mt-4 flex gap-6">
        <aside className="w-72 shrink-0">
          <ul className="flex flex-col gap-1">
            {SCENARIO_KINDS.map((kind) => {
              const list = scenarios.filter((s) => s.kind === kind);
              const published = list.filter((s) => s.status === "published");
              return (
                <li key={kind}>
                  <button
                    type="button"
                    onClick={() => setSelected(kind)}
                    className={`w-full rounded-xl px-3 py-2 text-left ${
                      selected === kind
                        ? "bg-brand/10 text-brand"
                        : "hover:bg-surface-muted"
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-bold">
                        {SCENARIO_KIND_LABELS[kind]}
                      </span>
                      <span className="text-xs text-muted">
                        {published.length}/{list.length}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {SCENARIO_KIND_DESCRIPTIONS[kind]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 px-3 text-xs text-muted">게시 / 전체</p>
        </aside>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold">
            {SCENARIO_KIND_LABELS[selected]}{" "}
            <span className="text-muted">· {inKind.length}개</span>
          </h3>

          <ul className="mt-3 flex flex-col gap-2">
            {inKind.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3"
              >
                <span className="min-w-0">
                  <span className="font-medium">
                    {s.title || "(제목 없음)"}
                  </span>
                  <span className="ml-2 text-xs text-muted">
                    {SCENARIO_STATUS_LABELS[s.status]} · 문항 {s.steps.length}개
                    · {points(s)}점 · /{s.slug}
                  </span>
                </span>
                <Link
                  href={`/admin/scenarios/${s.id}`}
                  className="shrink-0 text-sm font-medium text-brand"
                >
                  수정
                </Link>
              </li>
            ))}
            {inKind.length === 0 && (
              <li className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted">
                이 유형의 문제가 없습니다.
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
