"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  MAX_NICKNAME_LENGTH,
  NICKNAME_FORMAT_ERROR,
  NICKNAME_TAKEN_ERROR,
  type NicknameCheck,
  nicknameError,
} from "@/app/lib/account";

// 닉네임 확인 상태. unknown은 확인 요청이 실패한 것 — 저장할 때 서버가 다시 확인한다.
type Check = "checking" | "ok" | "format" | "taken" | "unknown";

const MESSAGE: Record<Check, { text: string; className: string }> = {
  checking: { text: "2~12자 한글, 영문, 숫자", className: "text-muted" },
  unknown: { text: "2~12자 한글, 영문, 숫자", className: "text-muted" },
  ok: { text: "사용 가능한 닉네임입니다.", className: "text-green-700 dark:text-green-400" },
  format: { text: NICKNAME_FORMAT_ERROR, className: "text-red-700 dark:text-red-400" },
  taken: { text: NICKNAME_TAKEN_ERROR, className: "text-red-700 dark:text-red-400" },
};

const checkbox = "size-5 shrink-0 accent-brand";

export default function SignupScreen({
  next,
  initialNickname,
  years,
}: {
  next: string;
  initialNickname: string;
  years: number[];
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialNickname);
  const [check, setCheck] = useState<Check>("checking");
  const [age, setAge] = useState(false);
  const [agree, setAgree] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [year, setYear] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 입력이 멈추고 0.5초 뒤 쓸 수 있는 닉네임인지 확인한다(A-04). 늦게 온 옛 응답은 버린다.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);
  const verify = (value: string, delay: number) => {
    if (timer.current) clearTimeout(timer.current);
    const id = ++seq.current;
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/nicknames/check?nickname=${encodeURIComponent(value)}`);
        const body = (await res.json()) as NicknameCheck;
        if (id === seq.current) setCheck(!res.ok ? "unknown" : body.available ? "ok" : body.reason);
      } catch {
        if (id === seq.current) setCheck("unknown");
      }
    }, delay);
  };

  useEffect(() => {
    verify(initialNickname, 0); // 미리 채운 무작위 닉네임도 확인한다.
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // 처음 한 번만.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onNickname = (value: string) => {
    setNickname(value);
    setError(null);
    if (nicknameError(value)) {
      seq.current++; // 진행 중인 확인 결과는 버린다.
      if (timer.current) clearTimeout(timer.current);
      setCheck("format");
      return;
    }
    setCheck("checking");
    verify(value, 500);
  };

  const onAgree = (on: boolean) => {
    setAgree(on);
    if (!on) setYear(""); // 동의를 풀면 고른 연도도 지운다(A-13).
  };

  const canSubmit = (check === "ok" || check === "unknown") && age && !submitting;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          ageConfirmed: true,
          birthYear: agree && year ? Number(year) : null,
          birthYearAgreed: agree,
        }),
      });
      if (res.ok) {
        router.replace(next); // 가입이 끝났다. 보던 화면으로 돌아간다(A-07).
        return;
      }
      if (res.status === 409) setCheck("taken"); // 누른 순간 다른 사람이 먼저 가져갔다.
      else setError(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "가입하지 못했습니다. 다시 시도해 주세요.");
    } catch {
      setError("가입하지 못했습니다. 다시 시도해 주세요.");
    }
    setSubmitting(false);
  };

  const invalid = check === "format" || check === "taken";
  const message = MESSAGE[check];

  return (
    <>
      <h1 className="-mt-5 text-center text-xl font-bold">사용할 닉네임을 정해 주세요</h1>

      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="nickname" className="text-sm font-bold">
            닉네임 <span className="font-medium text-muted">(필수)</span>
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            maxLength={MAX_NICKNAME_LENGTH}
            autoComplete="off"
            onChange={(e) => onNickname(e.target.value)}
            aria-invalid={invalid}
            aria-describedby="nickname-message"
            className={`h-12 w-full rounded-xl bg-surface px-4 text-base outline-none ${invalid ? "border-2 border-red-700 px-[15px] dark:border-red-400" : "border border-[#8e88ad] focus:border-2 focus:border-brand focus:px-[15px] dark:border-muted"}`}
          />
          <div className="flex items-start justify-between gap-3">
            <p id="nickname-message" aria-live="polite" className={`flex items-center gap-1 text-[13px] font-medium leading-5 ${message.className}`}>
              {check === "ok" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5 9-10" />
                </svg>
              )}
              {invalid && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              )}
              {message.text}
            </p>
            <span className="text-xs font-medium leading-5 text-muted tabular-nums">
              {nickname.length}/{MAX_NICKNAME_LENGTH}
            </span>
          </div>
        </div>

        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] font-medium">
          <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} className={checkbox} />
          만 14세 이상입니다
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand-strong">필수</span>
        </label>

        <div className="flex flex-col gap-2 border-t border-border pt-6">
          <p className="text-sm font-bold">
            출생 연도 <span className="font-medium text-muted">(선택)</span>
          </p>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] font-medium">
              <input type="checkbox" checked={agree} onChange={(e) => onAgree(e.target.checked)} className={checkbox} />
              출생 연도 수집에 동의합니다
            </label>
            <button
              type="button"
              aria-expanded={detailOpen}
              aria-controls="agree-detail"
              onClick={() => setDetailOpen((o) => !o)}
              className="flex min-h-11 items-center gap-0.5 px-1 text-sm font-medium text-brand-strong"
            >
              {detailOpen ? "내용 닫기" : "내용 보기"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={detailOpen ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
              </svg>
            </button>
          </div>
          {detailOpen && (
            <dl id="agree-detail" className="mb-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 rounded-xl border border-border px-4 py-3.5 text-[13px] leading-5">
              <dt className="font-bold">항목</dt>
              <dd>출생 연도</dd>
              <dt className="font-bold">목적</dt>
              <dd>연령대별 통계</dd>
              <dt className="font-bold">보관 기간</dt>
              <dd>탈퇴할 때까지</dd>
              <dt className="font-bold">거부할 때</dt>
              <dd>동의하지 않아도 가입할 수 있습니다.</dd>
            </dl>
          )}
          <label htmlFor="birth-year" className="sr-only">출생 연도</label>
          <select
            id="birth-year"
            value={year}
            disabled={!agree}
            onChange={(e) => setYear(e.target.value)}
            className="h-12 w-[168px] rounded-xl border border-[#8e88ad] bg-surface px-3 text-[15px] disabled:border-border disabled:bg-surface-muted disabled:text-muted dark:border-muted"
          >
            <option value="">연도 선택</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          {!agree && <p className="text-xs leading-[18px] text-muted">동의하면 연도를 고를 수 있어요. 고르지 않아도 가입할 수 있어요.</p>}
        </div>

        <div className="flex flex-col gap-2">
          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-[52px] rounded-2xl bg-brand text-base font-bold text-brand-foreground enabled:hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40"
          >
            시작하기
          </button>
        </div>
      </form>

      <a href="/privacy" target="_blank" rel="noopener" className="-mt-3 self-center text-[13px] leading-5 text-muted underline">
        개인정보처리방침
      </a>
    </>
  );
}
