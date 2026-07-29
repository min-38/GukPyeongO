"use client";

import Link from "next/link";

// 편성실 왼쪽 판 (#99).
// 화면마다 주소가 따로 있고, 지금 어디에 있는지는 주소로 정해진다(#99).
// 문제를 고치는 중에도 어디에 있는지가 같은 자리에 보여야 한다.

export type AdminTab =
  | "dashboard"
  | "scenarios"
  | "kinds"
  | "schedule"
  | "reports"
  | "feedback"
  | "comments"
  | "audit"
  | "patch";

export interface NavCounts {
  scenarios?: number;
  reports?: number;
  feedback?: number;
  comments?: number;
  audit?: number;
  patch?: number;
}

// 하는 일 순서대로 묶는다 — 만들고(문제·유형), 내보내고(편성),
// 받은 것을 읽고(항의·댓글), 지나간 것을 본다(로그·패치노트).
const GROUPS: {
  group: string;
  items: { id: AdminTab; label: string; alert?: boolean }[];
}[] = [
  { group: "살피기", items: [{ id: "dashboard", label: "대시보드" }] },
  {
    group: "만들기",
    items: [
      { id: "scenarios", label: "문제" },
      { id: "kinds", label: "유형" },
    ],
  },
  { group: "내보내기", items: [{ id: "schedule", label: "편성" }] },
  {
    group: "받은 것",
    items: [
      { id: "feedback", label: "항의·평가", alert: true },
      { id: "reports", label: "신고", alert: true },
      { id: "comments", label: "댓글" },
    ],
  },
  {
    group: "지나간 것",
    items: [
      { id: "audit", label: "로그" },
      { id: "patch", label: "패치노트" },
    ],
  },
];

export default function AdminNav({
  active,
  counts = {},
  onLogout,
}: {
  active: AdminTab;
  counts?: NavCounts;
  onLogout?: () => void;
}) {
  return (
    <aside className="sticky top-0 flex h-[100dvh] w-56 shrink-0 flex-col gap-5 overflow-y-auto bg-foreground px-4 py-6 text-surface sm:rounded-l-[2rem]">
      <div className="px-2">
        <p className="font-display text-xl leading-none">편성실</p>
        <p className="mt-1 text-[11px] tracking-[0.14em] text-surface/50">
          국평오 운영
        </p>
      </div>

      <nav className="flex flex-col gap-4">
        {GROUPS.map((section) => (
          <div key={section.group}>
            <p className="px-3 pb-1.5 text-[11px] font-bold tracking-[0.14em] text-surface/40">
              {section.group}
            </p>
            {section.items.map((n) => {
              const count = counts[n.id as keyof NavCounts] ?? 0;
              const cls = `flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                active === n.id
                  ? "bg-surface text-foreground"
                  : "text-surface/70 hover:bg-surface/10"
              }`;
              const badge = count > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] tabular-nums ${
                    n.alert
                      ? "bg-red-500 text-white"
                      : active === n.id
                        ? "bg-surface-muted text-muted"
                        : "bg-surface/10 text-surface/60"
                  }`}
                >
                  {count}
                </span>
              );

              return (
                <Link
                  key={n.id}
                  href={n.id === "dashboard" ? "/admin" : `/admin/${n.id}`}
                  className={cls}
                >
                  {n.label}
                  {badge}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {onLogout && (
        <button
          onClick={onLogout}
          className="mt-auto rounded-xl px-3 py-2 text-left text-sm font-medium text-surface/60 hover:bg-surface/10"
        >
          로그아웃
        </button>
      )}
    </aside>
  );
}
