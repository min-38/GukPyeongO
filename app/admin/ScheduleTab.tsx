"use client";

import { useEffect, useState } from "react";

import { isoToKstLocal, kstLocalToIso, plusDaysKstLocal } from "@/app/lib/kst";
import { ROUND_MAX_SCORE, stepPoints } from "@/app/lib/scenario-points";
import {
  type AdminScenario,
  SCENARIO_KIND_LABELS,
} from "@/app/lib/scenario-admin";

import { moved, RowButtons } from "./ListRow";
import PageHeader from "./PageHeader";
import { INPUT } from "./ui";

// 회차 편성 (#87, #100).
// 유저는 slug로 시나리오에 직접 가지 않는다 — 회차에 편성된 문제들을 순서대로 푼다.
// 여기서 회차의 시작·마감 일시를 정하고, 그 회차에 낼 시나리오와 순서를 정한다.

interface AdminRound {
  id: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  scenarioIds: string[];
}

// 시나리오 하나의 배점 합 — 문항 난이도로 정해진다.
function scenarioPoints(s: AdminScenario): number {
  return s.steps.reduce((sum, step) => sum + stepPoints(step), 0);
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ScheduleTab({
  scenarios,
}: {
  scenarios: AdminScenario[];
}) {
  const [rounds, setRounds] = useState<AdminRound[]>([]);
  // 고른 회차. null이면 아직 저장되지 않은 새 회차다.
  const [selected, setSelected] = useState<string | null>(null);
  // datetime-local 값(KST 벽시계). 저장할 때 kstLocalToIso로 못 박는다.
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  // 편집 중인 목록. null이면 아직 손대지 않았다는 뜻이라 서버에서 읽은 편성을 그대로 쓴다.
  const [draft, setDraft] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/schedule")
      .then((r) => r.json() as Promise<{ rounds?: AdminRound[] }>)
      .then((d) => {
        if (!active) return;
        const list = d.rounds ?? [];
        setRounds(list);
        // 처음 열면 가장 최근 회차를 보여준다.
        if (list[0]) {
          setSelected(list[0].id);
          setStartsAt(isoToKstLocal(list[0].startsAt));
          setEndsAt(isoToKstLocal(list[0].endsAt));
        }
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const current = rounds.find((r) => r.id === selected) ?? null;
  const picked = draft ?? current?.scenarioIds ?? [];
  const setPicked = (next: string[]) => {
    setDraft(next);
    setSaved(false);
  };

  function open(round: AdminRound) {
    setSelected(round.id);
    setStartsAt(isoToKstLocal(round.startsAt));
    setEndsAt(isoToKstLocal(round.endsAt));
    setDraft(null);
    setSaved(false);
    setError(null);
  }

  function startNew() {
    setSelected(null);
    setStartsAt(isoToKstLocal(new Date().toISOString()));
    setEndsAt("");
    setDraft([]);
    setSaved(false);
    setError(null);
  }

  const published = scenarios.filter((s) => s.status === "published");
  const byId = new Map(scenarios.map((s) => [s.id, s]));
  const byIdPoints = new Map(scenarios.map((s) => [s.id, scenarioPoints(s)]));
  const addable = published.filter((s) => !picked.includes(s.id));

  // 회차 만점. 100이 아니면 게시하지 않는다(서버도 같은 값으로 막는다).
  const totalPoints = picked.reduce(
    (sum, id) => sum + (byIdPoints.get(id) ?? 0),
    0,
  );
  const pointsOk = picked.length === 0 || totalPoints === ROUND_MAX_SCORE;
  const windowOk = startsAt !== "" && endsAt !== "" && startsAt < endsAt;
  const canSave = pointsOk && windowOk;

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(selected ? { id: selected } : {}),
        startsAt: kstLocalToIso(startsAt),
        endsAt: kstLocalToIso(endsAt),
        scenarioIds: picked,
      }),
    });
    setSaving(false);
    const data = (await res.json()) as { error?: string; round?: AdminRound };
    if (!res.ok || !data.round)
      return setError(data.error ?? "저장에 실패했습니다.");

    const round = data.round;
    setRounds((prev) =>
      [...prev.filter((r) => r.id !== round.id), round].sort((a, b) =>
        b.startsAt.localeCompare(a.startsAt),
      ),
    );
    setSelected(round.id);
    setDraft(null);
    setSaved(true);
  }

  async function remove() {
    if (!selected) return;
    setError(null);
    const res = await fetch(`/api/admin/schedule?id=${selected}`, {
      method: "DELETE",
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) return setError(data.error ?? "삭제에 실패했습니다.");

    const rest = rounds.filter((r) => r.id !== selected);
    setRounds(rest);
    if (rest[0]) open(rest[0]);
    else startNew();
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted">불러오는 중…</p>;
  }

  return (
    <section>
      <PageHeader
        title="편성"
        desc="회차의 시작·마감 일시와 그 회차에 낼 문제를 정합니다. 게시 상태인 문제만 편성할 수 있습니다."
      />

      <div className="flex gap-6">
        <aside className="w-56 shrink-0">
          <button
            type="button"
            onClick={startNew}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm font-bold hover:bg-surface-muted"
          >
            + 새 회차
          </button>

          <p className="mt-4 text-xs font-medium text-muted">
            회차 ({rounds.length})
          </p>
          <ul className="mt-1 flex flex-col">
            {rounds.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => open(r)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                    r.id === selected
                      ? "bg-brand/10 font-bold text-brand"
                      : "text-muted hover:bg-surface-muted"
                  }`}
                >
                  <span className="min-w-0 truncate">
                    {fmt(r.startsAt)} ~ {fmt(r.endsAt)}
                  </span>
                  <span className="shrink-0 text-xs">
                    {r.scenarioIds.length}개
                  </span>
                </button>
              </li>
            ))}
            {rounds.length === 0 && (
              <li className="py-3 text-xs text-muted">회차가 없습니다.</li>
            )}
          </ul>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex items-end gap-3">
            <label className="text-xs font-medium text-muted">
              시작
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => {
                  setStartsAt(e.target.value);
                  setSaved(false);
                }}
                className={`mt-1 w-full ${INPUT}`}
              />
            </label>
            <label className="text-xs font-medium text-muted">
              마감
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => {
                  setEndsAt(e.target.value);
                  setSaved(false);
                }}
                className={`mt-1 w-full ${INPUT}`}
              />
            </label>
            {/* 대부분 일주일짜리라 한 번에 채운다. */}
            <button
              type="button"
              disabled={startsAt === ""}
              onClick={() => {
                setEndsAt(plusDaysKstLocal(startsAt, 7));
                setSaved(false);
              }}
              className="rounded-xl border border-border px-3 py-2 text-sm font-bold hover:bg-surface-muted disabled:opacity-50"
            >
              일주일
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <h3 className="font-bold">
              문제 <span className="text-muted">{picked.length}개</span>
              <span
                className={`ml-2 text-sm ${
                  pointsOk
                    ? "text-muted"
                    : "font-bold text-amber-600 dark:text-amber-400"
                }`}
              >
                {totalPoints} / {ROUND_MAX_SCORE}점
              </span>
            </h3>
            <div className="flex gap-2">
              {selected && (
                <button
                  type="button"
                  onClick={remove}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted hover:bg-surface-muted"
                >
                  회차 삭제
                </button>
              )}
              <button
                type="button"
                onClick={save}
                disabled={saving || !canSave}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-brand-foreground disabled:opacity-50"
              >
                {saving ? "저장 중…" : "편성 저장"}
              </button>
            </div>
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
                이 회차에 편성된 문제가 없습니다.
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

          {!windowOk && (
            <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
              시작과 마감 일시를 정해주세요. 마감은 시작보다 뒤여야 합니다.
            </p>
          )}
          {!pointsOk && (
            <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
              회차 만점은 {ROUND_MAX_SCORE}점이어야 게시할 수 있습니다. 지금{" "}
              {totalPoints}점 ({totalPoints > ROUND_MAX_SCORE ? "초과" : "부족"}{" "}
              {Math.abs(ROUND_MAX_SCORE - totalPoints)}점).
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
