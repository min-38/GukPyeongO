import Link from "next/link";

// 로그인 화면과 가입 화면의 틀. 헤더 없이 가운데 위 로고만 둔다(로그인/회원가입 명세서 A-12).
// 시안: 로그인/회원가입 웹 시안(claude.ai Design 캔버스).
export default function AuthShell({ children }: { children: React.ReactNode }) {
  const initial = "font-display text-[34px] font-normal text-brand-strong";
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-[440px] flex-col gap-8 rounded-3xl border border-border bg-surface px-6 py-12 sm:px-10">
        <Link
          href="/problems"
          aria-label="국평오, 문제 목록으로 가기"
          className="self-center whitespace-nowrap text-[17px] font-bold leading-10 text-foreground"
        >
          <span className={initial}>국</span>민 문해력 <span className={initial}>평</span>균을{" "}
          <span className={initial}>오</span>르게
        </Link>
        {children}
      </div>
    </main>
  );
}
