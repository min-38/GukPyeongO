import Link from "next/link";
import { type ReactNode } from "react";

// 편집 페이지 공통 껍데기 (#66). 목록으로 돌아갈 길을 항상 남겨둔다.
export default function ScenarioFormShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="flex-1 px-5 py-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <Link href="/admin?tab=scenarios" className="text-sm text-muted">
          ← 목록
        </Link>
      </div>
      <div className="mt-4">{children}</div>
    </main>
  );
}
