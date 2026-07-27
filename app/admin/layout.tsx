// 관리자 셸 — 데스크톱 전용(#66). 모바일 대응은 하지 않는다.
// 공개 페이지와 달리 폭을 넓게 써서 목록·편집 화면이 답답하지 않게 한다.
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-[100dvh] w-full max-w-[1600px] flex-col bg-surface shadow-[0_20px_60px_-20px_rgba(76,29,149,0.35)] sm:min-h-[calc(100dvh-3rem)] sm:rounded-[2rem] sm:border sm:border-border">
      {children}
    </div>
  );
}
