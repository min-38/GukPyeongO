"use client";

import Link from "next/link";
import { useEffect } from "react";

// 렌더 도중 던져진 오류를 받는 자리(500 성격). 라우트 세그먼트 경계라 "use client"가 필수다.
//
// 회차를 푸는 중에 여기로 떨어지면 그때까지 고른 답이 화면에서 사라진다 —
// 다만 답은 문항을 풀 때마다 서버에 남으므로(scenario_step_answers), 다시 들어가
// 이어서 풀면 이미 낸 답은 그대로 인정된다. 그 사실을 알려줘야 사용자가 포기하지 않는다.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 서버 로그(Vercel)에서 digest 로 이 오류를 찾을 수 있다.
    console.error("[app] 처리하지 못한 오류", error.digest, error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <span className="text-6xl" aria-hidden>
        🛠️
      </span>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl">문제가 생겼어요</h1>
        <p className="text-sm leading-relaxed text-muted">
          잠시 후 다시 시도해 주세요.
          <br />
          지금까지 낸 답은 저장돼 있어요.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <button
          type="button"
          onClick={reset}
          className="flex h-12 items-center justify-center rounded-2xl bg-brand text-base font-bold text-brand-foreground shadow-lg shadow-brand/30 transition-colors hover:bg-brand-strong active:scale-[0.98]"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="flex h-12 items-center justify-center rounded-2xl bg-surface-muted text-base font-bold text-brand transition-colors hover:text-brand-strong active:scale-[0.98]"
        >
          처음으로
        </Link>
      </div>

      {/* 문의를 받을 때 이 값이 있으면 서버 로그에서 바로 찾을 수 있다. */}
      {error.digest && (
        <p className="font-mono text-[11px] text-muted">오류 코드 {error.digest}</p>
      )}
    </main>
  );
}
