"use client";

import { useEffect, useState } from "react";

import {
  type AdminQuestion,
  type AdminReport,
  AUDIT_ACTION_LABELS,
  type Comment,
  DIFFICULTY_LABELS,
  QUESTION_FORMAT_LABELS,
  type QuestionAudit,
  type QuestionFormat,
  type QuestionType,
  type QuestionTypeDef,
  resolveTypeLabel,
} from "@/app/lib/quiz";

const FORMATS = Object.keys(QUESTION_FORMAT_LABELS) as QuestionFormat[];
const DIFFICULTIES = Object.keys(DIFFICULTY_LABELS).map(Number);

type Tab = "questions" | "types" | "reports" | "comments" | "audit";

// 유형 키 → "이모지 라벨" 표시 문자열
function typeBadge(type: string, types: QuestionTypeDef[]): string {
  const td = types.find((t) => t.key === type);
  return td ? `${td.emoji} ${td.label}`.trim() : resolveTypeLabel(type);
}

function QuestionForm({
  initial,
  types,
  onSaved,
  onCancel,
}: {
  initial: AdminQuestion | null;
  types: QuestionTypeDef[];
  onSaved: (q: AdminQuestion) => void;
  onCancel: () => void;
}) {
  const isNew = initial === null;
  const [type, setType] = useState<QuestionType>(
    initial?.type ?? types[0]?.key ?? "notice"
  );
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
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? 2);
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
          ...(isNew ? {} : { id: initial.id }),
          type,
          format,
          prompt,
          choices,
          answerIndex,
          answers,
          timeLimitSec,
          difficulty,
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
      className="flex flex-col gap-3 rounded-2xl border border-brand bg-surface p-4"
    >
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          유형
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 rounded-xl border border-border bg-surface px-3"
          >
            {types.map((t) => (
              <option key={t.key} value={t.key}>
                {t.emoji} {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1 text-sm">
          형식
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as QuestionFormat)}
            className="h-10 rounded-xl border border-border bg-surface px-3"
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
          rows={format === "spacing" ? 4 : 2}
          className="resize-none rounded-xl border border-border bg-surface px-3 py-2"
        />
      </label>

      {format === "multiple_choice" ? (
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
                className="h-10 flex-1 rounded-xl border border-border bg-surface px-3"
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
      ) : (
        <div className="flex flex-col gap-2 text-sm">
          <span>
            허용 정답 (하나라도 일치하면 정답
            {format === "spacing"
              ? ", 띄어쓰기는 유지·대소문자 무시"
              : ", 공백·대소문자 무시"}
            )
          </span>
          {answers.map((ans, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={ans}
                onChange={(e) =>
                  setAnswers((as) =>
                    as.map((a, idx) => (idx === i ? e.target.value : a))
                  )
                }
                placeholder={format === "spacing" ? "예: 아버지가 방에" : "예: 오늘"}
                className="h-10 flex-1 rounded-xl border border-border bg-surface px-3"
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
      )}

      <div className="flex gap-3">
        <label className="flex flex-col gap-1 text-sm">
          제한시간(초)
          <input
            type="number"
            value={timeLimitSec}
            onChange={(e) => setTimeLimitSec(Number(e.target.value))}
            className="h-10 w-24 rounded-xl border border-border bg-surface px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          난이도
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="h-10 rounded-xl border border-border bg-surface px-3"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABELS[d]}
              </option>
            ))}
          </select>
        </label>
      </div>

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

function TypeForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: QuestionTypeDef | null;
  onSaved: (t: QuestionTypeDef) => void;
  onCancel: () => void;
}) {
  const isNew = initial === null;
  const [key, setKey] = useState(initial?.key ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/question-types", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: isNew ? key.trim() : initial.key,
          label,
          emoji,
          sortOrder,
        }),
      });
      const data = (await res.json()) as {
        type?: QuestionTypeDef;
        error?: string;
      };
      if (!res.ok || !data.type) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      onSaved(data.type);
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
        <label className="flex w-20 flex-col gap-1 text-sm">
          이모지
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="📚"
            className="h-10 rounded-xl border border-border bg-surface px-3 text-center"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          이름(라벨)
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="예: 속담"
            className="h-10 rounded-xl border border-border bg-surface px-3"
          />
        </label>
        <label className="flex w-24 flex-col gap-1 text-sm">
          정렬
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="h-10 rounded-xl border border-border bg-surface px-3"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        키 (영문 소문자·숫자·_, 저장 후 변경 불가)
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          disabled={!isNew}
          placeholder="예: proverb"
          className="h-10 rounded-xl border border-border bg-surface px-3 font-mono disabled:opacity-60"
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
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [types, setTypes] = useState<QuestionTypeDef[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [audits, setAudits] = useState<QuestionAudit[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("questions");
  const [editing, setEditing] = useState<AdminQuestion | "new" | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editingType, setEditingType] = useState<QuestionTypeDef | "new" | null>(
    null
  );

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/admin/questions").then(async (r) => {
        if (r.status === 401) throw new Error("401");
        return r.json() as Promise<{ questions: AdminQuestion[] }>;
      }),
      fetch("/api/admin/question-types").then(
        (r) => r.json() as Promise<{ types: QuestionTypeDef[] }>
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
      .then(([q, t, c, rp, a]) => {
        if (!active) return;
        setQuestions(q.questions ?? []);
        setTypes(t.types ?? []);
        setComments(c.comments ?? []);
        setReports(rp.reports ?? []);
        setAudits(a.audits ?? []);
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

  function handleSaved(q: AdminQuestion) {
    setQuestions((prev) =>
      prev.some((p) => p.id === q.id)
        ? prev.map((p) => (p.id === q.id ? q : p))
        : [...prev, q]
    );
    setEditing(null);
    void refreshAudit();
  }

  function handleTypeSaved(t: QuestionTypeDef) {
    setTypes((prev) => {
      const next = prev.some((p) => p.key === t.key)
        ? prev.map((p) => (p.key === t.key ? t : p))
        : [...prev, t];
      return next.sort((a, b) => a.sortOrder - b.sortOrder);
    });
    setEditingType(null);
  }

  async function deleteType(t: QuestionTypeDef) {
    if (!confirm(`'${t.label}' 유형을 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/question-types?key=${t.key}`, {
      method: "DELETE",
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) {
      setTypes((prev) => prev.filter((p) => p.key !== t.key));
    } else {
      alert(data.error ?? "삭제에 실패했습니다.");
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

  const openReports = reports.filter((r) => r.status === "open").length;
  const countByType = (key: string) =>
    questions.filter((q) => q.type === key).length;
  const filteredQuestions =
    typeFilter === "all"
      ? questions
      : questions.filter((q) => q.type === typeFilter);

  const nav: { id: Tab; emoji: string; label: string; count: number }[] = [
    { id: "questions", emoji: "📝", label: "문제", count: questions.length },
    { id: "types", emoji: "🏷️", label: "유형", count: types.length },
    { id: "reports", emoji: "🚩", label: "신고", count: openReports },
    { id: "comments", emoji: "💬", label: "댓글", count: comments.length },
    { id: "audit", emoji: "🕑", label: "로그", count: audits.length },
  ];

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* 사이드바 (데스크톱) */}
      <aside className="hidden shrink-0 flex-col gap-1 border-r border-border p-5 lg:flex lg:w-56">
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

      {/* 상단 탭 (모바일) */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <h1 className="text-lg font-extrabold">관리자</h1>
        <button onClick={logout} className="text-sm font-medium text-muted">
          로그아웃
        </button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto border-b border-border px-4 py-2 lg:hidden">
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-colors ${
              tab === n.id
                ? "bg-brand text-brand-foreground"
                : "bg-surface-muted text-muted"
            }`}
          >
            <span>{n.emoji}</span>
            {n.label}
            {n.count > 0 && <span className="opacity-70">{n.count}</span>}
          </button>
        ))}
      </div>

      {/* 본문 */}
      <main className="flex-1 overflow-x-hidden px-5 py-6 lg:px-8">
        {tab === "questions" && (
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                문제 <span className="text-muted">({filteredQuestions.length})</span>
              </h2>
              {editing === null && (
                <button
                  onClick={() => setEditing("new")}
                  className="rounded-xl bg-brand px-3 py-1.5 text-sm font-semibold text-brand-foreground"
                >
                  + 문제 추가
                </button>
              )}
            </div>

            {/* 유형 필터 칩 */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <button
                onClick={() => setTypeFilter("all")}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                  typeFilter === "all"
                    ? "bg-brand text-brand-foreground"
                    : "bg-surface-muted text-muted"
                }`}
              >
                전체 {questions.length}
              </button>
              {types.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTypeFilter(t.key)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                    typeFilter === t.key
                      ? "bg-brand text-brand-foreground"
                      : "bg-surface-muted text-muted"
                  }`}
                >
                  {t.emoji} {t.label} {countByType(t.key)}
                </button>
              ))}
            </div>

            {editing === "new" && (
              <div className="mt-4">
                <QuestionForm
                  initial={null}
                  types={types}
                  onSaved={handleSaved}
                  onCancel={() => setEditing(null)}
                />
              </div>
            )}

            <ul className="mt-4 flex flex-col gap-3">
              {filteredQuestions.map((q) =>
                editing !== "new" && editing?.id === q.id ? (
                  <QuestionForm
                    key={q.id}
                    initial={q}
                    types={types}
                    onSaved={handleSaved}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <li
                    key={q.id}
                    className="rounded-2xl border border-border bg-surface p-4"
                  >
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="flex items-center gap-2">
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 font-bold text-brand">
                          {typeBadge(q.type, types)}
                        </span>
                        <span>
                          {QUESTION_FORMAT_LABELS[q.format]} · {q.timeLimitSec}s
                          {" · "}
                          {DIFFICULTY_LABELS[q.difficulty] ?? "보통"}
                        </span>
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
                    <p className="mt-2 whitespace-pre-wrap font-medium">
                      {q.prompt}
                    </p>
                    {q.format === "multiple_choice" ? (
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
                    ) : (
                      <p className="mt-2 text-sm">
                        정답:{" "}
                        <span className="font-bold text-brand">
                          {q.answers.join(", ")}
                        </span>
                      </p>
                    )}
                  </li>
                )
              )}
              {filteredQuestions.length === 0 && (
                <li className="py-8 text-center text-sm text-muted">
                  이 유형의 문제가 없습니다.
                </li>
              )}
            </ul>
          </section>
        )}

        {tab === "types" && (
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                유형 <span className="text-muted">({types.length})</span>
              </h2>
              {editingType === null && (
                <button
                  onClick={() => setEditingType("new")}
                  className="rounded-xl bg-brand px-3 py-1.5 text-sm font-semibold text-brand-foreground"
                >
                  + 유형 추가
                </button>
              )}
            </div>

            {editingType === "new" && (
              <div className="mt-4">
                <TypeForm
                  initial={null}
                  onSaved={handleTypeSaved}
                  onCancel={() => setEditingType(null)}
                />
              </div>
            )}

            <ul className="mt-4 flex flex-col gap-3">
              {types.map((t) =>
                editingType !== "new" && editingType?.key === t.key ? (
                  <TypeForm
                    key={t.key}
                    initial={t}
                    onSaved={handleTypeSaved}
                    onCancel={() => setEditingType(null)}
                  />
                ) : (
                  <li
                    key={t.key}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
                  >
                    <span className="text-2xl">{t.emoji || "🏷️"}</span>
                    <div className="flex-1">
                      <p className="font-bold">{t.label}</p>
                      <p className="text-xs text-muted">
                        <span className="font-mono">{t.key}</span> · 정렬{" "}
                        {t.sortOrder} · 문제 {countByType(t.key)}개
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingType(t)}
                      className="text-sm font-medium text-brand"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => deleteType(t)}
                      className="text-sm font-medium text-red-500"
                    >
                      삭제
                    </button>
                  </li>
                )
              )}
              {types.length === 0 && (
                <li className="py-8 text-center text-sm text-muted">
                  유형이 없습니다. question_types 마이그레이션을 실행했는지
                  확인하세요.
                </li>
              )}
            </ul>
          </section>
        )}

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
      </main>
    </div>
  );
}
