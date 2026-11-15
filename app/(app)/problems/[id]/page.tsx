import { notFound } from "next/navigation";

import { getCurrentUserId, getProblemView } from "@/app/lib/problems.server";

import ProblemScreen from "./ProblemScreen";

// v2 문제 풀이 화면 (GUK-3). 개발 중에만 열린다(proxy.ts).
export const dynamic = "force-dynamic";

export const metadata = { title: "문제 풀이", robots: { index: false } };

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  // shortcut: 명세서는 없는 문제면 문제 목록으로 보내라고 하지만 목록이 아직 없어 404로 둔다. 목록이 생기면 그리로 보낸다.
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const view = await getProblemView(id, getCurrentUserId());
  if (!view) notFound();

  return <ProblemScreen view={view} />;
}
