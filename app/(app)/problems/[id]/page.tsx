import { notFound } from "next/navigation";

import { getCurrentUserId, getProblemView } from "@/app/lib/problems.server";

import ProblemScreen from "./ProblemScreen";

// v2 문제 풀이 화면 (GUK-3). 개발 중에만 열린다(proxy.ts).
export const dynamic = "force-dynamic";

export const metadata = { title: "문제 풀이", robots: { index: false } };

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  // 없는 문제이거나 내린 문제는 404(문제 풀이 명세서 예외 처리).
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const view = await getProblemView(id, getCurrentUserId());
  if (!view) notFound();

  return <ProblemScreen view={view} />;
}
