import { dbTarget } from "@/app/lib/db-target";

import AdminShell from "./AdminShell";

// 관리자 셸 — 데스크톱 전용(#66). 모바일 대응은 하지 않는다.
// 화면마다 주소가 따로 있고(#99) 왼쪽 판·오늘 스트립은 여기서 한 번만 그린다.
// 로그인 화면은 스스로 껍데기를 갖는다 — AdminShell이 pathname을 보고 비켜준다.
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-[100dvh] w-full max-w-[1600px] flex-col overflow-hidden bg-surface shadow-[0_20px_60px_-20px_rgba(76,29,149,0.35)] sm:min-h-[calc(100dvh-3rem)] sm:rounded-[2rem] sm:border sm:border-border">
      {/* 어느 DB에 붙었는지는 서버만 안다 — 셸로 내려보낸다(#107). */}
      <AdminShell db={dbTarget()}>{children}</AdminShell>
    </div>
  );
}
