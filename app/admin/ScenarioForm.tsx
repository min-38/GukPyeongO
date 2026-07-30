"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  type AdminScenario,
  type AdminScenarioStep,
  correctRate,
  isBodylessKind,
  removeChoice,
  SCENARIO_KIND_LABELS,
  SCENARIO_KINDS,
  SCENARIO_STATUS_LABELS,
  SCENARIO_STATUSES,
  type ScenarioKind,
  type ScenarioStatus,
} from "@/app/lib/scenario-admin";

import { CARD, INPUT, LABEL } from "./ui";

import ChatStepFields from "./ChatStepFields";
import CommunityPayloadEditor from "./CommunityPayloadEditor";
import DocPayloadEditor from "./DocPayloadEditor";
import EmailPayloadEditor from "./EmailPayloadEditor";
import { stepPoints } from "@/app/lib/scenario-points";

import LivePreview from "./LivePreview";
import StoryPayloadEditor from "./StoryPayloadEditor";

// 시나리오 편집 폼 (#66).
// 목록 안에 펼치던 것을 별도 페이지(/admin/scenarios/new · /admin/scenarios/[id])로 옮겼다.
// 지문·문항이 길어 목록에 끼워 넣으면 화면을 다 잡아먹었다.

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
  notice: DocPayloadEditor,
  news: DocPayloadEditor,
  contract: DocPayloadEditor,
  manual: DocPayloadEditor,
  community: CommunityPayloadEditor,
  email: EmailPayloadEditor,
  story: StoryPayloadEditor,
};

// 만드는 순서. 번호는 순서를 뜻한다 — 기본을 정해야 지문을, 지문이 있어야 문항을 쓴다.
// 지문이 없는 유형(메신저·어휘)은 지문 단계를 건너뛴다.
type PaneId = "basic" | "payload" | "steps";
function panes(kind: ScenarioKind): { id: PaneId; label: string }[] {
  return [
    { id: "basic" as const, label: "기본" },
    ...(isBodylessKind(kind)
      ? []
      : [{ id: "payload" as const, label: "지문" }]),
    { id: "steps" as const, label: "문항" },
  ];
}

const EMPTY_STEP: AdminScenarioStep = {
  id: "",
  stepKey: "",
  type: "",
  prompt: "",
  choices: ["", ""],
  answerIndex: 0,
  difficulty: 2,
  points: 3,
  timeLimitSec: 30,
  showUpTo: null,
  extra: {},
  attempts: 0,
  correctCount: 0,
};

// 문항을 JSON으로 뽑아 다른 문제에 붙여 넣거나 운영 DB 시드로 옮긴다.
function CopyJsonButton({
  value,
  label,
  className = "font-medium",
}: {
  value: unknown;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard
          .writeText(JSON.stringify(value, null, 2))
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
      }}
      className={className}
    >
      {copied ? "복사됨" : label}
    </button>
  );
}

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

  // 보기를 옮기면 정답도 같이 따라간다. 자리만 바뀌고 정답이 남으면 엉뚱한 보기가 정답이 된다.
  function moveChoice(i: number, dir: -1 | 1) {
    const to = i + dir;
    if (to < 0 || to >= step.choices.length) return;
    const choices = [...step.choices];
    [choices[i], choices[to]] = [choices[to], choices[i]];
    const answerIndex =
      step.answerIndex === i
        ? to
        : step.answerIndex === to
          ? i
          : step.answerIndex;
    onChange({ ...step, choices, answerIndex });
  }

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
          <CopyJsonButton value={step} label="JSON 복사" />
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
            {/* 보기 순서는 적은 그대로 나간다 — 섞지 않으므로 여기 자리가 유저가 보는 자리다. */}
            <span className="flex shrink-0 flex-col leading-none">
              <button
                type="button"
                onClick={() => moveChoice(i, -1)}
                disabled={i === 0}
                aria-label={`보기 ${i + 1} 위로`}
                className="px-1 text-[10px] text-muted disabled:opacity-25"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveChoice(i, 1)}
                disabled={i === step.choices.length - 1}
                aria-label={`보기 ${i + 1} 아래로`}
                className="px-1 text-[10px] text-muted disabled:opacity-25"
              >
                ▼
              </button>
            </span>
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
                onClick={() => onChange(removeChoice(step, i))}
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
          배점(점)
          <input
            type="number"
            min={1}
            max={100}
            value={step.points}
            onChange={(e) => set("points", Number(e.target.value))}
            className={`mt-1 block w-24 ${INPUT}`}
          />
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

      {/* 어휘는 묻는 낱말이 지문 자리에 크게 뜬다 — 질문과 따로 받는다(#101). */}
      {kind === "word" && (
        <label className="mt-3 block text-xs font-medium text-muted">
          낱말 — 화면 가운데 크게 나옵니다
          <input
            value={(step.extra.word as string) ?? ""}
            onChange={(e) => set("extra", { ...step.extra, word: e.target.value })}
            placeholder="사사오입(四捨五入)"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
      )}
    </li>
  );
}

export default function ScenarioForm({
  initial,
}: {
  initial: AdminScenario | null;
}) {
  const router = useRouter();
  // 저장 후 목록으로 튕기지 않는다. 경고(#76)를 보여주고 이어서 고칠 수 있어야 하기 때문.
  const [saved, setSaved] = useState<AdminScenario | null>(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [kind, setKind] = useState<ScenarioKind>(initial?.kind ?? "notice");
  const [status, setStatus] = useState<ScenarioStatus>(
    initial?.status ?? "draft",
  );
  // 목록 순서는 최근 수정순으로 정한다(#99). 기존 값은 그대로 두고 보내기만 한다.
  const sortOrder = initial?.sortOrder ?? 0;
  // 읽기 시간은 유형과 무관하게 지문 전체에 걸리므로 지문 편집기가 아니라 여기서 다룬다(#99).
  const [readSec, setReadSec] = useState<number>(
    Number((initial?.payload as { readSec?: unknown })?.readSec ?? 0),
  );
  // 만드는 순서 — 기본 → 지문 → 문항. 미리보기는 늘 오른쪽에 있다(#99).
  const [paneState, setPane] = useState<PaneId>("basic");
  // 지문 단계를 보던 중 메신저로 바꾸면 없는 탭에 남는다 — 기본으로 되돌린다.
  const pane =
    isBodylessKind(kind) && paneState === "payload" ? "basic" : paneState;
  // 이미 쓰이는 식별자인지 저장 전에 알려준다(#99). 서버도 막지만 눌러본 뒤에야 알면 늦다.
  const [taken, setTaken] = useState<{ slug: string; title: string }[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/scenarios")
      .then((r) => r.json() as Promise<{ scenarios?: AdminScenario[] }>)
      .then((d) => {
        if (!alive) return;
        setTaken(
          (d.scenarios ?? [])
            .filter((x) => x.id !== initial?.id)
            .map((x) => ({ slug: x.slug, title: x.title || x.slug })),
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [initial?.id]);
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(initial?.payload ?? {}, null, 2),
  );
  const [steps, setSteps] = useState<AdminScenarioStep[]>(
    initial?.steps ?? [{ ...EMPTY_STEP }],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  // 전용 편집기가 있는 유형이면 지문을 객체로 넘긴다.
  // 원본은 payloadText 하나만 두고 편집기는 그때그때 직렬화한다 — 두 벌이 어긋나지 않게.
  // JSON이 깨져 있으면 편집기를 열 수 없으므로 JSON 입력으로 되돌린다.
  const editorPayload = (() => {
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


  // 미리보기에 넘길 지문 — 읽기 시간까지 얹어 실제로 나갈 모양 그대로 본다.
  const livePayload = editorPayload
    ? { ...editorPayload, ...(readSec > 0 ? { readSec } : {}) }
    : null;
  const totalPoints = steps.reduce((sum, st) => sum + stepPoints(st), 0);
  const clash = taken.find((t) => t.slug === slug.trim());

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
    setDone(false);

    if (clash) {
      setPane("basic");
      return setError(
        `식별자 '${clash.slug}'는 이미 '${clash.title}'가 쓰고 있습니다.`,
      );
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(payloadText) as Record<string, unknown>;
    } catch {
      return setError("지문 JSON을 해석할 수 없습니다.");
    }
    // 읽기 시간은 폼에서 따로 받아 지문에 얹는다. 0이면 넣지 않아 글 길이로 계산된다.
    if (readSec > 0) payload = { ...payload, readSec };
    else delete payload.readSec;

    setSaving(true);
    let res: Response;
    let data: {
      scenario?: AdminScenario;
      error?: string;
      warnings?: string[];
    };
    try {
      res = await fetch("/api/admin/scenarios", {
        method: saved ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(saved ? { id: saved.id } : {}),
          title,
          slug,
          kind,
          status,
          sortOrder,
          payload,
          steps,
        }),
      });
      data = await res.json();
    } catch {
      // 여기서 빠져나가면 "저장 중…"에 잠긴 채 새로고침 전까지 다시 저장할 수 없다.
      // 새로고침하면 쓰던 내용이 통째로 날아가므로, 버튼을 반드시 되돌려 준다.
      return setError("저장하지 못했습니다. 연결을 확인하고 다시 눌러주세요.");
    } finally {
      setSaving(false);
    }

    if (!res.ok || !data.scenario) {
      return setError(data.error ?? "저장에 실패했습니다.");
    }
    // 경고는 저장을 막지 않는다 — 저장한 뒤 확인만 시킨다(#76).
    setSaved(data.scenario);
    setWarnings(data.warnings ?? []);
    setDone(true);
    // 새로 만든 시나리오면 주소를 편집 주소로 바꿔 새로고침해도 이어서 고칠 수 있게 한다.
    if (!initial) router.replace(`/admin/scenarios/${data.scenario.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="flex gap-6">
      {/* 왼쪽 — 만드는 순서대로 세 단계. 한 화면에 다 쌓으면 어디를 고치는지가 흐려진다(#99). */}
      <div className="min-w-0 flex-1">
        <div className="flex gap-1.5">
          {panes(kind).map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setPane(s.id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                pane === s.id
                  ? "bg-brand text-brand-foreground"
                  : "bg-surface-muted text-muted hover:text-foreground"
              }`}
            >
              <span className="tabular-nums opacity-60">{i + 1}</span>
              {s.label}
            </button>
          ))}
        </div>

        <div className={`mt-4 ${CARD} p-4`}>
          {pane === "basic" && (
            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-muted">
                제목 — 목록·편성에서 이 문제를 알아볼 이름
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="청년 지원사업 모집 공고 — 낚시 조항"
                  className={`mt-1 w-full ${INPUT}`}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-muted">
                  식별자 — 채점·다시 보기가 문항을 찾는 열쇠
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="news"
                    className={`mt-1 w-full ${INPUT} ${
                      clash ? "border-red-500" : ""
                    }`}
                  />
                  {clash && (
                    <span className="mt-1 block font-medium text-red-500">
                      이미 &lsquo;{clash.title}&rsquo;가 쓰고 있습니다.
                    </span>
                  )}
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
                  읽기 시간(초) — 비우면 글 길이로 자동 계산
                  <input
                    type="number"
                    min={0}
                    value={readSec}
                    onChange={(e) => setReadSec(Number(e.target.value))}
                    className={`mt-1 w-full ${INPUT}`}
                  />
                </label>
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
              </div>

              {/* 메신저는 지문 단계가 없다 — 시나리오가 갖는 값이 이것 하나뿐이라 여기서 받는다. */}
              {kind === "chat" && (
                <label className="text-xs font-medium text-muted">
                  상대 화자 — 반응 대사가 이 이름으로 나갑니다
                  <input
                    value={chatSpeaker}
                    onChange={(e) =>
                      setPayloadText(
                        JSON.stringify(
                          { ...(editorPayload ?? {}), speaker: e.target.value },
                          null,
                          2,
                        ),
                      )
                    }
                    placeholder="김부장"
                    className={`mt-1 w-full ${INPUT}`}
                  />
                </label>
              )}
            </div>
          )}

          {pane === "payload" &&
            (editorPayload && PayloadEditor ? (
              <PayloadEditor
                payload={editorPayload}
                steps={steps}
                onChange={(next) =>
                  setPayloadText(JSON.stringify(next, null, 2))
                }
              />
            ) : (
              <>
                <p className="mb-2 text-xs text-muted">
                  이 유형은 전용 편집기가 없어 JSON으로 다룹니다.
                </p>
                <textarea
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                  rows={20}
                  spellCheck={false}
                  className={`w-full font-mono !text-xs ${INPUT}`}
                />
              </>
            ))}

          {pane === "steps" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">
                  문항 <span className="tabular-nums text-muted">{steps.length}</span>
                  <span className="ml-2 text-xs font-medium text-muted">
                    합계 {totalPoints}점
                  </span>
                </p>
                <span className="flex items-center gap-3">
                  {steps.length > 0 && (
                    <CopyJsonButton
                      value={steps}
                      label="전체 JSON 복사"
                      className="text-xs font-bold text-muted"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setSteps([...steps, { ...EMPTY_STEP }])}
                    className="text-xs font-bold text-brand"
                  >
                    문항 추가
                  </button>
                </span>
              </div>
              <ul className="mt-3 flex flex-col gap-3">
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
            </>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        {done && (
          <div className="mt-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
            <p className="font-bold text-emerald-700 dark:text-emerald-300">
              저장했습니다.
            </p>
            {warnings.length > 0 && (
              <ul className="mt-1 flex flex-col gap-0.5 text-xs text-amber-600 dark:text-amber-400">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={saving || !!clash}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-brand-foreground disabled:opacity-50"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
          <Link
            href="/admin/scenarios"
            className="rounded-xl bg-surface-muted px-4 py-2 text-sm font-medium text-muted"
          >
            목록으로
          </Link>
        </div>
      </div>

      {/* 오른쪽 — 지금 쓰고 있는 그대로. 스크롤을 따라다녀 내려가며 고칠 수 있다. */}
      <aside className="sticky top-6 hidden w-[26rem] shrink-0 self-start xl:block">
        <p className={`mb-2 ${LABEL}`}>이렇게 나옵니다</p>
        <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto">
          <LivePreview kind={kind} payload={livePayload} steps={steps} />
        </div>
      </aside>
    </form>
  );
}
