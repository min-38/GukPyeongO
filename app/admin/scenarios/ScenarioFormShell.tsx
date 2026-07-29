import Link from "next/link";
import { type ReactNode } from "react";

// 편집 페이지 머리 (#66, #99).
// 왼쪽 판과 오늘 스트립은 어드민 레이아웃이 그린다 — 여기서는 제목과 나가는 길만.
export default function ScenarioFormShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
        <h1 className="font-display text-2xl leading-none">{title}</h1>
        <Link
          href="/admin/scenarios"
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          목록으로
        </Link>
      </div>
      {children}
    </>
  );
}
