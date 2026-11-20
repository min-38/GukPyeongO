"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { PROVIDERS, type ProviderId } from "@/app/lib/account";

// 구글 G는 공식 버튼 묶음(signin-assets.zip)의 것을 잘라 쓴다(public/icons/google-g.svg).
// shortcut: 카카오 말풍선과 네이버 N은 비슷하게 그린 것이다. 각 회사 개발자 콘솔의 공식 로그인 리소스를 받으면 바꾼다.
const BUTTON: Record<ProviderId, string> = {
  google: "border border-[#747775] bg-white text-[#1f1f1f]",
  kakao: "bg-[#fee500] text-black/85",
  "custom:naver": "bg-[#03c75a] text-white",
};

function Mark({ id }: { id: ProviderId }) {
  if (id === "google") return <Image src="/icons/google-g.svg" alt="" width={20} height={20} unoptimized />;
  if (id === "kakao") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4C6.9 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 5.9l-1 3.7c-.1.3.3.6.6.4l4.3-2.9c.3 0 .6.1.9.1 5.1 0 9-3.1 9-7.2S17.1 4 12 4z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <span aria-hidden="true" className="inline-flex size-5 items-center justify-center font-[Arial,sans-serif] text-[17px] font-black">
      N
    </span>
  );
}

export default function LoginScreen({ next, error }: { next: string; error: string | null }) {
  const [pending, setPending] = useState<ProviderId | null>(null);

  // 소셜 로그인 페이지에서 뒤로 가기로 돌아오면 브라우저가 떠나기 전 화면을 그대로 보여 줄 수 있다. 로딩을 푼다.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setPending(null);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  // 같은 탭에서 소셜 로그인 페이지로 넘어간다(/auth/login이 시작한다). 넘어갈 때까지 버튼을 막고 누른 버튼에 로딩을 띄운다.
  const start = (provider: ProviderId) => {
    setPending(provider);
    location.assign(`/auth/login?provider=${encodeURIComponent(provider)}&next=${encodeURIComponent(next)}`);
  };

  return (
    <>
      <div className="-mt-5 flex items-center gap-4">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <h1 className="text-base font-medium tracking-[0.12em] text-muted">로그인</h1>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col gap-4">
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" className="shrink-0">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5v5.5M12 16.5v.01" />
            </svg>
            {error}
          </p>
        )}
        <div className="flex flex-col gap-3">
          {PROVIDERS.map((p) => {
            const busy = pending === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => start(p.id)}
                disabled={pending !== null}
                aria-busy={busy}
                className={`relative flex h-[52px] items-center justify-center rounded-xl px-14 text-base font-bold ${BUTTON[p.id]} ${busy ? "cursor-progress" : "disabled:cursor-not-allowed disabled:opacity-40"}`}
              >
                {/* 아이콘은 세 버튼 모두 같은 자리(왼쪽 끝), 글자는 가운데. */}
                <span className="absolute left-4 flex size-6 items-center justify-center">
                  {busy ? (
                    <span aria-hidden="true" className="size-5 animate-spin rounded-full border-[2.5px] border-current border-t-transparent motion-reduce:[animation-duration:2.4s]" />
                  ) : (
                    <Mark id={p.id} />
                  )}
                </span>
                {busy ? `${p.label} 로그인 중` : `${p.label}로 시작하기`}
              </button>
            );
          })}
        </div>
      </div>

      {/* 새 탭으로 연다. 가입 화면에서 쓰던 것이 날아가지 않게. */}
      <a href="/privacy" target="_blank" rel="noopener" className="-mt-3 self-center text-[13px] leading-5 text-muted underline">
        개인정보처리방침
      </a>
    </>
  );
}
