import type { Metadata } from "next";
import Link from "next/link";

import { getPatchNotes } from "@/app/lib/patch-notes.server";
import {
  type PatchNote,
  type PatchType,
  PATCH_TYPE_LABELS,
} from "@/app/lib/quiz";

export const metadata: Metadata = {
  title: "패치노트 — 국평오 테스트",
  description: "국평오 테스트 업데이트 내역.",
};

// 매 요청 시 최신 패치노트를 반영한다.
export const dynamic = "force-dynamic";

// 유형별 뱃지 색상
const TYPE_BADGE: Record<PatchType, string> = {
  new: "bg-brand/10 text-brand",
  fix: "bg-green-500/10 text-green-600",
  improve: "bg-blue-500/10 text-blue-600",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PatchPage() {
  let notes: PatchNote[] = [];
  try {
    notes = await getPatchNotes();
  } catch {
    notes = [];
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-10 lg:items-center lg:py-16">
      <article className="w-full max-w-2xl">
        <h1 className="font-display text-3xl lg:text-4xl">패치노트</h1>
        <p className="mt-2 text-sm text-muted">
          국평오 테스트의 업데이트 내역입니다.
        </p>

        {notes.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted">
            아직 등록된 패치노트가 없어요.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-4">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TYPE_BADGE[note.type]}`}
                  >
                    {PATCH_TYPE_LABELS[note.type]}
                  </span>
                  <span className="font-display text-lg">{note.version}</span>
                  <span className="ml-auto text-xs text-muted">
                    {formatDate(note.patchedAt)}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                  {note.content}
                </p>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/"
          className="mt-10 inline-flex h-12 items-center justify-center rounded-2xl border-2 border-border px-6 text-base font-bold transition-colors hover:bg-surface-muted"
        >
          ← 홈으로
        </Link>
      </article>
    </main>
  );
}
