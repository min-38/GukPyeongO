import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <p className="text-sm font-medium tracking-widest text-brand">
          국평오 테스트
        </p>

        <h1 className="text-3xl font-bold leading-snug tracking-tight">
          검색 없이 10문제.
          <br />
          당신의 문해력은 몇 등급?
        </h1>

        <p className="max-w-xs text-base leading-relaxed text-muted">
          회원가입 없이 바로 시작.
          <br />
          10문제 풀고 1~9등급 결과를 확인하세요.
        </p>
      </div>

      <Link
        href="/test"
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-lg font-semibold text-brand-foreground transition-opacity active:opacity-80"
      >
        테스트 시작
      </Link>
    </main>
  );
}
