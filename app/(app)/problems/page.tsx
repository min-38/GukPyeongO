import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  hasListParams,
  LIST_FILTER_COOKIE,
  listHref,
  parseListQuery,
} from "@/app/lib/problems";
import { getCurrentUserId, listProblems } from "@/app/lib/problems.server";

import ProblemList from "./ProblemList";

// v2 문제 목록 (GUK-9). 개발 중에만 열린다(proxy.ts).
export const dynamic = "force-dynamic";

export const metadata = { title: "문제 목록", robots: { index: false } };

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // 조건 없이 들어오면 이 브라우저에 저장된 정렬과 필터로 연다(L-09).
  if (!hasListParams(params)) {
    const saved = (await cookies()).get(LIST_FILTER_COOKIE)?.value;
    if (saved) {
      const href = listHref(parseListQuery(Object.fromEntries(new URLSearchParams(saved))).query);
      if (href !== "/problems") redirect(href);
    }
  }

  // 잘못된 값만 기본값으로 바꾼 주소로 보낸다.
  const { query, invalid } = parseListQuery(params);
  if (invalid) redirect(listHref(query));

  const result = await listProblems(await getCurrentUserId(), query);
  // 페이지가 범위를 넘으면 1페이지로.
  if (result.rows.length === 0 && query.page > 1) redirect(listHref({ ...query, page: 1 }));

  return <ProblemList key={listHref(query)} query={query} result={result} />;
}
