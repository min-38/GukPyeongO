"use client";

import { useEffect, useState } from "react";

import { type AdminReport } from "@/app/lib/quiz";

import PageHeader from "./PageHeader";

// v1 테스트 문제 신고 (#13). v2 문항 항의는 별도 화면(FeedbackTab)에 있다.
export default function ReportsTab() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/reports")
      .then((r) => r.json() as Promise<{ reports?: AdminReport[] }>)
      .then((d) => alive && setReports(d.reports ?? []))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  async function setReportStatus(id: string, status: "open" | "resolved") {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  if (loading) return <p className="text-sm text-muted">불러오는 중…</p>;

  const openReports = reports.filter((r) => r.status === "open").length;

  return (
    <section>
        <PageHeader
          title="신고"
          count={reports.length}
          desc={`미처리 ${openReports}건. v1 테스트 문제에 들어온 제보입니다.`}
        />
        <ul className="flex flex-col gap-3">
          {reports.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted">
              신고가 없습니다.
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
                  <span className="font-bold text-red-500">
                    {r.reason}
                  </span>
                  <button
                    onClick={() =>
                      setReportStatus(
                        r.id,
                        r.status === "open" ? "resolved" : "open",
                      )
                    }
                    className="font-medium text-brand"
                  >
                    {r.status === "open" ? "처리 완료로" : "미처리로"}
                  </button>
                </div>
                <p className="mt-2 text-sm font-medium">
                  {r.questionPrompt}
                </p>
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
      </section>
  );
}
