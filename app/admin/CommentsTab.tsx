"use client";

import { useEffect, useState } from "react";

import { type Comment } from "@/app/lib/quiz";

import PageHeader from "./PageHeader";

// 유저 댓글 (#41). 여기서는 읽기만 한다.
export default function CommentsTab() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/comments")
      .then((r) => r.json() as Promise<{ comments?: Comment[] }>)
      .then((d) => alive && setComments(d.comments ?? []))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  async function deleteComment(id: string) {
    const res = await fetch(`/api/admin/comments?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading) return <p className="text-sm text-muted">불러오는 중…</p>;

  return (
    <section>
        <PageHeader title="댓글" count={comments.length} />
        <ul className="flex flex-col gap-3">
          {comments.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted">
              댓글이 없습니다.
            </li>
          ) : (
            comments.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="font-semibold text-brand">
                      {c.grade}등급
                    </span>
                    <span className="font-semibold text-foreground">
                      {c.nickname}
                    </span>
                    <span>{c.ipMasked}</span>
                  </span>
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="font-medium text-red-500"
                  >
                    삭제
                  </button>
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
