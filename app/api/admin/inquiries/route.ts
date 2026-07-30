import { NextResponse } from "next/server";

import { isAdmin } from "@/app/lib/admin-session.server";
import { type AdminInquiry, type InquiryKind } from "@/app/lib/quiz";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

// 문의함 (신고 화면과 같은 결). 목록을 읽고, 처리 여부만 바꾼다.

interface Row {
  id: string;
  kind: string;
  message: string;
  contact: string | null;
  status: string;
  path: string | null;
  ip_masked: string | null;
  created_at: string;
}

function toAdminInquiry(row: Row): AdminInquiry {
  return {
    id: row.id,
    kind: row.kind as InquiryKind,
    message: row.message,
    contact: row.contact,
    status: row.status === "resolved" ? "resolved" : "open",
    path: row.path,
    ipMasked: row.ip_masked ?? "비공개",
    createdAt: row.created_at,
  };
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const { data, error } = await getSupabaseAdmin()
    .from("inquiries")
    .select("id, kind, message, contact, status, path, ip_masked, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { error: "문의를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
  return NextResponse.json({
    inquiries: ((data ?? []) as Row[]).map(toAdminInquiry),
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

  const { error } = await getSupabaseAdmin()
    .from("inquiries")
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "변경에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
