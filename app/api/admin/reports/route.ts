import { NextResponse } from "next/server";

import { isAdmin } from "@/app/lib/admin-session.server";
import { type AdminReport } from "@/app/lib/quiz";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

interface Row {
  id: string;
  question_id: string;
  reason: string;
  detail: string | null;
  status: string;
  created_at: string;
  questions: { prompt: string } | null;
}

function toAdminReport(row: Row): AdminReport {
  return {
    id: row.id,
    questionId: row.question_id,
    reason: row.reason,
    detail: row.detail,
    status: row.status === "resolved" ? "resolved" : "open",
    createdAt: row.created_at,
    questionPrompt: row.questions?.prompt ?? "(삭제된 문제)",
  };
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reports")
    .select("id, question_id, reason, detail, status, created_at, questions(prompt)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    return NextResponse.json(
      { error: "신고를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
  return NextResponse.json({
    reports: ((data ?? []) as unknown as Row[]).map(toAdminReport),
  });
}

// 처리 상태 변경: { id, status: 'open' | 'resolved' }
export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const { id, status } = (body ?? {}) as { id?: unknown; status?: unknown };
  if (typeof id !== "string" || id.trim().length === 0) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }
  if (status !== "open" && status !== "resolved") {
    return NextResponse.json({ error: "잘못된 상태입니다." }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: "변경에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
