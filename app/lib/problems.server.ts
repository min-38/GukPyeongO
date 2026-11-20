import "server-only";

import {
  fillBlank,
  LIST_PAGE_SIZE,
  type Level,
  type ListQuery,
  type ListResult,
  type ListStatus,
  type ProblemView,
  type SubmissionRow,
  type SubmitResult,
} from "@/app/lib/problems";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

// 지금 로그인한 사용자. 사용자를 아는 곳은 여기 하나다.
// shortcut: 로그인이 없어 개발 중에만 DEV_USER_ID(개발용 사용자)를 쓴다. 로그인을 붙일 때 Supabase Auth 세션으로 바꾼다.
export function getCurrentUserId(): string | null {
  if (process.env.NODE_ENV !== "development") return null;
  return process.env.DEV_USER_ID || null;
}

// 문제 화면 데이터. 인정 답과 빈칸 글자는 담지 않는다(P-03).
export async function getProblemView(id: number, userId: string | null): Promise<ProblemView | null> {
  const db = getSupabaseAdmin();
  const { data: p, error } = await db
    .from("problems")
    .select("id, title, level, points, prompt, notes, extra, passages(kind, payload)")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!p) return null;

  // shortcut: 공지·신문처럼 문단(body) 지문만 그린다. 메신저·커뮤니티 등은 v1 지문을 옮길 때(GUK-5) 형식별로 더한다.
  const passage = p.passages as unknown as { kind: string; payload: { source?: string; title?: string; body?: string[] } };
  const extra = (p.extra ?? {}) as { blank?: string };

  const view: ProblemView = {
    id: p.id,
    title: p.title,
    level: p.level as Level,
    points: p.points,
    prompt: p.prompt,
    notes: p.notes ?? [],
    passage: {
      kind: passage.kind,
      source: passage.payload.source ?? "",
      title: passage.payload.title ?? "",
      body: fillBlank(passage.payload.body ?? [], extra.blank),
    },
    me: null,
  };
  if (!userId) return view;

  const [solve, last, count, draft] = await Promise.all([
    db.from("solves").select("problem_id").eq("user_id", userId).eq("problem_id", id).maybeSingle(),
    db.from("submissions").select("is_correct").eq("user_id", userId).eq("problem_id", id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("submissions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("problem_id", id),
    db.from("answer_drafts").select("answer").eq("user_id", userId).eq("problem_id", id).maybeSingle(),
  ]);
  for (const r of [solve, last, count, draft]) if (r.error) throw r.error;

  const solved = !!solve.data;
  view.me = {
    solved,
    // 맞힌 문제에 다시 들어오면 '정답'(P-08 결정), 오답만 냈으면 마지막 결과.
    lastResult: solved ? "correct" : last.data ? (last.data.is_correct ? "correct" : "wrong") : null,
    // 맞힌 문제는 답안 칸을 비운다(P-08). 저장된 답안은 정답을 맞힐 때 지워진다.
    draft: solved ? "" : (draft.data?.answer ?? ""),
    submissionCount: count.count ?? 0,
  };
  return view;
}

export async function saveDraft(userId: string, problemId: number, answer: string) {
  const { error } = await getSupabaseAdmin()
    .from("answer_drafts")
    .upsert({ user_id: userId, problem_id: problemId, answer, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export type SubmitOutcome = { status: "ok"; result: SubmitResult } | { status: "not_found" | "too_fast" };

export async function submitAnswer(userId: string, problemId: number, answer: string): Promise<SubmitOutcome> {
  const { data, error } = await getSupabaseAdmin()
    .rpc("submit_answer", { p_user: userId, p_problem: problemId, p_answer: answer })
    .single();
  if (error) throw error;
  const row = data as { status: string; is_correct: boolean; points_awarded: number; total_score: number };
  if (row.status !== "ok") return { status: row.status as "not_found" | "too_fast" };
  return {
    status: "ok",
    result: { isCorrect: row.is_correct, pointsAwarded: row.points_awarded, totalScore: row.total_score },
  };
}

// 내 제출 이력, 최신순(P-09).
export async function listSubmissions(userId: string, problemId: number): Promise<SubmissionRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("submissions")
    .select("answer, is_correct, created_at")
    .eq("user_id", userId)
    .eq("problem_id", problemId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ answer: r.answer, isCorrect: r.is_correct, createdAt: r.created_at }));
}

// 문제 목록 한 페이지와 유형별 탭 수(GUK-9). 페이지가 범위를 넘으면 rows가 비고 total은 0이다.
export async function listProblems(userId: string | null, query: ListQuery): Promise<ListResult> {
  const db = getSupabaseAdmin();
  const [list, counts] = await Promise.all([
    db.rpc("list_problems", {
      p_user: userId,
      p_q: query.q || null,
      p_kind: query.kind,
      p_level: query.level,
      p_unsolved: query.unsolved,
      p_sort: query.sort,
      p_limit: LIST_PAGE_SIZE,
      p_offset: (query.page - 1) * LIST_PAGE_SIZE,
    }),
    db.rpc("problem_kind_counts", { p_user: userId }),
  ]);
  if (list.error) throw list.error;
  if (counts.error) throw counts.error;

  const rows = (list.data ?? []) as {
    id: number; title: string; kind: string; level: number; rate: number | null; status: string; total: number;
  }[];
  return {
    rows: rows.map((r) => ({
      id: r.id, title: r.title, kind: r.kind, level: r.level as Level, rate: r.rate, status: r.status as ListStatus,
    })),
    total: rows.length ? Number(rows[0].total) : 0,
    kindCounts: Object.fromEntries(((counts.data ?? []) as { kind: string; n: number }[]).map((c) => [c.kind, Number(c.n)])),
  };
}
