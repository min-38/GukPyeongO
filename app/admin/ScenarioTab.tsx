"use client";

import { useState } from "react";

import { DIFFICULTY_LABELS } from "@/app/lib/quiz";
import {
  type AdminScenario,
  type AdminScenarioStep,
  correctRate,
  SCENARIO_KIND_LABELS,
  SCENARIO_KINDS,
  SCENARIO_STATUS_LABELS,
  SCENARIO_STATUSES,
  type ScenarioKind,
  type ScenarioStatus,
} from "@/app/lib/scenario-admin";

// 시나리오 탭 (#75). 목록 + 공통 필드·문항 편집.
// 유형별 지문 편집기는 kind에 따라 갈아끼우는 슬롯으로만 두고(지금은 JSON),
// 실제 편집기는 #79~#83에서 채운다.

// 입력 요소 공용 스타일. 필드마다 폭·글꼴만 덧붙인다.
const INPUT =
  "rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground";

const EMPTY_STEP: AdminScenarioStep = {
  id: "",
  stepKey: "",
  type: "",
  prompt: "",
  choices: ["", ""],
  answerIndex: 0,
  difficulty: 2,
  timeLimitSec: 30,
  showUpTo: null,
  attempts: 0,
  correctCount: 0,
};

function StepEditor({
  step,
  index,
  isEmail,
  onChange,
  onRemove,
  onMove,
}: {
  step: AdminScenarioStep;
  index: number;
  isEmail: boolean;
  onChange: (next: AdminScenarioStep) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const set = <K extends keyof AdminScenarioStep>(
    key: K,
    value: AdminScenarioStep[K],
  ) => onChange({ ...step, [key]: value });

  const rate = correctRate(step);

  return (
    <li className="rounded-2xl border border-border bg-surface-muted/30 p-4">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-bold">
          {index + 1}번 문항
          {rate !== null && (
            <span className="ml-2 font-medium">정답률 {rate}%</span>
          )}
        </span>
        <span className="flex gap-3">
          <button
            type="button"
            onClick={() => onMove(-1)}
            className="font-medium"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            className="font-medium"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="font-medium text-red-500"
          >
            삭제
          </button>
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs font-medium text-muted">
          식별자
          <input
            value={step.stepKey}
            onChange={(e) => set("stepKey", e.target.value)}
            placeholder="gist"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
        <label className="text-xs font-medium text-muted">
          분류
          <input
            value={step.type}
            onChange={(e) => set("type", e.target.value)}
            placeholder="주제"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
      </div>

      <label className="mt-2 block text-xs font-medium text-muted">
        질문
        <textarea
          value={step.prompt}
          onChange={(e) => set("prompt", e.target.value)}
          rows={2}
          className={`mt-1 w-full ${INPUT}`}
        />
      </label>

      <div className="mt-2 flex flex-col gap-2">
        {step.choices.map((choice, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name={`answer-${index}`}
              checked={step.answerIndex === i}
              onChange={() => set("answerIndex", i)}
              title="정답"
            />
            <input
              value={choice}
              onChange={(e) =>
                set(
                  "choices",
                  step.choices.map((c, j) => (j === i ? e.target.value : c)),
                )
              }
              placeholder={`보기 ${i + 1}`}
              className={`flex-1 ${INPUT}`}
            />
            {step.choices.length > 2 && (
              <button
                type="button"
                onClick={() => {
                  const next = step.choices.filter((_, j) => j !== i);
                  onChange({
                    ...step,
                    choices: next,
                    answerIndex: Math.min(step.answerIndex, next.length - 1),
                  });
                }}
                className="text-xs text-muted"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => set("choices", [...step.choices, ""])}
          className="self-start text-xs font-medium text-brand"
        >
          + 보기 추가
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <label className="text-xs font-medium text-muted">
          난이도
          <select
            value={step.difficulty}
            onChange={(e) => set("difficulty", Number(e.target.value))}
            className={`mt-1 block ${INPUT}`}
          >
            {[1, 2, 3].map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABELS[d] ?? d}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-muted">
          제한시간(초)
          <input
            type="number"
            min={1}
            value={step.timeLimitSec}
            onChange={(e) => set("timeLimitSec", Number(e.target.value))}
            className={`mt-1 block w-28 ${INPUT}`}
          />
        </label>
        {isEmail && (
          <label className="text-xs font-medium text-muted">
            공개 범위(메일 수)
            <input
              type="number"
              min={1}
              value={step.showUpTo ?? ""}
              onChange={(e) =>
                set(
                  "showUpTo",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              placeholder="전체"
              className={`mt-1 block w-28 ${INPUT}`}
            />
          </label>
        )}
      </div>
    </li>
  );
}

function ScenarioForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: AdminScenario | null;
  onSaved: (s: AdminScenario) => void;
  onCancel: () => void;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [kind, setKind] = useState<ScenarioKind>(initial?.kind ?? "doc");
  const [sourceLabel, setSourceLabel] = useState(initial?.sourceLabel ?? "");
  const [status, setStatus] = useState<ScenarioStatus>(
    initial?.status ?? "draft",
  );
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(initial?.payload ?? {}, null, 2),
  );
  const [steps, setSteps] = useState<AdminScenarioStep[]>(
    initial?.steps ?? [{ ...EMPTY_STEP }],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function moveStep(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= steps.length) return;
    const next = [...steps];
    [next[index], next[to]] = [next[to], next[index]];
    setSteps(next);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let payload: unknown;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      return setError("지문 JSON을 해석할 수 없습니다.");
    }

    setSaving(true);
    const res = await fetch("/api/admin/scenarios", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(initial ? { id: initial.id } : {}),
        slug,
        kind,
        sourceLabel,
        status,
        sortOrder,
        payload,
        steps,
      }),
    });
    setSaving(false);

    const data = (await res.json()) as {
      scenario?: AdminScenario;
      error?: string;
    };
    if (!res.ok || !data.scenario) {
      return setError(data.error ?? "저장에 실패했습니다.");
    }
    onSaved(data.scenario);
  }

  return (
    <form
      onSubmit={save}
      className="rounded-2xl border border-border bg-surface p-4"
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium text-muted">
          slug (라우트 키)
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="news"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
        <label className="text-xs font-medium text-muted">
          유형
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ScenarioKind)}
            className={`mt-1 w-full ${INPUT}`}
          >
            {SCENARIO_KINDS.map((k) => (
              <option key={k} value={k}>
                {SCENARIO_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-muted">
          표시 라벨
          <input
            value={sourceLabel}
            onChange={(e) => setSourceLabel(e.target.value)}
            placeholder="국평오일보"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-muted">
            상태
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ScenarioStatus)}
              className={`mt-1 w-full ${INPUT}`}
            >
              {SCENARIO_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {SCENARIO_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-muted">
            정렬
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className={`mt-1 w-full ${INPUT}`}
            />
          </label>
        </div>
      </div>

      {/* 유형별 지문 편집기가 들어올 자리. 지금은 JSON 그대로 다룬다(#79~#83에서 교체). */}
      <label className="mt-3 block text-xs font-medium text-muted">
        지문 ({SCENARIO_KIND_LABELS[kind]}) — 전용 편집기는 준비 중, 지금은 JSON
        <textarea
          value={payloadText}
          onChange={(e) => setPayloadText(e.target.value)}
          rows={10}
          spellCheck={false}
          className={`mt-1 w-full font-mono !text-xs ${INPUT}`}
        />
      </label>

      <div className="mt-4 flex items-center justify-between">
        <h3 className="text-sm font-bold">문항 ({steps.length})</h3>
        <button
          type="button"
          onClick={() => setSteps([...steps, { ...EMPTY_STEP }])}
          className="text-xs font-medium text-brand"
        >
          + 문항 추가
        </button>
      </div>
      <ul className="mt-2 flex flex-col gap-3">
        {steps.map((step, i) => (
          <StepEditor
            key={i}
            step={step}
            index={i}
            isEmail={kind === "email"}
            onChange={(next) =>
              setSteps(steps.map((s, j) => (j === i ? next : s)))
            }
            onRemove={() => setSteps(steps.filter((_, j) => j !== i))}
            onMove={(dir) => moveStep(i, dir)}
          />
        ))}
      </ul>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-brand-foreground disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-surface-muted px-4 py-2 text-sm font-medium text-muted"
        >
          취소
        </button>
      </div>
    </form>
  );
}

export default function ScenarioTab({
  scenarios,
  onSaved,
  onDeleted,
}: {
  scenarios: AdminScenario[];
  onSaved: (s: AdminScenario) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState<AdminScenario | "new" | null>(null);
  const [statusFilter, setStatusFilter] = useState<ScenarioStatus | "all">(
    "all",
  );

  const filtered =
    statusFilter === "all"
      ? scenarios
      : scenarios.filter((s) => s.status === statusFilter);

  async function remove(s: AdminScenario) {
    if (!confirm(`'${s.slug}' 시나리오를 삭제할까요? 문항도 함께 지워집니다.`))
      return;
    const res = await fetch(`/api/admin/scenarios?id=${s.id}`, {
      method: "DELETE",
    });
    if (res.ok) onDeleted(s.id);
  }

  function handleSaved(s: AdminScenario) {
    onSaved(s);
    setEditing(null);
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          시나리오 <span className="text-muted">({filtered.length})</span>
        </h2>
        {editing === null && (
          <button
            onClick={() => setEditing("new")}
            className="rounded-xl bg-brand px-3 py-1.5 text-sm font-semibold text-brand-foreground"
          >
            + 시나리오 추가
          </button>
        )}
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

      {editing === "new" && (
        <div className="mt-4">
          <ScenarioForm
            initial={null}
            onSaved={handleSaved}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {filtered.map((s) =>
          editing !== "new" && editing?.id === s.id ? (
            <ScenarioForm
              key={s.id}
              initial={s}
              onSaved={handleSaved}
              onCancel={() => setEditing(null)}
            />
          ) : (
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
                  <button
                    onClick={() => setEditing(s)}
                    className="font-medium text-brand"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => remove(s)}
                    className="font-medium text-red-500"
                  >
                    삭제
                  </button>
                </span>
              </div>

              <p className="mt-2 font-medium">
                {s.sourceLabel || "(라벨 없음)"}
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
          ),
        )}
        {filtered.length === 0 && (
          <li className="py-8 text-center text-sm text-muted">
            시나리오가 없습니다.
          </li>
        )}
      </ul>
    </section>
  );
}
