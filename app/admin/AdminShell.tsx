"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { type AdminScenario } from "@/app/lib/scenario-admin";

import AdminNav, { type AdminTab } from "./AdminNav";
import TodayStrip from "./TodayStrip";

// 편성실 껍데기 (#99).
// 왼쪽 판과 오늘 스트립은 어느 화면에서나 같은 자리에 있다. 화면은 주소로 갈린다 —
// 탭 상태로만 두면 새로고침할 때마다 대시보드로 돌아온다.

// 주소 → 지금 어느 메뉴에 있는지.
function activeTab(pathname: string): AdminTab {
  const seg = pathname.replace(/^\/admin\/?/, "").split("/")[0];
  return (seg || "dashboard") as AdminTab;
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // 로그인 화면에는 판을 두르지 않는다 — 아직 들어오지 않은 사람이다.
  const bare = pathname === "/admin/login";
  // 오늘 스트립이 편성 점수를 세려면 문제 목록이 필요하다. 화면마다 따로 부르지 않게 여기서 한 번.
  const [scenarios, setScenarios] = useState<AdminScenario[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/scenarios")
      .then((r) => r.json() as Promise<{ scenarios?: AdminScenario[] }>)
      .then((d) => alive && setScenarios(d.scenarios ?? []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  if (bare) return <>{children}</>;

  return (
    <div className="flex flex-1">
      <AdminNav active={activeTab(pathname)} onLogout={logout} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TodayStrip scenarios={scenarios} />
        <main className="min-w-0 flex-1 overflow-x-auto px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
