"use client";

import { useEffect, useState } from "react";

import {
  type AdminReport,
  AUDIT_ACTION_LABELS,
  type Comment,
  type PatchNote,
  type PatchType,
  PATCH_TYPE_LABELS,
  PATCH_TYPES,
  type QuestionAudit,
} from "@/app/lib/quiz";
import { type AdminScenario } from "@/app/lib/scenario-admin";

import KindTab from "./KindTab";
import ScenarioTab from "./ScenarioTab";
import ScheduleTab from "./ScheduleTab";

// 문제·유형 탭은 걷어냈다(#66) — v2에서 문제는 시나리오이고 유형은 시나리오 kind다.
// questions 테이블과 /test 는 v1 자산으로 남아 있지만 어드민에서는 다루지 않는다.
type Tab =
  | "scenarios"
  | "kinds"
  | "schedule"
  | "reports"
  | "comments"
  | "audit"
  | "patch";

function PatchForm({
  onSaved,
  onCancel,
}: {
  onSaved: (n: PatchNote) => void;
  onCancel: () => void;
}) {
  const [version, setVersion] = useState("");
  const [type, setType] = useState<PatchType>("new");
  const [content, setContent] = useState("");
  const [patchedAt, setPatchedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/patch-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, type, content, patchedAt }),
      });
      const data = (await res.json()) as {
        patchNote?: PatchNote;
        error?: string;
      };
      if (!res.ok || !data.patchNote) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      onSaved(data.patchNote);
    } catch {
      setError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="flex flex-col gap-3 rounded-2xl border border-brand bg-surface p-4"
    >
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          버전
          <input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="예: v1.2.0"
            className="h-10 rounded-xl border border-border bg-surface px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          유형
          <select
            value={type}
            onChange={(e) => setType(e.target.value as PatchType)}
            className="h-10 rounded-xl border border-border bg-surface px-3"
          >
            {PATCH_TYPES.map((t) => (
              <option key={t} value={t}>
                {PATCH_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          패치 일시
          <input
            type="date"
            value={patchedAt}
            onChange={(e) => setPatchedAt(e.target.value)}
            className="h-10 rounded-xl border border-border bg-surface px-3"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        내용
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="이번 업데이트에서 바뀐 점을 적어주세요."
          className="resize-none rounded-xl border border-border bg-surface px-3 py-2"
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-40"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-surface-muted px-4 py-2 text-sm font-medium text-muted"
        >
          취소
        </button>
      </div>
    </form>
  );
}

export default function AdminDashboard() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [audits, setAudits] = useState<QuestionAudit[]>([]);
  const [patchNotes, setPatchNotes] = useState<PatchNote[]>([]);
  const [scenarios, setScenarios] = useState<AdminScenario[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("scenarios");
  const [editingPatch, setEditingPatch] = useState<"new" | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/admin/scenarios").then(async (r) => {
        if (r.status === 401) throw new Error("401");
        return r.json() as Promise<{ scenarios: AdminScenario[] }>;
      }),
      fetch("/api/admin/comments").then(
        (r) => r.json() as Promise<{ comments: Comment[] }>,
      ),
      fetch("/api/admin/reports").then(
        (r) => r.json() as Promise<{ reports: AdminReport[] }>,
      ),
      fetch("/api/admin/audit").then(
        (r) => r.json() as Promise<{ audits: QuestionAudit[] }>,
      ),
      fetch("/api/admin/patch-notes").then(
        (r) => r.json() as Promise<{ patchNotes: PatchNote[] }>,
      ),
    ])
      .then(([sc, c, rp, a, pn]) => {
        if (!active) return;
        setScenarios(sc.scenarios ?? []);
        setComments(c.comments ?? []);
        setReports(rp.reports ?? []);
        setAudits(a.audits ?? []);
        setPatchNotes(pn.patchNotes ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        if ((err as Error).message === "401") {
          window.location.href = "/admin/login";
          return;
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function setReportStatus(id: string, status: "open" | "resolved") {
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok)
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
  }

  async function deleteComment(id: string) {
    const res = await fetch(`/api/admin/comments?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
  }

  function handlePatchSaved(n: PatchNote) {
    setPatchNotes((prev) =>
      [n, ...prev].sort((a, b) => b.patchedAt.localeCompare(a.patchedAt)),
    );
    setEditingPatch(null);
  }

  async function deletePatchNote(id: string) {
    if (!confirm("이 패치노트를 삭제할까요?")) return;
    const res = await fetch(`/api/admin/patch-notes?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) setPatchNotes((prev) => prev.filter((p) => p.id !== id));
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted">불러오는 중...</p>
      </main>
    );
  }

  const openReports = reports.filter((r) => r.status === "open").length;

  const nav: { id: Tab; emoji: string; label: string; count: number }[] = [
    {
      id: "scenarios",
      emoji: "🎬",
      label: "문제",
      count: scenarios.length,
    },
    { id: "kinds", emoji: "🏷️", label: "유형", count: 0 },
    { id: "schedule", emoji: "🗓️", label: "편성", count: 0 },
    { id: "reports", emoji: "🚩", label: "신고", count: openReports },
    { id: "comments", emoji: "💬", label: "댓글", count: comments.length },
    { id: "audit", emoji: "🕑", label: "로그", count: audits.length },
    { id: "patch", emoji: "📋", label: "패치노트", count: patchNotes.length },
  ];

  return (
    <div className="flex flex-1">
      {/* 사이드바 (데스크톱) */}
      <aside className="flex w-56 shrink-0 flex-col gap-1 border-r border-border p-5">
        <h1 className="px-2 pb-3 text-xl font-extrabold">관리자</h1>
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
              tab === n.id
                ? "bg-brand/10 text-brand"
                : "text-muted hover:bg-surface-muted"
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{n.emoji}</span>
              {n.label}
            </span>
            {n.count > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  n.id === "reports" && openReports > 0
                    ? "bg-red-500 text-white"
                    : "bg-surface-muted text-muted"
                }`}
              >
                {n.count}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={logout}
          className="mt-auto rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted hover:bg-surface-muted"
        >
          로그아웃
        </button>
      </aside>

      {/* 본문 */}
      <main className="flex-1 overflow-x-hidden px-5 py-6 lg:px-8">
        {tab === "scenarios" && (
          <ScenarioTab
            scenarios={scenarios}
            onDeleted={(id) =>
              setScenarios((prev) => prev.filter((p) => p.id !== id))
            }
          />
        )}

        {tab === "kinds" && <KindTab scenarios={scenarios} />}

        {tab === "schedule" && <ScheduleTab scenarios={scenarios} />}

        {tab === "reports" && (
          <section>
            <h2 className="text-xl font-bold">
              신고{" "}
              <span className="text-muted">
                ({openReports} / {reports.length})
              </span>
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
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
                      <span className="font-bold text-red-500">{r.reason}</span>
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
        )}

        {tab === "comments" && (
          <section>
            <h2 className="text-xl font-bold">
              댓글 <span className="text-muted">({comments.length})</span>
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
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
        )}

        {tab === "audit" && (
          <section>
            <h2 className="text-xl font-bold">
              변경 로그 <span className="text-muted">({audits.length})</span>
            </h2>
            <ul className="mt-4 flex flex-col gap-2">
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
        )}

        {tab === "patch" && (
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                패치노트{" "}
                <span className="text-muted">({patchNotes.length})</span>
              </h2>
              {editingPatch === null && (
                <button
                  onClick={() => setEditingPatch("new")}
                  className="rounded-xl bg-brand px-3 py-1.5 text-sm font-semibold text-brand-foreground"
                >
                  + 패치노트 작성
                </button>
              )}
            </div>

            {editingPatch === "new" && (
              <div className="mt-4">
                <PatchForm
                  onSaved={handlePatchSaved}
                  onCancel={() => setEditingPatch(null)}
                />
              </div>
            )}

            <ul className="mt-4 flex flex-col gap-3">
              {patchNotes.length === 0 ? (
                <li className="py-8 text-center text-sm text-muted">
                  패치노트가 없습니다.
                </li>
              ) : (
                patchNotes.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-2xl border border-border bg-surface p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 font-bold text-brand">
                        {PATCH_TYPE_LABELS[p.type]}
                      </span>
                      <span className="font-bold">{p.version}</span>
                      <span className="text-muted">
                        {new Date(p.patchedAt).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </span>
                      <button
                        onClick={() => deletePatchNote(p.id)}
                        className="ml-auto font-medium text-red-500"
                      >
                        삭제
                      </button>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                      {p.content}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
