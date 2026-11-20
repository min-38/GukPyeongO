"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { loginHref } from "@/app/lib/account";

// 헤더 오른쪽 로그인 상태(로그인/회원가입 명세서 요소 11~13).
export default function AccountMenu({ nickname }: { nickname: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // 메뉴 밖을 누르면 닫는다.
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!nickname) {
    return (
      <Link
        href={loginHref(search ? `${pathname}?${search}` : pathname)}
        className="flex h-11 items-center rounded-2xl border border-brand bg-surface px-5 text-[15px] font-bold text-brand-strong hover:bg-brand/10"
      >
        로그인/회원가입
      </Link>
    );
  }

  // 확인 없이 바로 로그아웃하고 보던 화면에 비로그인으로 남는다(A-09).
  const logout = async () => {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.refresh();
  };

  return (
    <div ref={box} className="relative" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-11 items-center gap-2.5 rounded-full border pl-1.5 pr-4 text-[15px] font-bold ${open ? "border-brand bg-brand/10" : "border-border bg-surface hover:bg-brand/5"}`}
      >
        {/* 프로필 사진 자리. 아직 사진을 받지 않아 기본 아이콘을 둔다. */}
        <span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-full text-brand-strong ${open ? "bg-surface" : "bg-brand/10"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="9" r="3.5" />
            <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
          </svg>
        </span>
        {nickname}
      </button>
      {open && (
        <div role="menu" aria-label="내 계정" className="absolute right-0 top-[52px] z-10 w-[168px] rounded-xl border border-border bg-surface p-1.5 shadow-[0_12px_32px_-12px_rgba(27,22,48,0.25)]">
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-[15px] font-medium text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
              <path d="M10 16l-4-4 4-4" />
              <path d="M6 12h10" />
            </svg>
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
