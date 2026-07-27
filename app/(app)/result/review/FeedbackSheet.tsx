"use client";

import { useState } from "react";

import {
  MAX_RATING_COMMENT_LENGTH,
  MAX_REPORT_DETAIL_LENGTH,
  RATING_STARS,
  REPORT_REASONS,
  type ReportReason,
} from "@/app/lib/quiz";

// 문항 하나에 남기는 항의와 별점 (#96).
// 미트볼(⋯)을 눌러 연다. 항의는 "이 문제 이상하다"는 제보, 별점은 "좋은 문제였나"라
// 성격이 달라 한 시트 안에서도 칸을 나눠 둔다.

export type Mode = "report" | "rating";

export default function FeedbackSheet({
  slug,
  stepKey,
  sent,
  onSent,
  onClose,
}: {
  slug: string;
  stepKey: string;
  // 이 문항에 이미 남긴 것. 시트를 접었다 펴도 다시 쓰게 하지 않는다.
  sent: Record<Mode, boolean>;
  onSent: (mode: Mode) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>(sent.report ? "rating" : "report");
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const [stars, setStars] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = sent[mode];

  async function submit() {
    if (posting) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/step-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "report"
            ? { type: "report", slug, stepKey, reason, detail: detail.trim() }
            : { type: "rating", slug, stepKey, stars, comment: comment.trim() },
        ),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "보내지 못했어요.");
        return;
      }
      onSent(mode);
    } catch {
      setError("보내지 못했어요.");
    } finally {
      setPosting(false);
    }
  }

  const canSubmit = mode === "report" ? reason !== null : stars !== null;

  return (
    <div className="mt-3 rounded-2xl border border-border bg-surface p-4">
      {done ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <p className="text-sm font-bold">
            {mode === "report" ? "항의를 접수했어요." : "평가를 남겼어요."}
          </p>
          <p className="text-xs text-muted">
            {mode === "report"
              ? "확인하고 문제를 손보겠습니다."
              : "다음 문제를 만들 때 참고할게요."}
          </p>
          <div className="flex gap-2">
            {/* 하나만 남겼으면 다른 하나는 아직 쓸 수 있다. */}
            {!sent[mode === "report" ? "rating" : "report"] && (
              <button
                type="button"
                onClick={() => setMode(mode === "report" ? "rating" : "report")}
                className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-brand-foreground"
              >
                {mode === "report" ? "평가도 남기기" : "항의하기"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-surface-muted px-4 py-1.5 text-xs font-bold"
            >
              닫기
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {(
                [
                  ["report", "항의"],
                  ["rating", "평가"],
                ] as [Mode, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setMode(key);
                    setError(null);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    mode === key
                      ? "bg-brand text-brand-foreground"
                      : "bg-surface-muted text-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-muted"
            >
              닫기
            </button>
          </div>

          {mode === "report" ? (
            <>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      reason === r
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border text-muted"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <textarea
                value={detail}
                onChange={(e) =>
                  setDetail(e.target.value.slice(0, MAX_REPORT_DETAIL_LENGTH))
                }
                rows={3}
                placeholder="어디가 이상한지 적어주세요 (선택)"
                className="mt-2 w-full rounded-2xl border border-border bg-surface-muted px-3 py-2 text-sm"
              />
              <p className="text-right text-[11px] text-muted">
                {detail.length} / {MAX_REPORT_DETAIL_LENGTH}
              </p>
            </>
          ) : (
            <>
              <div className="mt-3 flex justify-center gap-1">
                {RATING_STARS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStars(s)}
                    aria-label={`별 ${s}개`}
                    className={`text-2xl leading-none ${
                      stars !== null && s <= stars
                        ? "text-amber-400"
                        : "text-muted opacity-40"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) =>
                  setComment(e.target.value.slice(0, MAX_RATING_COMMENT_LENGTH))
                }
                rows={3}
                placeholder="하고 싶은 말이 있다면 (선택)"
                className="mt-2 w-full rounded-2xl border border-border bg-surface-muted px-3 py-2 text-sm"
              />
              <p className="text-right text-[11px] text-muted">
                {comment.length} / {MAX_RATING_COMMENT_LENGTH}
              </p>
            </>
          )}

          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

          <button
            type="button"
            disabled={!canSubmit || posting}
            onClick={submit}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-2xl bg-brand text-sm font-bold text-brand-foreground disabled:opacity-40"
          >
            {posting ? "보내는 중…" : "보내기"}
          </button>
        </>
      )}
    </div>
  );
}
