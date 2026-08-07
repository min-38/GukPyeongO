"use client";

import { useEffect, useState } from "react";

import { MAX_RATING_COMMENT_LENGTH, RATING_STARS } from "@/app/lib/quiz";

// 회차 평가 (#112). 채점 결과를 다 본 자리에서 "이번 회차 어땠나"를 묻는다.
//
// 문항 평가(#96)는 문제 다시 보기 안쪽 시트에 있어서 첫 회차에 0건이었다.
// 같은 시트의 항의는 4건 들어왔으니 사람이 없어서가 아니라 자리가 없어서다.
// 그래서 이건 결과 화면 본문, 댓글 바로 위에 둔다.

export default function RoundRating({ roundId }: { roundId: string }) {
  const [stars, setStars] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이미 남겼으면 남긴 값을 그대로 세운다 — 다시 들어와도 뭘 줬는지 보이게.
  useEffect(() => {
    let alive = true;
    void fetch(`/api/round-rating?round=${encodeURIComponent(roundId)}`)
      .then((r) => r.json())
      .then((body: { rating?: { stars: number; comment: string | null } | null }) => {
        if (!alive || !body.rating) return;
        setStars(body.rating.stars);
        setComment(body.rating.comment ?? "");
        setSaved(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [roundId]);

  async function submit() {
    if (posting || stars === null) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/round-rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId, stars, comment: comment.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "저장하지 못했어요.");
        return;
      }
      setSaved(true);
    } catch {
      setError("저장하지 못했어요. 연결을 확인해 주세요.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-border p-4">
      <h2 className="font-bold">이번 회차 어땠나요?</h2>
      <p className="mt-0.5 text-xs text-muted">
        난이도와 분량을 다음 회차에 반영합니다.
      </p>

      <div className="mt-3 flex justify-center gap-1">
        {RATING_STARS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setStars(s);
              // 한 번 저장한 뒤 별을 다시 고르면 보낼 수 있는 상태로 되돌린다.
              setSaved(false);
            }}
            aria-label={`별 ${s}개`}
            className={`text-3xl leading-none ${
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
        onChange={(e) => {
          setComment(e.target.value.slice(0, MAX_RATING_COMMENT_LENGTH));
          setSaved(false);
        }}
        rows={2}
        placeholder="하고 싶은 말이 있다면 (선택)"
        className="mt-3 w-full rounded-2xl border border-border bg-surface-muted px-3 py-2 text-sm"
      />
      <p className="text-right text-[11px] text-muted">
        {comment.length} / {MAX_RATING_COMMENT_LENGTH}
      </p>

      {error && (
        <p role="status" className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={stars === null || posting || saved}
        className="mt-2 w-full rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-brand-foreground disabled:opacity-40"
      >
        {saved ? "평가를 남겼어요" : posting ? "보내는 중…" : "평가 남기기"}
      </button>
    </section>
  );
}
