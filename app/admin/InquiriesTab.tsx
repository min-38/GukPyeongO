"use client";

import { useEffect, useState } from "react";

import { type AdminInquiry, INQUIRY_KIND_LABELS } from "@/app/lib/quiz";

import PageHeader from "./PageHeader";

// 문의함. 푸터에서 들어온 문의를 신고 화면과 같은 방식으로 처리한다.
export default function InquiriesTab() {
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/inquiries")
      .then((r) => r.json() as Promise<{ inquiries?: AdminInquiry[] }>)
      .then((d) => alive && setInquiries(d.inquiries ?? []))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  async function setStatus(id: string, status: "open" | "resolved") {
    setInquiries((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status } : q)),
    );
    await fetch("/api/admin/inquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  if (loading) return <p className="text-sm text-muted">불러오는 중…</p>;

  const open = inquiries.filter((q) => q.status === "open").length;

  return (
    <section>
      <PageHeader
        title="문의함"
        count={inquiries.length}
        desc={`미처리 ${open}건. 푸터의 문의 폼으로 들어온 것입니다.`}
      />
      <ul className="flex flex-col gap-3">
        {inquiries.length === 0 ? (
          <li className="py-8 text-center text-sm text-muted">
            문의가 없습니다.
          </li>
        ) : (
          inquiries.map((q) => (
            <li
              key={q.id}
              className={`rounded-2xl border bg-surface p-4 ${
                q.status === "open" ? "border-red-300" : "border-border"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="rounded-full bg-surface-muted px-2.5 py-0.5 font-bold text-foreground">
                  {INQUIRY_KIND_LABELS[q.kind] ?? q.kind}
                </span>
                <span>{new Date(q.createdAt).toLocaleString("ko-KR")}</span>
                {q.path && <span>· {q.path}</span>}
                <span>· {q.ipMasked}</span>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {q.message}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                {/* 답장할 곳은 본인이 적어 넣은 값이다 — 없으면 답을 못 준다. */}
                {q.contact ? (
                  <span className="text-xs font-medium text-foreground">
                    답장: {q.contact}
                  </span>
                ) : (
                  <span className="text-xs text-muted">답장할 곳 없음</span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setStatus(q.id, q.status === "open" ? "resolved" : "open")
                  }
                  className="rounded-xl bg-surface-muted px-3 py-1.5 text-xs font-bold text-foreground"
                >
                  {q.status === "open" ? "처리 완료" : "미처리로"}
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
