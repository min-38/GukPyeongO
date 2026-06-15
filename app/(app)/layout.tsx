// 공개 페이지 셸 — 디바이스별 분기
//  · 폰(<sm): 풀블리드 단일 컬럼 surface
//  · 태블릿(sm~lg): 중앙 카드(여유 폭)
//  · PC(lg+): 폰 프레임 제거, 넓은 캔버스(투명) — 각 페이지가 2단 레이아웃을 구성
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-[100dvh] w-full max-w-[var(--app-max-width)] flex-col bg-surface shadow-[0_20px_60px_-20px_rgba(76,29,149,0.35)] sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:max-w-xl sm:overflow-hidden sm:rounded-[2rem] sm:border sm:border-border lg:my-0 lg:min-h-[100dvh] lg:max-w-6xl lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none">
      {children}
    </div>
  );
}
