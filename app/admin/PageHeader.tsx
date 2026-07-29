import { type ReactNode } from "react";

// 각 탭의 머리 (#99).
// 제목·개수·설명·주요 동작이 탭마다 다른 모양으로 흩어져 있던 것을 한 모양으로 모았다.
// 개수는 제목 옆 작은 숫자로 — 제목만큼 크면 무엇을 보는 화면인지가 흐려진다.
export default function PageHeader({
  title,
  count,
  desc,
  actions,
}: {
  title: string;
  count?: number;
  desc?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
      <div className="min-w-0">
        <h2 className="font-display text-2xl leading-none">
          {title}
          {count !== undefined && (
            <span className="ml-2 text-lg tabular-nums text-muted">
              {count}
            </span>
          )}
        </h2>
        {desc && <p className="mt-2 text-sm text-muted">{desc}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
