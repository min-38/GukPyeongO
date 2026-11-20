import Link from "next/link";

import { getCurrentProfile } from "@/app/lib/account.server";

import AccountMenu from "./AccountMenu";

// v2 헤더(문제 목록 웹 시안). 목록과 풀이 화면이 같이 쓴다.
// 데스크톱에서는 가운데 칸(max-w-6xl)과 body 여백을 넘어 화면 끝까지 흰 띠로 깐다.
// shortcut: 랭킹, 커뮤니티는 화면이 아직 없어 누를 수 없게 둔다. 그 작업 때 링크로 바꾼다.
export default async function ProblemsLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  return (
    <>
      <header className="border-b border-border bg-surface lg:-mt-6 lg:mx-[calc(50%-50vw)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-3.5">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
            <Link href="/" className="font-display text-[28px] leading-9">
              국평오
            </Link>
            <nav aria-label="주 메뉴" className="flex gap-8 text-base font-medium">
              <Link href="/problems" aria-current="page" className="border-b-2 border-brand pb-1 font-bold text-brand-strong">
                문제
              </Link>
              <button type="button" disabled title="준비 중입니다" className="pb-1.5 text-muted disabled:cursor-not-allowed">
                랭킹
              </button>
              <button type="button" disabled title="준비 중입니다" className="pb-1.5 text-muted disabled:cursor-not-allowed">
                커뮤니티
              </button>
            </nav>
          </div>
          <AccountMenu nickname={profile?.nickname ?? null} />
        </div>
      </header>
      {children}
    </>
  );
}
