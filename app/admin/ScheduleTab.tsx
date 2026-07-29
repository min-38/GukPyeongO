"use client";

import { useEffect, useState } from "react";

import { stepPoints } from "@/app/lib/scenario-points";
import {
  type AdminScenario,
  SCENARIO_KIND_LABELS,
} from "@/app/lib/scenario-admin";

import { moved, RowButtons } from "./ListRow";
import PageHeader from "./PageHeader";
import { INPUT } from "./ui";

// 날짜별 편성 (#87).
// 유저는 slug로 시나리오에 직접 가지 않는다 — 그날 편성된 문제들을 순서대로 푼다.
// 여기서 날짜를 고르고, 그날 낼 시나리오와 순서를 정한다.

// 하루치 만점. 서버도 이 값으로 막는다(app/api/admin/schedule/route.ts).
// 등급이 획득 점수 ÷ 만점이라(#89) 날마다 만점이 다르면 같은 등급이 다른 실력을 뜻하게 된다.
const DAILY_MAX_SCORE = 100;

// 시나리오 하나의 배점 합 — 문항 난이도로 정해진다.
function scenarioPoints(s: AdminScenario): number {
  return s.steps.reduce(
    (sum, step) =>
      sum + stepPoints(step),
    0,
  );
}

interface ScheduleDay {
  date: string;
  scenarioIds: string[];
}

// 오늘 날짜(KST). 서버 시간대가 UTC여도 하루가 어긋나지 않게 오프셋을 더해 계산한다.
function todayKst(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export default function ScheduleTab({
  scenarios,
}: {
  scenarios: AdminScenario[];
}) {
  const [date, setDate] = useState(todayKst());
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  // 편집 중인 목록. null이면 아직 손대지 않았다는 뜻이라 서버에서 읽은 편성을 그대로 쓴다.
  // effect로 서버 상태를 복사해두면 날짜를 바꿀 때마다 렌더가 두 번 돈다.
  const [draft, setDraft] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // 편성된 날짜 전체를 한 번 읽어둔다. 날짜를 옮겨 다닐 때마다 서버를 다시 부르지 않아도 된다.
  useEffect(() => {
    let active = true;
    fetch("/api/admin/schedule")
      .then((r) => r.json() as Promise<{ schedule?: ScheduleDay[] }>)
      .then((d) => {
        if (!active) return;
        setSchedule(d.schedule ?? []);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const saved0 = schedule.find((s) => s.date === date)?.scenarioIds ?? [];
  const picked = draft ?? saved0;
  const setPicked = (next: string[]) => {
    setDraft(next);
    setSaved(false);
  };

  // 날짜를 옮기면 편집분을 버리고 그날 편성을 보여준다.
  const changeDate = (next: string) => {
    setDate(next);
    setDraft(null);
    setSaved(false);
    setError(null);
  };

  const published = scenarios.filter((s) => s.status === "published");
  const byId = new Map(scenarios.map((s) => [s.id, s]));
  const byIdPoints = new Map(scenarios.map((s) => [s.id, scenarioPoints(s)]));
  const addable = published.filter((s) => !picked.includes(s.id));

  // 그날 만점. 100이 아니면 게시하지 않는다(서버도 같은 값으로 막는다).
  const totalPoints = picked.reduce(
    (sum, id) => sum + (byIdPoints.get(id) ?? 0),
    0,
  );
  const canSave = picked.length === 0 || totalPoints === DAILY_MAX_SCORE;

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, scenarioIds: picked }),
    });
    setSaving(false);
    const data = (await res.json()) as { error?: string };
    if (!res.ok) return setError(data.error ?? "저장에 실패했습니다.");

    // 목록 쪽 상태도 맞춰둔다 — 다시 불러오지 않아도 날짜 목록이 최신이 된다.
    setSchedule((prev) => {
      const rest = prev.filter((s) => s.date !== date);
      return picked.length === 0
        ? rest
        : [...rest, { date, scenarioIds: picked }].sort((a, b) =>
            a.date.localeCompare(b.date),
          );
    });
    setDraft(null);
    setSaved(true);
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted">불러오는 중…</p>;
  }

  return (
    <section>
      <PageHeader
        title="편성"
        desc="그날 낼 문제와 순서를 정합니다. 게시 상태인 문제만 편성할 수 있습니다."
      />

      <div className="flex gap-6">
        {/* 편성된 날짜들 — 어느 날이 비어 있는지 한눈에 */}
        <aside className="w-52 shrink-0">
          <label className="text-xs font-medium text-muted">
            날짜
            <input
              type="date"
              value={date}
              onChange={(e) => changeDate(e.target.value)}
              className={`mt-1 w-full ${INPUT}`}
            />
          </label>

          <p className="mt-4 text-xs font-medium text-muted">
            편성된 날짜 ({schedule.length})
          </p>
          <ul className="mt-1 flex flex-col">
            {schedule.map((s) => (
              <li key={s.date}>
                <button
                  type="button"
                  onClick={() => changeDate(s.date)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm ${
                    s.date === date
                      ? "bg-brand/10 font-bold text-brand"
                      : "text-muted hover:bg-surface-muted"
                  }`}
                >
                  <span>{s.date}</span>
                  <span className="text-xs">{s.scenarioIds.length}개</span>
                </button>
              </li>
            ))}
            {schedule.length === 0 && (
              <li className="py-3 text-xs text-muted">
                편성된 날짜가 없습니다.
              </li>
            )}
          </ul>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">
              {date} <span className="text-muted">· {picked.length}개</span>
              <span
                className={`ml-2 text-sm ${
                  canSave
                    ? "text-muted"
                    : "font-bold text-amber-600 dark:text-amber-400"
                }`}
              >
                {totalPoints} / {DAILY_MAX_SCORE}점
              </span>
            </h3>
            <button
              type="button"
              onClick={save}
              disabled={saving || !canSave}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-brand-foreground disabled:opacity-50"
            >
              {saving ? "저장 중…" : "편성 저장"}
            </button>
          </div>

          <ol className="mt-3 flex flex-col gap-2">
            {picked.map((id, i) => {
              const s = byId.get(id);
              return (
                <li
                  key={id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
                >
                  <span className="w-5 text-sm font-bold text-muted">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                      {s ? SCENARIO_KIND_LABELS[s.kind] : "삭제된 문제"}
                    </span>
                    <span className="ml-2 font-medium">
                      {s?.title || s?.sourceLabel || "(제목 없음)"}
                    </span>
                    <span className="ml-2 text-xs text-muted">
                      문항 {s?.steps.length ?? 0}개 · {byIdPoints.get(id) ?? 0}
                      점
                    </span>
                  </span>
                  <RowButtons
                    onUp={() => setPicked(moved(picked, i, -1))}
                    onDown={() => setPicked(moved(picked, i, 1))}
                    onRemove={() => setPicked(picked.filter((_, j) => j !== i))}
                  />
                </li>
              );
            })}
            {picked.length === 0 && (
              <li className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted">
                이 날짜에 편성된 문제가 없습니다.
              </li>
            )}
          </ol>

          <div className="mt-4">
            <p className="text-xs font-medium text-muted">추가할 문제</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {addable.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setPicked([...picked, s.id])}
                    className="rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
                  >
                    + {SCENARIO_KIND_LABELS[s.kind]} · {s.title || s.slug}{" "}
                    <span className="text-muted">{scenarioPoints(s)}점</span>
                  </button>
                </li>
              ))}
              {addable.length === 0 && (
                <li className="text-xs text-muted">
                  추가할 수 있는 게시 문제가 없습니다.
                </li>
              )}
            </ul>
          </div>

          {!canSave && (
            <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
              하루 만점은 {DAILY_MAX_SCORE}점이어야 게시할 수 있습니다. 지금{" "}
              {totalPoints}점 ({totalPoints > DAILY_MAX_SCORE ? "초과" : "부족"}{" "}
              {Math.abs(DAILY_MAX_SCORE - totalPoints)}점).
            </p>
          )}
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          {saved && (
            <p className="mt-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              편성을 저장했습니다.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
