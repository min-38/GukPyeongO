import Link from "next/link";

import GradeCharacter from "./(app)/GradeCharacter";

// 404. 없는 주소로 들어왔을 때.
//
// 미들웨어가 막는 경로(#87 개발용 slug, ADMIN_ENABLED 없을 때의 어드민)도
// /not-found 로 rewrite 되어 여기로 온다 — 막힌 것인지 없는 것인지 굳이 알려주지 않는다.
//
// 루트에 두는 이유: (app) 그룹 안에 두면 그 그룹 밖의 주소(예: /admin/…)에서는
// 안 잡힌다. 대신 (app) 레이아웃의 카드 셸을 못 받으므로 여백을 직접 준다.
export const metadata = {
  title: "찾을 수 없는 페이지",
};

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] w-full max-w-[var(--app-max-width)] flex-col items-center justify-center gap-6 bg-surface px-6 py-10 text-center sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:max-w-xl sm:rounded-[2rem] sm:border sm:border-border">
      <GradeCharacter grade={9} className="h-28 w-28" />

      <p className="font-display text-3xl">여긴 아무것도 없어요</p>

      <Link
        href="/"
        className="flex h-12 w-full max-w-xs items-center justify-center rounded-2xl bg-brand text-base font-bold text-brand-foreground shadow-lg shadow-brand/30 transition-colors hover:bg-brand-strong active:scale-[0.98]"
      >
        홈으로
      </Link>
    </main>
  );
}
