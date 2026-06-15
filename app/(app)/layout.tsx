// 공개 페이지(랜딩/테스트/결과) 셸 — 모바일 풀블리드 / 태블릿·PC 폰 프레임 카드
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-[100dvh] w-full max-w-[var(--app-max-width)] flex-col bg-surface shadow-[0_20px_60px_-20px_rgba(76,29,149,0.35)] sm:min-h-[calc(100dvh-3rem)] sm:overflow-hidden sm:rounded-[2rem] sm:border sm:border-border">
      {children}
    </div>
  );
}
