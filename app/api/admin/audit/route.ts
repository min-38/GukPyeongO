import { NextResponse } from "next/server";

import { isAdmin } from "@/app/lib/admin-session.server";
import { type AdminQuestion, type QuestionAudit } from "@/app/lib/quiz";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

interface Row {
  id: string;
  action: string;
  question_id: string | null;
  snapshot: AdminQuestion | null;
  created_at: string;
}

function toAudit(row: Row): QuestionAudit {
  return {
    id: row.id,
    action:
      row.action === "create" || row.action === "delete"
        ? row.action
        : "update",
    questionId: row.question_id,
    snapshot: row.snapshot,
    createdAt: row.created_at,
  };
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("question_audit")
    .select("id, action, question_id, snapshot, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    return NextResponse.json(
      { error: "로그를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
  return NextResponse.json({
    audits: ((data ?? []) as Row[]).map(toAudit),
  });
}
