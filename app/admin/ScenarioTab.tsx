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

import { INPUT } from "./ui";

import ChatPayloadEditor from "./ChatPayloadEditor";
import ChatStepFields from "./ChatStepFields";
import CommunityPayloadEditor from "./CommunityPayloadEditor";
import DocPayloadEditor from "./DocPayloadEditor";
import EmailPayloadEditor from "./EmailPayloadEditor";
import ScenarioPreview from "./ScenarioPreview";
import StoryPayloadEditor from "./StoryPayloadEditor";

// 시나리오 탭 (#75). 목록 + 공통 필드·문항 편집.
// 유형별 지문 편집기는 kind에 따라 갈아끼우는 슬롯으로만 두고(지금은 JSON),
// 실제 편집기는 #79~#83에서 채운다.

// 유형별 지문 편집기. 없는 유형은 JSON으로 다룬다(#80~#82에서 채운다).
const PAYLOAD_EDITORS: Partial<
  Record<
    ScenarioKind,
    (props: {
      payload: Record<string, unknown>;
      // 서사 편집기는 감상 어휘·읽기 시간 규칙을 미리 보여주려 문항도 본다.
      steps: AdminScenarioStep[];
      onChange: (next: Record<string, unknown>) => void;
    }) => React.ReactElement
  >
> = {
  doc: DocPayloadEditor,
  community: CommunityPayloadEditor,
  chat: ChatPayloadEditor,
  email: EmailPayloadEditor,
  story: StoryPayloadEditor,
};

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
  extra: {},
  attempts: 0,
  correctCount: 0,
};

function StepEditor({
  step,
  index,
  kind,
  chatSpeaker,
  onChange,
  onRemove,
  onMove,
}: {
  step: AdminScenarioStep;
  index: number;
  kind: ScenarioKind;
  chatSpeaker: string;
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
        {kind === "email" && (
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

      {kind === "chat" && (
        <ChatStepFields
          extra={step.extra}
          defaultSpeaker={chatSpeaker}
          onChange={(next) => set("extra", next)}
        />
      )}
    </li>
  );
}

function ScenarioForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: AdminScenario | null;
  onSaved: (s: AdminScenario, warnings: string[]) => void;
  onCancel: () => void;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [kind, setKind] = useState<ScenarioKind>(initial?.kind ?? "doc");
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
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);

  // 전용 편집기가 있는 유형이면 지문을 객체로 넘긴다.
  // 원본은 payloadText 하나만 두고 편집기는 그때그때 직렬화한다 — 두 벌이 어긋나지 않게.
  // JSON이 깨져 있으면 편집기를 열 수 없으므로 JSON 입력으로 되돌린다.
  const editorPayload = (() => {
    if (!PAYLOAD_EDITORS[kind]) return null;
    try {
      const parsed = JSON.parse(payloadText) as Record<string, unknown>;
      return typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
        ? parsed
        : null;
    } catch {
      return null;
    }
  })();
  const PayloadEditor = PAYLOAD_EDITORS[kind];
  // 메신저 문항의 맥락 대사는 기본 화자를 지문의 상대 화자로 채운다.
  const chatSpeaker =
    typeof (editorPayload as { speaker?: unknown } | null)?.speaker === "string"
      ? (editorPayload as { speaker: string }).speaker
      : "";

  // 표시 라벨의 정본은 지문 안에 있다(화면이 그걸 읽는다). 여기선 보여주기만 한다.
  const derivedLabel = (() => {
    try {
      const p = JSON.parse(payloadText) as {
        sourceLabel?: unknown;
        boardName?: unknown;
      };
      if (typeof p.sourceLabel === "string") return p.sourceLabel;
      if (typeof p.boardName === "string") return p.boardName;
    } catch {
      // JSON이 깨져 있으면 라벨을 알 수 없다
    }
    return "";
  })();

  // 미리보기에 넘길 지문. 열 때 JSON을 한 번 해석해 두고, 닫으면 비운다.
  function togglePreview() {
    if (preview) return setPreview(null);
    try {
      setPreview(JSON.parse(payloadText) as Record<string, unknown>);
      setError(null);
    } catch {
      setError("지문 JSON을 해석할 수 없어 미리보기를 열 수 없습니다.");
    }
  }

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
      warnings?: string[];
    };
    if (!res.ok || !data.scenario) {
      return setError(data.error ?? "저장에 실패했습니다.");
    }
    // 경고는 저장을 막지 않는다 — 저장한 뒤 확인만 시킨다(#76).
    onSaved(data.scenario, data.warnings ?? []);
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
          표시 라벨 (지문에서 가져온다)
          <input
            value={derivedLabel}
            readOnly
            placeholder="지문 편집기에서 입력"
            className={`mt-1 w-full ${INPUT} opacity-60`}
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

      {/* 유형별 지문 편집기 슬롯. 전용 편집기가 없는 유형은 JSON으로 다룬다(#79~#82에서 교체). */}
      <div className="mt-3">
        <p className="text-xs font-medium text-muted">
          지문 ({SCENARIO_KIND_LABELS[kind]})
          {!editorPayload && " — 전용 편집기는 준비 중, 지금은 JSON"}
        </p>
        {editorPayload && PayloadEditor ? (
          <div className="mt-1">
            <PayloadEditor
              payload={editorPayload}
              steps={steps}
              onChange={(next) => setPayloadText(JSON.stringify(next, null, 2))}
            />
          </div>
        ) : (
          <textarea
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            rows={10}
            spellCheck={false}
            className={`mt-1 w-full font-mono !text-xs ${INPUT}`}
          />
        )}
      </div>

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
            kind={kind}
            chatSpeaker={chatSpeaker}
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
          onClick={togglePreview}
          className="rounded-xl bg-surface-muted px-4 py-2 text-sm font-medium text-muted"
        >
          {preview ? "미리보기 닫기" : "미리보기"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-surface-muted px-4 py-2 text-sm font-medium text-muted"
        >
          취소
        </button>
      </div>

      {/* 저장 전 편집 중인 내용 그대로 확인한다(#77). */}
      {preview && (
        <ScenarioPreview
          kind={kind}
          payload={preview}
          steps={steps}
          onClose={() => setPreview(null)}
        />
      )}
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
  // 저장은 됐지만 확인이 필요한 것들(#76). 다음 저장 때까지 남겨둔다.
  const [warnings, setWarnings] = useState<string[]>([]);

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

  function handleSaved(s: AdminScenario, saveWarnings: string[]) {
    onSaved(s);
    setWarnings(saveWarnings);
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

      {warnings.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          {warnings.map((w, i) => (
            <li key={i}>⚠️ {w}</li>
          ))}
        </ul>
      )}

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
