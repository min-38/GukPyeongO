"use client";

import { useEffect, useState } from "react";

import {
  type AdminStepRating,
  type AdminStepReport,
} from "@/app/lib/quiz";

// 문항 항의·평가 (#96).
// 항의는 "이 문제 이상하다"는 제보라 처리 상태를 넘긴다.
// 평가는 별점 평균이라 낮은 순으로 쌓아 둔다 — 손볼 문항과 다음에 낼 방향이 여기서 보인다.

export default function FeedbackTab({
  onOpenCount,
}: {
  onOpenCount: (n: number) => void;
}) {
  const [reports, setReports] = useState<AdminStepReport[]>([]);
  const [ratings, setRatings] = useState<AdminStepRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/step-feedback")
      .then(
        (r) =>
          r.json() as Promise<{
            reports?: AdminStepReport[];
            ratings?: AdminStepRating[];
          }>,
      )
      .then((data) => {
        if (!alive) return;
        setReports(data.reports ?? []);
        setRatings(data.ratings ?? []);
        onOpenCount(
          (data.reports ?? []).filter((r) => r.status === "open").length,
        );
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [onOpenCount]);

  async function setStatus(id: string, status: "open" | "resolved") {
    const next = reports.map((r) => (r.id === id ? { ...r, status } : r));
    setReports(next);
    onOpenCount(next.filter((r) => r.status === "open").length);
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
        <h2 className="text-xl font-bold">
          항의{" "}
          <span className="text-muted">
            ({open} / {reports.length})
          </span>
        </h2>
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
                <p className="mt-2 text-xs text-muted">{r.scenarioTitle}</p>
                <p className="mt-1 text-sm font-medium">{r.stepPrompt}</p>
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

      <div>
        <h2 className="text-xl font-bold">
          문항 평가 <span className="text-muted">({ratings.length})</span>
        </h2>
        <p className="mt-1 text-xs text-muted">
          별점이 낮은 문항부터. 다음 문제를 어느 쪽으로 낼지 보는 자리입니다.
        </p>
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
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">{r.scenarioTitle}</span>
                  <span className="text-sm font-bold text-amber-500">
                    ★ {r.average.toFixed(1)}
                    <span className="ml-1 text-xs font-medium text-muted">
                      ({r.count}명)
                    </span>
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium">{r.stepPrompt}</p>
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
