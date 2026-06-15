import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-6 pb-8 pt-12">
      <div className="flex flex-1 flex-col items-center justify-center gap-7 text-center">
        <span className="animate-float inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground shadow-sm">
          🔍 검색 금지 · 1분 컷
        </span>

        <div className="flex flex-col items-center gap-4">
          <h1 className="font-display text-6xl leading-[0.95] tracking-tight text-brand">
            국평오
            <br />
            테스트
          </h1>
          <p className="text-2xl font-extrabold leading-snug">
            검색 없이 10문제,
            <br />
            <span className="text-brand">내 문해력은 몇 등급?</span>
          </p>
        </div>

        <p className="max-w-xs text-base leading-relaxed text-muted">
          회원가입 없이 바로 시작. 1~9등급으로 결과가 딱 나와요. 친구랑 점수로
          승부 보세요.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
            <span
              key={g}
              className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-bold ${
                g === 5
                  ? "bg-brand text-brand-foreground"
                  : "bg-surface-muted text-muted"
              }`}
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      <Link
        href="/test"
        className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-brand-foreground shadow-lg shadow-brand/30 transition-all hover:bg-brand-strong active:scale-[0.98]"
      >
        테스트 시작
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </Link>
      <p className="mt-3 text-center text-xs text-muted">
        평균은 5등급. 과연 당신은?
      </p>
    </main>
  );
}
