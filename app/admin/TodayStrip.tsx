"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { type AdminScenario } from "@/app/lib/scenario-admin";
import { ROUND_MAX_SCORE, stepPoints } from "@/app/lib/scenario-points";

import { LABEL } from "./ui";

// 진행 중인 회차 상태 (#99, #100).
// 이 제품의 한 회차는 "100점짜리 문제 묶음"이다. 그 하나가 준비됐는지가 운영의 전부라
// 어느 탭에 있든 화면 맨 위에 붙여 둔다. 눌러 볼 필요 없이 늘 보이게.

interface AdminRound {
  id: string;
  startsAt: string;
  endsAt: string;
  scenarioIds: string[];
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function scenarioPoints(s: AdminScenario): number {
  return s.steps.reduce((sum, step) => sum + stepPoints(step), 0);
}

export default function TodayStrip({
  scenarios,
}: {
  scenarios: AdminScenario[];
}) {
  const [current, setCurrent] = useState<AdminRound | null>(null);
  const [next, setNext] = useState<AdminRound | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/schedule")
      .then((r) => r.json() as Promise<{ rounds?: AdminRound[] }>)
      .then((d) => {
        if (!alive) return;
        const now = new Date().toISOString();
        const list = d.rounds ?? [];
        setCurrent(
          list.find((r) => r.startsAt <= now && now < r.endsAt) ?? null,
        );
        // 목록은 시작 내림차순이라 아직 시작 안 한 것 중 마지막이 가장 가까운 다음 회차다.
        setNext(list.filter((r) => r.startsAt > now).at(-1) ?? null);
        setLoaded(true);
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const byId = new Map(scenarios.map((s) => [s.id, s]));
  const picked = (current?.scenarioIds ?? []).map((id) => byId.get(id));
  const points = picked.reduce(
    (sum, s) => sum + (s ? scenarioPoints(s) : 0),
    0,
  );
  const steps = picked.reduce((sum, s) => sum + (s?.steps.length ?? 0), 0);
  const held = picked.some((s) => s && s.status !== "published");

  // 세 가지만 구분한다: 못 나감 / 나가는데 손볼 곳 있음 / 나갈 준비 끝.
  const state = !loaded
    ? { tone: "wait", text: "확인 중" }
    : !current
      ? { tone: "bad", text: "진행 중인 회차 없음" }
      : picked.length === 0
        ? { tone: "bad", text: "편성 없음" }
        : points !== ROUND_MAX_SCORE
          ? {
              tone: "bad",
              text: `${ROUND_MAX_SCORE - points > 0 ? "부족" : "초과"} ${Math.abs(ROUND_MAX_SCORE - points)}점`,
            }
          : held
            ? { tone: "warn", text: "게시 안 된 문제 있음" }
            : { tone: "good", text: "내보낼 준비 끝" };

  const toneClass =
    state.tone === "good"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : state.tone === "warn"
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : state.tone === "bad"
          ? "bg-red-500/15 text-red-600 dark:text-red-400"
          : "bg-surface-muted text-muted";

  return (
    <Link
      href="/admin/schedule"
      className="flex w-full items-center gap-5 border-b border-border px-6 py-3 text-left transition-colors hover:bg-surface-muted/60"
    >
      <span className="shrink-0">
        <span className={LABEL}>진행 중인 회차</span>
        <span className="mt-0.5 block text-sm font-bold tabular-nums">
          {current
            ? `${fmt(current.startsAt)} ~ ${fmt(current.endsAt)}`
            : next
              ? `다음 회차 ${fmt(next.startsAt)}`
              : "—"}
        </span>
      </span>

      {/* 100점 게이지 — 하루 만점이 정확히 100이어야 게시된다. 넘치면 반대쪽으로 붉게. */}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between">
          <span className="text-xs text-muted">
            문제 {picked.length}편 · 문항 {steps}개
          </span>
          <span className="text-xs font-bold tabular-nums">
            {points} / {ROUND_MAX_SCORE}점
          </span>
        </span>
        <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <span
            className={`block h-full rounded-full transition-all ${
              points === ROUND_MAX_SCORE
                ? "bg-emerald-500"
                : points > ROUND_MAX_SCORE
                  ? "bg-red-500"
                  : "bg-brand"
            }`}
            style={{
              width: `${Math.min(100, (points / ROUND_MAX_SCORE) * 100)}%`,
            }}
          />
        </span>
      </span>

      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${toneClass}`}
      >
        {state.text}
      </span>
    </Link>
  );
}
