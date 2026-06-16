"use client";

import { useEffect, useState } from "react";

import {
  MAX_REPORT_DETAIL_LENGTH,
  type QuestionResult,
  type QuestionStat,
  REPORT_REASONS,
  type ReportReason,
  resolveTypeLabel,
} from "@/app/lib/quiz";

function ReportForm({
  questionId,
  onClose,
  onReported,
}: {
  questionId: string;
  onClose: () => void;
  onReported: () => void;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (reason === null || posting) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, reason, detail: detail.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "신고에 실패했어요.");
        return;
      }
      onReported();
    } catch {
      setError("신고에 실패했어요.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl bg-surface-muted p-3">
      <div className="flex flex-wrap gap-1.5">
        {REPORT_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              reason === r
                ? "bg-brand text-brand-foreground"
                : "bg-surface text-muted"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        maxLength={MAX_REPORT_DETAIL_LENGTH}
        rows={2}
        placeholder="(선택) 자세한 내용을 적어주세요"
        className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-xs font-bold text-muted"
        >
          취소
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={reason === null || posting}
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground active:scale-95 disabled:opacity-40"
        >
          {posting ? "접수 중..." : "신고하기"}
        </button>
      </div>
    </div>
  );
}

export default function QuestionStats({
  results = [],
}: {
  results?: QuestionResult[];
}) {
  const [stats, setStats] = useState<QuestionStat[] | null>(null);
  const [typeLabels, setTypeLabels] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reported, setReported] = useState<Record<string, true>>({});

  // 내가 푼 문항의 정답 여부 맵
  const myCorrect = new Map(results.map((r) => [r.questionId, r.correct]));

  useEffect(() => {
    let active = true;
    fetch("/api/stats")
      .then((res) =>
        res.ok
          ? (res.json() as Promise<{
              stats: QuestionStat[];
              typeLabels: Record<string, string>;
            }>)
          : Promise.reject(new Error())
      )
      .then((data) => {
        if (active) {
          setStats(data.stats);
          setTypeLabels(data.typeLabels ?? {});
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (failed) return null;

  // 내가 푼 문항만(있으면) 출제 순서대로, 없으면 전체
  const displayed =
    stats === null
      ? null
      : results.length > 0
        ? results
            .map((r) => stats.find((s) => s.id === r.questionId))
            .filter((s): s is QuestionStat => Boolean(s))
        : stats;

  return (
    <section className="mt-10">
      <h3 className="text-xl font-extrabold">📊 다른 사람들은?</h3>
      <p className="mt-1 text-sm text-muted">
        {results.length > 0
          ? "내가 푼 문제의 정답률이에요."
          : "문제별 정답률이에요."}
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {displayed === null
          ? Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-surface-muted"
              />
            ))
          : displayed.map((s, i) => {
              const mine = myCorrect.get(s.id); // true/false/undefined
              const cardCls =
                mine === undefined
                  ? "border-border bg-surface"
                  : mine
                    ? "border-green-500/50 bg-green-500/10"
                    : "border-red-500/50 bg-red-500/10";
              return (
              <li key={s.id} className={`rounded-2xl border p-4 ${cardCls}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-snug">
                    <span className="text-muted">Q{i + 1}. </span>
                    {s.prompt}
                  </p>
                  <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                    {resolveTypeLabel(s.type, typeLabels)}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${s.correctRate}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-extrabold tabular-nums">
                    {s.correctRate}%
                  </span>
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-xs text-muted">
                    {s.attempts === 0
                      ? "아직 응답이 없어요"
                      : `${s.attempts}명 중 ${s.correctCount}명 정답`}
                  </p>
                  {reported[s.id] ? (
                    <span className="text-xs font-bold text-muted">
                      신고 접수됨 ✓
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setReportingId((cur) => (cur === s.id ? null : s.id))
                      }
                      className="text-xs font-bold text-muted transition-colors hover:text-brand"
                    >
                      🚩 신고
                    </button>
                  )}
                </div>

                {reportingId === s.id && !reported[s.id] && (
                  <ReportForm
                    questionId={s.id}
                    onClose={() => setReportingId(null)}
                    onReported={() => {
                      setReported((prev) => ({ ...prev, [s.id]: true }));
                      setReportingId(null);
                    }}
                  />
                )}
              </li>
              );
            })}
      </ul>
    </section>
  );
}
