"use client";

import { useEffect, useState } from "react";

import {
  type AdminQuestion,
  type AdminReport,
  AUDIT_ACTION_LABELS,
  type Comment,
  QUESTION_FORMAT_LABELS,
  type QuestionAudit,
  type QuestionFormat,
  QUESTION_TYPE_LABELS,
  type QuestionType,
} from "@/app/lib/quiz";

const TYPES = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[];
const FORMATS = Object.keys(QUESTION_FORMAT_LABELS) as QuestionFormat[];

function QuestionForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: AdminQuestion | null;
  onSaved: (q: AdminQuestion) => void;
  onCancel: () => void;
}) {
  const isNew = initial === null;
  const [type, setType] = useState<QuestionType>(initial?.type ?? "notice");
  const [format, setFormat] = useState<QuestionFormat>(
    initial?.format ?? "multiple_choice"
  );
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [choices, setChoices] = useState<string[]>(initial?.choices ?? ["", ""]);
  const [answerIndex, setAnswerIndex] = useState(initial?.answerIndex ?? 0);
  const [answers, setAnswers] = useState<string[]>(
    initial?.answers && initial.answers.length > 0 ? initial.answers : [""]
  );
  const [timeLimitSec, setTimeLimitSec] = useState(initial?.timeLimitSec ?? 20);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/questions", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 신규는 id 없이 생성(uuid 자동), 수정은 기존 uuid로 식별
          ...(isNew ? {} : { id: initial.id }),
          type,
          format,
          prompt,
          choices,
          answerIndex,
          answers,
          timeLimitSec,
        }),
      });
      const data = (await res.json()) as {
        question?: AdminQuestion;
        error?: string;
      };
      if (!res.ok || !data.question) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      onSaved(data.question);
    } catch {
      setError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="mt-3 flex flex-col gap-3 rounded-2xl border border-brand bg-surface p-4"
    >
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          유형
          <select
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            className="h-10 rounded-xl border border-border px-3"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {QUESTION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1 text-sm">
          형식
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as QuestionFormat)}
            className="h-10 rounded-xl border border-border px-3"
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {QUESTION_FORMAT_LABELS[f]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        문제
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          className="resize-none rounded-xl border border-border px-3 py-2"
        />
      </label>

      {format === "short_answer" ? (
        <div className="flex flex-col gap-2 text-sm">
          <span>허용 정답 (하나라도 일치하면 정답, 공백·대소문자 무시)</span>
          {answers.map((ans, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={ans}
                onChange={(e) =>
                  setAnswers((as) =>
                    as.map((a, idx) => (idx === i ? e.target.value : a))
                  )
                }
                placeholder="예: 오늘"
                className="h-10 flex-1 rounded-xl border border-border px-3"
              />
              {answers.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setAnswers((as) => as.filter((_, idx) => idx !== i))
                  }
                  className="text-muted"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setAnswers((as) => [...as, ""])}
            className="self-start text-sm text-brand"
          >
            + 정답 추가
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 text-sm">
          <span>보기 (정답 라디오 선택)</span>
          {choices.map((choice, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="answer"
                checked={answerIndex === i}
                onChange={() => setAnswerIndex(i)}
              />
              <input
                value={choice}
                onChange={(e) =>
                  setChoices((cs) =>
                    cs.map((c, idx) => (idx === i ? e.target.value : c))
                  )
                }
                className="h-10 flex-1 rounded-xl border border-border px-3"
              />
              {choices.length > 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setChoices((cs) => cs.filter((_, idx) => idx !== i));
                    setAnswerIndex((a) => (a >= i && a > 0 ? a - 1 : a));
                  }}
                  className="text-muted"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setChoices((cs) => [...cs, ""])}
            className="self-start text-sm text-brand"
          >
            + 보기 추가
          </button>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        제한시간(초)
        <input
          type="number"
          value={timeLimitSec}
          onChange={(e) => setTimeLimitSec(Number(e.target.value))}
          className="h-10 w-24 rounded-xl border border-border px-3"
        />
      </label>

      {error && <p className="text-sm text-brand">{error}</p>}

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
          className="rounded-xl bg-background px-4 py-2 text-sm font-medium text-muted"
        >
          취소
        </button>
      </div>
    </form>
  );
}

export default function AdminDashboard() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [audits, setAudits] = useState<QuestionAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminQuestion | "new" | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/admin/questions").then(
        (r) => r.json() as Promise<{ questions: AdminQuestion[] }>
      ),
      fetch("/api/admin/comments").then(
        (r) => r.json() as Promise<{ comments: Comment[] }>
      ),
      fetch("/api/admin/reports").then(
        (r) => r.json() as Promise<{ reports: AdminReport[] }>
      ),
      fetch("/api/admin/audit").then(
        (r) => r.json() as Promise<{ audits: QuestionAudit[] }>
      ),
    ])
      .then(([q, c, rp, a]) => {
        if (!active) return;
        setQuestions(q.questions ?? []);
        setComments(c.comments ?? []);
        setReports(rp.reports ?? []);
        setAudits(a.audits ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function refreshAudit() {
    const r = await fetch("/api/admin/audit");
    if (r.ok) {
      const data = (await r.json()) as { audits: QuestionAudit[] };
      setAudits(data.audits ?? []);
    }
  }

  async function deleteQuestion(q: AdminQuestion) {
    if (!confirm(`문제를 삭제할까요?\n\n${q.prompt}`)) return;
    const res = await fetch(`/api/admin/questions?id=${q.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setQuestions((prev) => prev.filter((p) => p.id !== q.id));
      void refreshAudit();
    }
  }

  async function setReportStatus(id: string, status: "open" | "resolved") {
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok)
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
  }

  function handleSaved(q: AdminQuestion) {
    setQuestions((prev) =>
      prev.some((p) => p.id === q.id)
        ? prev.map((p) => (p.id === q.id ? q : p))
        : [...prev, q]
    );
    setEditing(null);
    void refreshAudit();
  }

  async function deleteComment(id: string) {
    const res = await fetch(`/api/admin/comments?id=${id}`, { method: "DELETE" });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
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

  return (
    <main className="flex flex-1 flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">관리자</h1>
        <button onClick={logout} className="text-sm font-medium text-muted">
          로그아웃
        </button>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">문제 ({questions.length})</h2>
          {editing === null && (
            <button
              onClick={() => setEditing("new")}
              className="rounded-xl bg-brand px-3 py-1.5 text-sm font-semibold text-brand-foreground"
            >
              + 추가
            </button>
          )}
        </div>

        {editing === "new" && (
          <QuestionForm
            initial={null}
            onSaved={handleSaved}
            onCancel={() => setEditing(null)}
          />
        )}

        <ul className="mt-4 flex flex-col gap-3">
          {questions.map((q) =>
            editing !== "new" && editing?.id === q.id ? (
              <QuestionForm
                key={q.id}
                initial={q}
                onSaved={handleSaved}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <li
                key={q.id}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>
                    {QUESTION_TYPE_LABELS[q.type]} ·{" "}
                    {QUESTION_FORMAT_LABELS[q.format]} · {q.timeLimitSec}s
                  </span>
                  <span className="flex gap-3">
                    <button
                      onClick={() => setEditing(q)}
                      className="font-medium text-brand"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => deleteQuestion(q)}
                      className="font-medium text-red-500"
                    >
                      삭제
                    </button>
                  </span>
                </div>
                <p className="mt-2 font-medium">{q.prompt}</p>
                {q.format === "short_answer" ? (
                  <p className="mt-2 text-sm">
                    정답:{" "}
                    <span className="font-bold text-brand">
                      {q.answers.join(", ")}
                    </span>
                  </p>
                ) : (
                  <ol className="mt-2 list-decimal pl-5 text-sm">
                    {q.choices.map((c, i) => (
                      <li
                        key={i}
                        className={
                          i === q.answerIndex ? "font-bold text-brand" : ""
                        }
                      >
                        {c}
                        {i === q.answerIndex && " ✓"}
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            )
          )}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">
          신고 ({reports.filter((r) => r.status === "open").length} / {reports.length})
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {reports.length === 0 ? (
            <li className="py-4 text-center text-sm text-muted">
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
                        r.status === "open" ? "resolved" : "open"
                      )
                    }
                    className="font-medium text-brand"
                  >
                    {r.status === "open" ? "처리 완료로" : "미처리로"}
                  </button>
                </div>
                <p className="mt-2 text-sm font-medium">{r.questionPrompt}</p>
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

      <section className="mt-10">
        <h2 className="text-lg font-bold">댓글 ({comments.length})</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {comments.length === 0 ? (
            <li className="py-4 text-center text-sm text-muted">댓글이 없습니다.</li>
          ) : (
            comments.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-semibold text-brand">{c.grade}등급</span>
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

      <section className="mt-10">
        <h2 className="text-lg font-bold">변경 로그 ({audits.length})</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {audits.length === 0 ? (
            <li className="py-4 text-center text-sm text-muted">
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
    </main>
  );
}
