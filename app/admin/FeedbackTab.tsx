"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  type AdminRoundRating,
  type AdminStepRating,
  type AdminStepReport,
} from "@/app/lib/quiz";

import PageHeader from "./PageHeader";

// 항의·평가에 걸린 문항을 눌러 그 문제 편집 화면으로 보낸다.
// 문제가 지워졌으면 갈 곳이 없으니 그냥 글로 둔다.
function StepLink({
  scenarioId,
  scenarioTitle,
  stepPrompt,
}: {
  scenarioId: string;
  scenarioTitle: string;
  stepPrompt: string;
}) {
  const body = (
    <>
      <span className="block text-xs text-muted">{scenarioTitle}</span>
      <span className="mt-1 block text-sm font-medium">{stepPrompt}</span>
    </>
  );

  if (!scenarioId) return <div className="mt-2">{body}</div>;

  return (
    <Link
      href={`/admin/scenarios/${scenarioId}`}
      className="mt-2 block rounded-xl transition-colors hover:bg-surface-muted"
      title="이 문제 편집하기"
    >
      {body}
    </Link>
  );
}

// 문항 항의·평가 (#96).
// 항의는 "이 문제 이상하다"는 제보라 처리 상태를 넘긴다.
// 평가는 별점 평균이라 낮은 순으로 쌓아 둔다 — 손볼 문항과 다음에 낼 방향이 여기서 보인다.

// 항의한 사람이 무엇을 골랐는지. 이게 없으면 "이 문제 이상하다"만 남아
// 항의가 타당한지 판단할 수 없다.
//
// 정답과 고른 답을 같은 목록 안에서 보여준다 — 따로 적으면 눈이 왔다 갔다 한다.
// 색만으로 나누지 않고 글로도 표시한다.
function PickedChoices({
  choices,
  answerIndex,
  pickedIndex,
}: {
  choices: string[];
  answerIndex: number;
  pickedIndex?: number | null;
}) {
  if (choices.length === 0) return null;

  // null 과 undefined 를 다르게 말해야 한다 — 시간이 없어 못 낸 것과
  // 애초에 기록이 없는 것은 항의를 읽는 눈이 달라진다.
  const note =
    pickedIndex === undefined
      ? "고른 답 기록 없음"
      : pickedIndex === null
        ? "무응답 (시간 초과)"
        : null;

  return (
    <div className="mt-3 flex flex-col gap-1">
      {choices.map((c, i) => {
        const isAnswer = i === answerIndex;
        const isPick = i === pickedIndex;
        return (
          <div
            key={i}
            className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs ${
              isAnswer
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : isPick
                  ? "bg-red-500/10 text-red-700 dark:text-red-300"
                  : "text-muted"
            }`}
          >
            <span className="shrink-0 font-bold tabular-nums">{i + 1}</span>
            <span className="min-w-0 flex-1">{c}</span>
            {(isAnswer || isPick) && (
              <span className="shrink-0 font-bold">
                {isAnswer && isPick
                  ? "정답 · 고름"
                  : isAnswer
                    ? "정답"
                    : "고름"}
              </span>
            )}
          </div>
        );
      })}
      {note && <p className="px-2 text-xs text-muted">{note}</p>}
    </div>
  );
}

export default function FeedbackTab() {
  const [reports, setReports] = useState<AdminStepReport[]>([]);
  const [ratings, setRatings] = useState<AdminStepRating[]>([]);
  const [roundRatings, setRoundRatings] = useState<AdminRoundRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/step-feedback")
      .then(
        (r) =>
          r.json() as Promise<{
            reports?: AdminStepReport[];
            ratings?: AdminStepRating[];
            roundRatings?: AdminRoundRating[];
          }>,
      )
      .then((data) => {
        if (!alive) return;
        setReports(data.reports ?? []);
        setRatings(data.ratings ?? []);
        setRoundRatings(data.roundRatings ?? []);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  async function setStatus(id: string, status: "open" | "resolved") {
    const next = reports.map((r) => (r.id === id ? { ...r, status } : r));
    setReports(next);
    await fetch("/api/admin/step-feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  if (loading) {
    return <p className="text-sm text-muted">불러오는 중...</p>;
  }

  const open = reports.filter((r) => r.status === "open").length;

  return (
    <section className="flex flex-col gap-8">
      <div>
        <PageHeader
          title="항의"
          count={reports.length}
          desc={`미처리 ${open}건. 문제가 틀렸다는 제보입니다.`}
        />
        <ul className="mt-4 flex flex-col gap-3">
          {reports.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted">
              항의가 없습니다.
            </li>
          ) : (
            reports.map((r) => (
              <li
                key={r.id}
                className={`rounded-2xl border bg-surface p-4 ${
                  r.status === "open" ? "border-red-300" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-red-500">{r.reason}</span>
                  <button
                    onClick={() =>
                      setStatus(
                        r.id,
                        r.status === "open" ? "resolved" : "open",
                      )
                    }
                    className="font-medium text-brand"
                  >
                    {r.status === "open" ? "처리 완료로" : "미처리로"}
                  </button>
                </div>
                <StepLink
                  scenarioId={r.scenarioId}
                  scenarioTitle={r.scenarioTitle}
                  stepPrompt={r.stepPrompt}
                />
                <PickedChoices
                  choices={r.choices}
                  answerIndex={r.answerIndex}
                  pickedIndex={r.pickedIndex}
                />
                {r.detail && (
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted">
                    {r.detail}
                  </p>
                )}
                <span className="mt-2 inline-block text-xs text-muted">
                  {r.status === "open" ? "🔴 미처리" : "✅ 처리됨"}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* 회차 평가(#112). 문항 평가와 나란히 둬야 "이 회차가 별로였나 / 이 문제가 별로였나"를 가른다. */}
      <div>
        <PageHeader
          title="회차 평가"
          count={roundRatings.length}
          desc="회차 전체가 어땠는지. 난이도와 분량을 여기서 읽습니다."
        />
        <ul className="mt-4 flex flex-col gap-3">
          {roundRatings.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted">
              평가가 없습니다.
            </li>
          ) : (
            roundRatings.map((r) => (
              <li
                key={r.roundId}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="mt-2 text-sm font-bold">{r.label} 회차</p>
                  <span className="mt-2 shrink-0 text-sm font-bold text-amber-500">
                    ★ {r.average.toFixed(1)}
                    <span className="ml-1 text-xs font-medium text-muted">
                      ({r.count}명)
                    </span>
                  </span>
                </div>
                {r.comments.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {r.comments.map((c, i) => (
                      <li key={i} className="text-sm text-muted">
                        · {c}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))
          )}
        </ul>
      </div>

      <div>
        <PageHeader
          title="문항 평가"
          count={ratings.length}
          desc="별점이 낮은 문항부터. 다음 문제를 어느 쪽으로 낼지 보는 자리입니다."
        />
        <ul className="mt-4 flex flex-col gap-3">
          {ratings.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted">
              평가가 없습니다.
            </li>
          ) : (
            ratings.map((r) => (
              <li
                key={r.stepId}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <StepLink
                    scenarioId={r.scenarioId}
                    scenarioTitle={r.scenarioTitle}
                    stepPrompt={r.stepPrompt}
                  />
                  <span className="mt-2 shrink-0 text-sm font-bold text-amber-500">
                    ★ {r.average.toFixed(1)}
                    <span className="ml-1 text-xs font-medium text-muted">
                      ({r.count}명)
                    </span>
                  </span>
                </div>
                {r.comments.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {r.comments.map((c, i) => (
                      <li
                        key={i}
                        className="whitespace-pre-wrap break-words text-sm text-muted"
                      >
                        · {c}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
