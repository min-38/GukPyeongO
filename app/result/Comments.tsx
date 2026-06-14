"use client";

import { useEffect, useState } from "react";

import { type Comment, MAX_COMMENT_LENGTH } from "@/app/lib/quiz";

type Tab = "all" | "grade";

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function Comments({
  grade,
  gradeToken,
}: {
  grade: number;
  gradeToken: string;
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 탭(전체/같은 등급) 변경 시 목록 로드
  useEffect(() => {
    let active = true;
    const q = tab === "all" ? "all" : String(grade);
    fetch(`/api/comments?grade=${q}`)
      .then((res) =>
        res.ok
          ? (res.json() as Promise<{ comments: Comment[] }>)
          : Promise.reject(new Error())
      )
      .then((data) => {
        if (!active) return;
        setComments(data.comments);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError("댓글을 불러오지 못했어요.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tab, grade]);

  function switchTab(next: Tab) {
    if (next === tab) return;
    setError(null);
    setComments([]);
    setLoading(true);
    setTab(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length === 0 || posting) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed, gradeToken }),
      });
      const data = (await res.json()) as { comment?: Comment; error?: string };
      if (!res.ok || !data.comment) {
        setError(data.error ?? "작성에 실패했어요.");
        return;
      }
      // 새 댓글의 등급은 내 등급이므로 전체·같은 등급 탭 모두에 노출된다.
      setComments((prev) => [data.comment as Comment, ...prev]);
      setContent("");
    } catch {
      setError("작성에 실패했어요.");
    } finally {
      setPosting(false);
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
      active ? "bg-brand text-brand-foreground" : "bg-background text-muted"
    }`;

  return (
    <section className="mt-8">
      <h3 className="text-lg font-bold">댓글</h3>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => switchTab("all")}
          className={tabClass(tab === "all")}
        >
          전체
        </button>
        <button
          type="button"
          onClick={() => switchTab("grade")}
          className={tabClass(tab === "grade")}
        >
          {grade}등급 방
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_COMMENT_LENGTH}
          rows={2}
          placeholder="가볍게 한마디 남겨보세요"
          className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-brand"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted">
            {content.length} / {MAX_COMMENT_LENGTH}
          </span>
          <button
            type="submit"
            disabled={posting || content.trim().length === 0}
            className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground transition-opacity active:opacity-80 disabled:opacity-40"
          >
            {posting ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>

      {error && <p className="mt-2 text-sm text-brand">{error}</p>}

      <ul className="mt-4 flex flex-col gap-3">
        {loading ? (
          <li className="py-6 text-center text-sm text-muted">불러오는 중...</li>
        ) : comments.length === 0 ? (
          <li className="py-6 text-center text-sm text-muted">
            아직 댓글이 없어요. 첫 댓글을 남겨보세요.
          </li>
        ) : (
          comments.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-semibold text-brand">{c.grade}등급</span>
                <span>{timeAgo(c.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-base">
                {c.content}
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
