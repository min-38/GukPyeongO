"use client";

import { useMemo, useState } from "react";

import CommunityScenarioView from "@/app/(app)/play/CommunityScenario";
import DocScenarioView from "@/app/(app)/play/DocScenario";
import EmailScenarioView from "@/app/(app)/play/EmailScenario";
import StoryScenarioView from "@/app/(app)/play/StoryScenario";
import { DIFFICULTY_LABELS } from "@/app/lib/quiz";
import {
  type AdminScenarioStep,
  SCENARIO_KIND_LABELS,
  type ScenarioKind,
} from "@/app/lib/scenario-admin";

// 시나리오 미리보기 (#77).
// 시나리오는 타이밍·공개 순서가 있어 텍스트만으로는 완성도를 볼 수 없다.
//   훑어보기 — 지문과 문항·정답을 정적으로 확인(타이머·정답공개 연출 없음)
//   풀어보기 — 실제 표면 컴포넌트를 그대로 돌린다(타이머·공개 순서까지 실물과 동일)
// 저장 전 편집 중인 내용도 그대로 넘겨 볼 수 있다.

type Mode = "read" | "play";

// 어드민 편집 형태 → 표면 컴포넌트가 받는 형태.
// scenarios.server.ts의 조립과 같은 규칙(빈 showUpTo는 필드 자체를 넣지 않는다).
function toSurfaceScenario(
  payload: Record<string, unknown>,
  steps: AdminScenarioStep[],
) {
  return {
    ...payload,
    steps: steps.map((s) => ({
      id: s.stepKey,
      type: s.type,
      prompt: s.prompt,
      choices: s.choices,
      answerIndex: s.answerIndex,
      difficulty: s.difficulty,
      timeLimitSec: s.timeLimitSec,
      ...(s.showUpTo === null ? {} : { showUpTo: s.showUpTo }),
    })),
  };
}

function PlayArea({
  kind,
  scenario,
  onFinish,
}: {
  kind: ScenarioKind;
  // 유형마다 지문 구조가 달라 표면별 타입으로 좁혀 넘긴다.
  scenario: ReturnType<typeof toSurfaceScenario>;
  onFinish: (score: number) => void;
}) {
  switch (kind) {
    case "doc":
      return (
        <DocScenarioView scenario={scenario as never} onFinish={onFinish} />
      );
    case "community":
      return (
        <CommunityScenarioView
          scenario={scenario as never}
          onFinish={onFinish}
        />
      );
    case "email":
      return (
        <EmailScenarioView scenario={scenario as never} onFinish={onFinish} />
      );
    case "story":
      return (
        <StoryScenarioView scenario={scenario as never} onFinish={onFinish} />
      );
    default:
      return (
        <p className="py-10 text-center text-sm text-muted">
          메신저 유형은 아직 미리보기를 지원하지 않습니다.
        </p>
      );
  }
}

// 지문을 유형별로 훑어 읽을 수 있게 문단 배열로 편다.
function payloadLines(
  kind: ScenarioKind,
  payload: Record<string, unknown>,
): string[] {
  const p = payload as {
    body?: string[];
    title?: string;
    doc?: { source?: string; title?: string; body?: string[] };
    post?: { author?: string; title?: string; body?: string[] };
    comments?: { nick?: string; text?: string }[];
    subject?: string;
    messages?: { from?: string; body?: string[] }[];
  };
  switch (kind) {
    case "doc":
      return [
        `[${p.doc?.source ?? ""}] ${p.doc?.title ?? ""}`,
        ...(p.doc?.body ?? []),
      ];
    case "story":
      return [p.title ?? "", ...(p.body ?? [])];
    case "community":
      return [
        `${p.post?.author ?? ""} — ${p.post?.title ?? ""}`,
        ...(p.post?.body ?? []),
        ...(p.comments ?? []).map((c) => `└ ${c.nick}: ${c.text}`),
      ];
    case "email":
      return [
        `제목: ${p.subject ?? ""}`,
        ...(p.messages ?? []).flatMap((m, i) => [
          `${i + 1}. ${m.from ?? ""}`,
          ...(m.body ?? []),
        ]),
      ];
    default:
      return [];
  }
}

export default function ScenarioPreview({
  kind,
  payload,
  steps,
  onClose,
}: {
  kind: ScenarioKind;
  payload: Record<string, unknown>;
  steps: AdminScenarioStep[];
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("read");
  // 풀어보기를 처음부터 다시 돌리기 위한 키. 바뀌면 표면이 새로 마운트된다.
  const [runId, setRunId] = useState(0);
  const [score, setScore] = useState<number | null>(null);

  // 표면은 스텝 객체의 정체성으로 재생 effect를 건다.
  // 렌더마다 새로 만들면 타이머가 계속 초기화되므로 고정해 둔다.
  const scenario = useMemo(
    () => toSurfaceScenario(payload, steps),
    [payload, steps],
  );

  function startPlay() {
    setScore(null);
    setRunId((n) => n + 1);
    setMode("play");
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold">
          미리보기{" "}
          <span className="font-medium text-muted">
            {SCENARIO_KIND_LABELS[kind]} · 문항 {steps.length}개
          </span>
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode("read")}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              mode === "read"
                ? "bg-brand text-brand-foreground"
                : "bg-surface-muted text-muted"
            }`}
          >
            훑어보기
          </button>
          <button
            type="button"
            onClick={startPlay}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              mode === "play"
                ? "bg-brand text-brand-foreground"
                : "bg-surface-muted text-muted"
            }`}
          >
            {mode === "play" ? "처음부터" : "풀어보기"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-muted"
          >
            닫기
          </button>
        </div>
      </div>

      {mode === "read" ? (
        <div className="mt-3">
          <div className="rounded-2xl border border-border bg-surface-muted/30 p-3 text-sm leading-relaxed">
            {payloadLines(kind, payload).map((line, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {line}
              </p>
            ))}
          </div>

          <ol className="mt-3 flex flex-col gap-2">
            {steps.map((s, i) => (
              <li
                key={s.stepKey || i}
                className="rounded-2xl border border-border p-3"
              >
                <p className="text-xs text-muted">
                  {i + 1}. {s.type} · {DIFFICULTY_LABELS[s.difficulty] ?? ""} ·{" "}
                  {s.timeLimitSec}초
                  {s.showUpTo !== null && ` · 메일 ${s.showUpTo}개까지 공개`}
                </p>
                <p className="mt-1 font-medium">{s.prompt}</p>
                <ul className="mt-1 flex flex-col gap-0.5 text-sm">
                  {s.choices.map((c, j) => (
                    <li
                      key={j}
                      className={
                        j === s.answerIndex
                          ? "font-bold text-brand"
                          : "text-muted"
                      }
                    >
                      {j === s.answerIndex ? "✓ " : "· "}
                      {c}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        // 실제 표면은 높이를 채우는 구조라 미리보기에서도 고정 높이를 준다.
        <div className="mt-3 h-[70vh] overflow-hidden rounded-2xl border border-border p-3">
          {score !== null ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <p className="text-lg font-bold">완료 · {score}점</p>
              <button
                type="button"
                onClick={startPlay}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-brand-foreground"
              >
                다시 풀어보기
              </button>
            </div>
          ) : (
            <PlayArea
              key={runId}
              kind={kind}
              scenario={scenario}
              onFinish={setScore}
            />
          )}
        </div>
      )}
    </div>
  );
}
