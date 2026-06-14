import { NextResponse } from "next/server";

import { isAdmin } from "@/app/lib/admin-session.server";
import { type Comment } from "@/app/lib/quiz";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

function toComment(row: {
  id: string;
  content: string;
  grade: number;
  created_at: string;
}): Comment {
  return {
    id: row.id,
    content: row.content,
    grade: row.grade,
    createdAt: row.created_at,
  };
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("comments")
    .select("id, content, grade, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    return NextResponse.json(
      { error: "댓글을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
  return NextResponse.json({ comments: (data ?? []).map(toComment) });
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
