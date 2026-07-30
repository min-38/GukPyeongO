import { NextResponse } from "next/server";

import { isAdmin } from "@/app/lib/admin-session.server";
import {
  MAX_PATCH_CONTENT_LENGTH,
  MAX_PATCH_VERSION_LENGTH,
  type PatchNote,
  type PatchType,
  PATCH_TYPES,
} from "@/app/lib/quiz";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

interface Row {
  id: string;
  version: string;
  type: string;
  content: string;
  patched_at: string;
  created_at: string;
}

const COLS = "id, version, type, content, patched_at, created_at";

function toPatchNote(row: Row): PatchNote {
  return {
    id: row.id,
    version: row.version,
    type: PATCH_TYPES.includes(row.type as PatchType)
      ? (row.type as PatchType)
      : "fix",
    content: row.content,
    patchedAt: row.patched_at,
    createdAt: row.created_at,
  };
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("patch_notes")
    .select(COLS)
    .order("patched_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    return NextResponse.json(
      { error: "패치노트를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
  return NextResponse.json({
    patchNotes: ((data ?? []) as Row[]).map(toPatchNote),
  });
}

interface PatchFields {
  version: string;
  type: string;
  content: string;
  patched_at?: string;
}

// 입력 검증. 유효하면 DB 컬럼 형태를, 아니면 에러 메시지를 돌려준다.
// 작성(POST)과 수정(PATCH)이 같은 규칙을 쓴다.
function parseFields(body: unknown): PatchFields | string {
  const { version, type, content, patchedAt } = (body ?? {}) as {
    version?: unknown;
    type?: unknown;
    content?: unknown;
    patchedAt?: unknown;
  };

  if (typeof version !== "string" || version.trim().length === 0)
    return "버전을 입력해주세요.";
  if (!PATCH_TYPES.includes(type as PatchType)) return "유형을 선택해주세요.";
  if (typeof content !== "string" || content.trim().length === 0)
    return "내용을 입력해주세요.";

  const fields: PatchFields = {
    version: version.trim().slice(0, MAX_PATCH_VERSION_LENGTH),
    type: type as PatchType,
    content: content.trim().slice(0, MAX_PATCH_CONTENT_LENGTH),
  };
  // 패치 일시: 값이 있으면 사용, 없으면 DB default(now)에 맡긴다.
  if (typeof patchedAt === "string" && patchedAt.trim().length > 0) {
    const d = new Date(patchedAt);
    if (Number.isNaN(d.getTime())) return "패치 일시가 올바르지 않습니다.";
    fields.patched_at = d.toISOString();
  }
  return fields;
}

// 패치노트 작성: { version, type, content, patchedAt? }
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const parsed = parseFields(body);
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("patch_notes")
    .insert(parsed)
    .select(COLS)
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: "패치노트 작성에 실패했습니다." },
      { status: 500 }
    );
  }
  return NextResponse.json({ patchNote: toPatchNote(data as Row) }, { status: 201 });
}

// 패치노트 수정: { id, version, type, content, patchedAt? }
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

  const id = (body as { id?: unknown }).id;
  if (typeof id !== "string" || id.trim().length === 0) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  const parsed = parseFields(body);
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("patch_notes")
    .update(parsed)
    .eq("id", id)
    .select(COLS)
    .maybeSingle();
  if (error) {
    return NextResponse.json(
      { error: "패치노트 수정에 실패했습니다." },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: "없는 패치노트입니다." },
      { status: 404 }
    );
  }
  return NextResponse.json({ patchNote: toPatchNote(data as Row) });
}

// 패치노트 삭제: ?id=...
export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("patch_notes").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
