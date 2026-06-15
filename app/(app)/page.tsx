import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-6 pb-8 pt-12 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-16 lg:py-0">
      {/* 왼쪽: 히어로 + CTA */}
      <div className="flex flex-1 flex-col lg:flex-none">
        <div className="flex flex-1 flex-col items-center justify-center gap-7 text-center lg:flex-none lg:items-start lg:gap-8 lg:text-left">
          <span className="animate-float inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground shadow-sm">
            🔍 검색 금지 · 1분 컷
          </span>

          <div className="flex flex-col items-center gap-4 lg:items-start">
            <h1 className="font-display text-6xl leading-[0.95] tracking-tight text-brand lg:text-8xl">
              국평오
              <br />
              테스트
            </h1>
            <p className="text-2xl font-extrabold leading-snug lg:text-4xl">
              검색 없이 10문제,
              <br />
              <span className="text-brand">내 문해력은 몇 등급?</span>
            </p>
          </div>

          <p className="max-w-xs text-base leading-relaxed text-muted lg:max-w-md lg:text-lg">
            회원가입 없이 바로 시작. 1~9등급으로 결과가 딱 나와요. 친구랑 점수로
            승부 보세요.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 lg:justify-start">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
              <span
                key={g}
                className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-bold lg:h-10 lg:w-10 lg:text-base ${
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
          className="group mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-brand-foreground shadow-lg shadow-brand/30 transition-all hover:bg-brand-strong active:scale-[0.98] lg:mt-10 lg:h-16 lg:w-auto lg:self-start lg:px-12 lg:text-xl"
        >
          테스트 시작
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
        <p className="mt-3 text-center text-xs text-muted lg:text-left lg:text-sm">
          평균은 5등급. 과연 당신은?
        </p>
      </div>

      {/* 오른쪽: 데스크톱 전용 비주얼 (샘플 결과 카드) */}
      <div className="hidden lg:flex lg:items-center lg:justify-center">
        <div className="animate-float w-full max-w-sm rounded-[2rem] border border-border bg-surface p-8 text-center shadow-[0_20px_60px_-20px_rgba(76,29,149,0.35)]">
          <span className="text-6xl">😐</span>
          <p className="mt-3 text-sm font-bold tracking-widest text-muted">
            나의 문해력
          </p>
          <p className="font-display text-7xl leading-none tracking-tight text-brand">
            5<span className="ml-1 align-top text-2xl">등급</span>
          </p>
          <p className="mt-2 inline-block rounded-full bg-brand px-4 py-1.5 text-base font-extrabold text-brand-foreground">
            딱 평균, 국평오
          </p>
          <p className="mt-4 text-sm text-muted">
            결과는 이렇게 나와요. 당신의 등급은?
          </p>
        </div>
      </div>
    </main>
  );
}
