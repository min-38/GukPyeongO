// 관리자 셸 — 서비스형 대시보드 폭(공개 페이지보다 넓은 max-w-6xl 카드)
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-[100dvh] w-full max-w-6xl flex-col bg-surface shadow-[0_20px_60px_-20px_rgba(76,29,149,0.35)] sm:min-h-[calc(100dvh-3rem)] sm:rounded-[2rem] sm:border sm:border-border">
      {children}
    </div>
  );
}
