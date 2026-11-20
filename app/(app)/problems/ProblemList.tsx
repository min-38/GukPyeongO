"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  FROM_LIST_KEY,
  LEVEL_CLASS,
  LIST_FILTER_COOKIE,
  LIST_PAGE_SIZE,
  LIST_SORTS,
  listHref,
  MAX_QUERY_LENGTH,
  pageItems,
  savedFilters,
  type Level,
  type ListQuery,
  type ListResult,
  type ListSort,
  type ListStatus,
} from "@/app/lib/problems";
import { SCENARIO_KIND_LABELS, type ScenarioKind } from "@/app/lib/scenario-admin";

// 시안: 문제 목록 웹 시안(claude.ai Design 캔버스, GUK-8). 상태 4개(기본, 불러오는 중, 검색 결과 없음, 남은 문제 없음).
const KINDS = Object.keys(SCENARIO_KIND_LABELS) as ScenarioKind[];
const COLS = "grid-cols-[72px_minmax(0,1fr)_128px_96px_88px_120px]";

const icon = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  check: <path d="M5 12l5 5 9-10" />,
  pencil: <path d="M4 20h4l10-10-4-4L4 16v4z" />,
  empty: (
    <>
      <path d="M3 13l2.5-8h13L21 13v6H3z" />
      <path d="M3 13h5l1.5 3h5l1.5-3h5" />
    </>
  ),
};

function Icon({ name, size = 14, stroke = 2.4 }: { name: keyof typeof icon; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icon[name]}
    </svg>
  );
}

// 상태는 색, 글자, 기호를 함께 쓴다(L-06).
function StatusBadge({ status }: { status: ListStatus }) {
  const base = "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[13px]";
  if (status === "done")
    return (
      <span className={`${base} border-green-200 bg-green-50 font-bold text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400`}>
        <Icon name="check" stroke={3} />완료
      </span>
    );
  if (status === "doing")
    return (
      <span className={`${base} border-brand/20 bg-brand/10 font-bold text-brand-strong`}>
        <Icon name="pencil" />푸는 중
      </span>
    );
  return <span className={`${base} border-border font-medium text-muted`}>안 품</span>;
}

// 정렬과 필터를 이 브라우저에 저장한다(L-09). 검색어와 페이지는 빼고 저장한다.
function saveFilters(query: ListQuery) {
  try {
    document.cookie = `${LIST_FILTER_COOKIE}=${encodeURIComponent(savedFilters(query))}; path=/problems; max-age=31536000; samesite=lax`;
  } catch {}
}

function rememberFromList(id: number) {
  try {
    sessionStorage.setItem(FROM_LIST_KEY, String(id));
  } catch {}
}

const tabBase = "h-11 rounded-full border px-[18px] text-[15px]";
const selectClass = "h-11 rounded-xl border border-[#8e88ad] bg-surface px-3 text-sm focus:border-brand focus:outline-none dark:border-border";

export default function ProblemList({ query, result }: { query: ListQuery; result: ListResult }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(query.q);

  // 검색하거나 정렬, 필터를 바꾸면 1페이지부터 다시 보인다(L-08). 조건은 주소에 남는다(L-09).
  const go = (next: Partial<ListQuery>, scroll = false) => {
    const merged = { ...query, page: 1, ...next };
    saveFilters(merged);
    startTransition(() => router.push(listHref(merged), { scroll }));
  };

  const allCount = Object.values(result.kindCounts).reduce((a, b) => a + b, 0);
  const tabs: { kind: ScenarioKind | null; label: string; n: number }[] = [
    { kind: null, label: "전체", n: allCount },
    ...KINDS.map((k) => ({ kind: k, label: SCENARIO_KIND_LABELS[k], n: result.kindCounts[k] ?? 0 })),
  ];
  const pages = Math.ceil(result.total / LIST_PAGE_SIZE);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-8">
      <h1 className="sr-only">문제 목록</h1>

      <section aria-label="검색과 유형" className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
        <form
          role="search"
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: q.trim() });
          }}
        >
          <label htmlFor="problem-search" className="sr-only">문제 제목 검색</label>
          <input
            id="problem-search"
            type="search"
            value={q}
            maxLength={MAX_QUERY_LENGTH}
            onChange={(e) => setQ(e.target.value)}
            placeholder="검색할 문제의 제목을 입력해 주세요."
            className="h-13 w-full rounded-full border border-[#8e88ad] bg-surface pr-15 pl-6 text-base placeholder:text-muted focus:border-brand focus:outline-none dark:border-border"
          />
          <button
            type="submit"
            aria-label="검색"
            className="absolute top-1 right-1 flex size-11 items-center justify-center rounded-full bg-brand text-brand-foreground hover:bg-brand-strong"
          >
            <Icon name="search" size={20} stroke={2.2} />
          </button>
        </form>
        <div role="group" aria-label="유형" className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const on = t.kind === query.kind;
            return (
              <button
                key={t.label}
                type="button"
                aria-pressed={on}
                onClick={() => go({ kind: t.kind })}
                className={
                  on
                    ? `${tabBase} border-brand bg-brand font-bold text-brand-foreground`
                    : `${tabBase} border-transparent bg-brand/10 font-medium text-brand-strong hover:bg-brand/15`
                }
              >
                {t.label}({t.n})
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {pending ? (
          <span aria-hidden="true" className="h-5 w-28 animate-pulse rounded-lg bg-border motion-reduce:animate-none" />
        ) : (
          <p className="text-base font-bold">
            총 <span className="text-brand-strong">{result.total}</span> 문제
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={query.unsolved}
              onChange={(e) => go({ unsolved: e.target.checked })}
              className="size-[18px] accent-brand"
            />
            안 푼 문제만 보기
          </label>
          <label htmlFor="problem-level" className="sr-only">Level</label>
          <select
            id="problem-level"
            value={query.level ?? ""}
            onChange={(e) => go({ level: e.target.value ? (Number(e.target.value) as Level) : null })}
            className={selectClass}
          >
            <option value="">Level 전체</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
          </select>
          <label htmlFor="problem-sort" className="sr-only">정렬</label>
          <select
            id="problem-sort"
            value={query.sort}
            onChange={(e) => go({ sort: e.target.value as ListSort })}
            className={selectClass}
          >
            {(Object.keys(LIST_SORTS) as ListSort[]).map((s) => (
              <option key={s} value={s}>{LIST_SORTS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div aria-busy={pending} className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <div role="table" aria-label="문제 목록" className="min-w-[760px]">
          <div role="row" className={`grid ${COLS} border-b border-border text-xs font-medium text-muted`}>
            {["ID", "제목", "유형", "레벨", "정답률", "상태"].map((h) => (
              <span key={h} role="columnheader" className="px-5 py-3.5">{h}</span>
            ))}
          </div>

          {pending ? (
            <div aria-hidden="true">
              <p className="sr-only">문제를 불러오는 중입니다.</p>
              {["42%", "30%", "36%", "48%", "28%", "40%", "33%", "45%", "26%", "38%"].map((w, i) => (
                <div key={i} className={`grid ${COLS} h-[57px] items-center border-b border-border last:border-b-0`}>
                  <span className="px-5"><span className="block h-3.5 w-8 rounded-md bg-surface-muted" /></span>
                  <span className="px-5"><span className="block h-4 rounded-md bg-border" style={{ width: w }} /></span>
                  <span className="px-5"><span className="block h-6 w-14 rounded-full bg-brand/10" /></span>
                  <span className="px-5"><span className="block h-3.5 w-13 rounded-md bg-surface-muted" /></span>
                  <span className="px-5"><span className="block h-3.5 w-9 rounded-md bg-surface-muted" /></span>
                  <span className="px-5"><span className="block h-7 w-16 rounded-full bg-surface-muted" /></span>
                </div>
              ))}
            </div>
          ) : result.rows.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-6 py-24 text-center">
              {query.q ? (
                <>
                  <span className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Icon name="search" size={26} stroke={2.2} />
                  </span>
                  <p className="text-base">
                    검색하신 ‘<strong className="font-bold text-brand-strong">{query.q}</strong>’에 대한 결과가 없습니다.
                  </p>
                </>
              ) : (
                <>
                  <span className="flex size-14 items-center justify-center rounded-full bg-surface-muted text-[#8e88ad]">
                    <Icon name="empty" size={26} stroke={2} />
                  </span>
                  <p className="text-base">남아 있는 문제가 없습니다.</p>
                </>
              )}
            </div>
          ) : (
            result.rows.map((r) => (
              <div key={r.id} role="row" className={`grid ${COLS} items-center border-b border-border text-sm last:border-b-0`}>
                <span role="cell" className="px-5 py-4 text-muted tabular-nums">{r.id}</span>
                <span role="cell" className="min-w-0 px-5 py-4">
                  <Link
                    href={`/problems/${r.id}`}
                    onClick={() => rememberFromList(r.id)}
                    className="text-base font-medium break-keep hover:text-brand-strong"
                  >
                    {r.title}
                  </Link>
                </span>
                <span role="cell" className="px-5 py-4">
                  <span className="inline-flex h-6 items-center rounded-full bg-brand/10 px-2.5 text-xs font-bold text-brand">
                    {SCENARIO_KIND_LABELS[r.kind as ScenarioKind] ?? r.kind}
                  </span>
                </span>
                <span role="cell" className={`px-5 py-4 font-bold ${LEVEL_CLASS[r.level]}`}>Level {r.level}</span>
                <span role="cell" className={`px-5 py-4 tabular-nums ${r.rate === null ? "text-muted" : ""}`}>
                  {r.rate === null ? "-" : `${r.rate}%`}
                </span>
                <span role="cell" className="px-5 py-4"><StatusBadge status={r.status} /></span>
              </div>
            ))
          )}
        </div>
      </div>

      {!pending && pages > 1 && (
        <nav aria-label="페이지" className="flex justify-center gap-1 text-[15px]">
          {pageItems(query.page, pages).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="flex h-11 min-w-11 items-center justify-center text-muted">…</span>
            ) : (
              <a
                key={p}
                href={listHref({ ...query, page: p })}
                aria-current={p === query.page ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go({ page: p }, true);
                }}
                className={
                  p === query.page
                    ? "flex h-11 min-w-11 items-center justify-center rounded-xl bg-brand font-bold text-brand-foreground"
                    : "flex h-11 min-w-11 items-center justify-center rounded-xl hover:bg-brand/10"
                }
              >
                {p}
              </a>
            ),
          )}
        </nav>
      )}
    </main>
  );
}
