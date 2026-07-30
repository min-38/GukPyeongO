"use client";

import { useEffect, useState } from "react";

import {
  type PatchNote,
  type PatchType,
  PATCH_TYPE_LABELS,
  PATCH_TYPES,
} from "@/app/lib/quiz";

import PageHeader from "./PageHeader";

// 패치노트 (#59). 유저에게 보이는 변경 안내를 여기서 쓴다.

// 작성과 수정이 같은 폼을 쓴다 — 규칙도 서버에서 한 벌이다.
// note가 있으면 수정, 없으면 새로 쓴다.
function PatchForm({
  note,
  onSaved,
  onCancel,
}: {
  note?: PatchNote;
  onSaved: (n: PatchNote) => void;
  onCancel: () => void;
}) {
  const [version, setVersion] = useState(note?.version ?? "");
  const [type, setType] = useState<PatchType>(note?.type ?? "new");
  const [content, setContent] = useState(note?.content ?? "");
  const [patchedAt, setPatchedAt] = useState(
    (note?.patchedAt ?? new Date().toISOString()).slice(0, 10),
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
        method: note ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(note ? { id: note.id } : {}),
          version,
          type,
          content,
          patchedAt,
        }),
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



export default function PatchTab() {
  const [patchNotes, setPatchNotes] = useState<PatchNote[]>([]);
  // "new" = 새로 쓰기, 그 외 문자열 = 그 id의 패치노트를 고치는 중.
  const [editingPatch, setEditingPatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/patch-notes")
      .then((r) => r.json() as Promise<{ patchNotes?: PatchNote[] }>)
      .then((d) => alive && setPatchNotes(d.patchNotes ?? []))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  function handlePatchSaved(n: PatchNote) {
    setPatchNotes((prev) =>
      [n, ...prev.filter((p) => p.id !== n.id)].sort((a, b) =>
        b.patchedAt.localeCompare(a.patchedAt),
      ),
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

  if (loading) return <p className="text-sm text-muted">불러오는 중…</p>;

  return (
    <section>
        <PageHeader
          title="패치노트"
          count={patchNotes.length}
          actions={
            editingPatch === null ? (
              <button
                onClick={() => setEditingPatch("new")}
                className="rounded-xl bg-brand px-3 py-1.5 text-sm font-bold text-brand-foreground"
              >
                패치노트 작성
              </button>
            ) : null
          }
        />
    
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
                    onClick={() => setEditingPatch(p.id)}
                    className="ml-auto font-medium text-brand"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => deletePatchNote(p.id)}
                    className="font-medium text-red-500"
                  >
                    삭제
                  </button>
                </div>
                {editingPatch === p.id ? (
                  <div className="mt-3">
                    <PatchForm
                      note={p}
                      onSaved={handlePatchSaved}
                      onCancel={() => setEditingPatch(null)}
                    />
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                    {p.content}
                  </p>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
  );
}
