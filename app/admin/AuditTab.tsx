"use client";

import { useEffect, useState } from "react";

import { AUDIT_ACTION_LABELS, type QuestionAudit } from "@/app/lib/quiz";

import PageHeader from "./PageHeader";

// 변경 로그 (#66). 문제를 만들고 고치고 지운 기록.
export default function AuditTab() {
  const [audits, setAudits] = useState<QuestionAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/audit")
      .then((r) => r.json() as Promise<{ audits?: QuestionAudit[] }>)
      .then((d) => alive && setAudits(d.audits ?? []))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <p className="text-sm text-muted">불러오는 중…</p>;

  return (
    <section>
        <PageHeader
          title="변경 로그"
          count={audits.length}
          desc="문제를 만들고 고치고 지운 기록입니다."
        />
        <ul className="flex flex-col gap-2">
          {audits.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted">
              변경 이력이 없습니다.
            </li>
          ) : (
            audits.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm"
              >
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                    a.action === "delete"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-brand/10 text-brand"
                  }`}
                >
                  {AUDIT_ACTION_LABELS[a.action]}
                </span>
                <span className="flex-1 truncate text-muted">
                  {a.snapshot?.prompt ?? "(삭제된 문제)"}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {new Date(a.createdAt).toLocaleString("ko-KR", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
  );
}
