"use client";

import { useRef, useState } from "react";

import {
  INQUIRY_KIND_LABELS,
  INQUIRY_KINDS,
  type InquiryKind,
  MAX_INQUIRY_CONTACT_LENGTH,
  MAX_INQUIRY_LENGTH,
} from "@/app/lib/quiz";

// 푸터의 문의. 메일 주소를 내걸면 답장이 메일함으로 흩어져 무엇이 들어왔는지 남지 않는다.
// 어드민 문의함으로 바로 받는다.
//
// 새 페이지로 보내지 않고 겹쳐 띄우는 이유: 결과 화면에서 문의하는 사람이
// 자기 결과를 잃지 않아야 한다. <dialog>는 초점 가둠·ESC·바깥 어둡게를 브라우저가 해준다.

export default function InquiryDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState<InquiryKind>("question");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open() {
    setDone(false);
    setError(null);
    ref.current?.showModal();
  }

  function close() {
    ref.current?.close();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending || message.trim().length === 0) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          message,
          contact,
          path: window.location.pathname,
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error ?? "보내지 못했습니다.");
        return;
      }
      setDone(true);
      setMessage("");
      setContact("");
    } catch {
      setError("보내지 못했습니다. 연결을 확인해주세요.");
    } finally {
      setSending(false);
    }
  }

  const INPUT =
    "w-full rounded-xl border-2 border-border bg-surface px-3 py-2 text-base outline-none transition-colors focus:border-brand";

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="font-medium transition-colors hover:text-foreground"
      >
        문의하기
      </button>

      <dialog
        ref={ref}
        aria-labelledby="inquiry-title"
        // m-auto 로 가운데를 잡는다 — <dialog> 는 브라우저 기본 margin:auto 로 가운데 오는데
        // Tailwind 초기화가 margin 을 0으로 되돌려 좌상단에 붙어 버린다.
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-left text-foreground backdrop:bg-black/40"
      >
        <form onSubmit={submit} className="flex flex-col gap-3 p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id="inquiry-title" className="text-lg font-extrabold">
              문의하기
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="닫기"
              className="grid h-11 w-11 shrink-0 -translate-y-2 translate-x-2 place-items-center rounded-full text-muted hover:bg-surface-muted"
            >
              ✕
            </button>
          </div>

          {done ? (
            <>
              <p className="text-sm leading-relaxed text-muted">
                접수했어요. 남겨주신 곳으로 답을 드릴게요.
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-1 h-12 rounded-2xl bg-brand text-base font-bold text-brand-foreground active:scale-[0.98]"
              >
                닫기
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {INQUIRY_KINDS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    aria-pressed={kind === k}
                    className={`rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${
                      kind === k
                        ? "bg-brand text-brand-foreground"
                        : "bg-surface-muted text-muted"
                    }`}
                  >
                    {INQUIRY_KIND_LABELS[k]}
                  </button>
                ))}
              </div>

              <label className="text-xs font-bold text-muted">
                내용
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={MAX_INQUIRY_LENGTH}
                  rows={5}
                  required
                  placeholder="무엇이 불편했는지 적어주세요."
                  className={`mt-1 resize-none ${INPUT}`}
                />
              </label>

              <label className="text-xs font-bold text-muted">
                답장받을 곳 (선택)
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  maxLength={MAX_INQUIRY_CONTACT_LENGTH}
                  placeholder="이메일 등 · 안 적으면 답을 드릴 수 없어요"
                  className={`mt-1 ${INPUT}`}
                />
              </label>

              {error && (
                <p role="alert" className="text-sm font-medium text-red-500">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending || message.trim().length === 0}
                className="mt-1 h-12 rounded-2xl bg-brand text-base font-bold text-brand-foreground transition-all active:scale-[0.98] disabled:opacity-40"
              >
                {sending ? "보내는 중…" : "보내기"}
              </button>
            </>
          )}
        </form>
      </dialog>
    </>
  );
}
