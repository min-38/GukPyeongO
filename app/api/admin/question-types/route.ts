import { NextResponse } from "next/server";

import { isAdmin } from "@/app/lib/admin-session.server";
import type { QuestionTypeDef } from "@/app/lib/quiz";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

const COLS = "key, label, emoji, sort_order";

interface Row {
  key: string;
  label: string;
  emoji: string | null;
  sort_order: number;
}

function toDef(row: Row): QuestionTypeDef {
  return {
    key: row.key,
    label: row.label,
    emoji: row.emoji ?? "",
    sortOrder: row.sort_order,
  };
}

// key: 소문자/숫자/언더스코어만 (questions.type에 저장되는 식별자)
const KEY_RE = /^[a-z0-9_]+$/;

interface TypeInput {
  label: string;
  emoji: string;
  sort_order: number;
}

function parseBody(body: unknown): TypeInput | string {
  if (typeof body !== "object" || body === null) return "잘못된 요청입니다.";
  const b = body as Record<string, unknown>;
  if (typeof b.label !== "string" || b.label.trim().length === 0)
    return "유형 이름을 입력해주세요.";
  const emoji = typeof b.emoji === "string" ? b.emoji.trim() : "";
  const sortOrder = b.sortOrder;
  if (
    typeof sortOrder !== "number" ||
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  )
    return "정렬 순서는 0 이상의 정수여야 합니다.";
  return { label: b.label.trim(), emoji, sort_order: sortOrder };
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("question_types")
    .select(COLS)
    .order("sort_order", { ascending: true });
  if (error) {
    return NextResponse.json(
      { error: "유형을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
  return NextResponse.json({ types: (data ?? []).map(toDef) });
}

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
  const key = (body as { key?: unknown }).key;
  if (typeof key !== "string" || !KEY_RE.test(key)) {
    return NextResponse.json(
      { error: "유형 키는 영문 소문자·숫자·_ 만 사용할 수 있습니다." },
      { status: 400 }
    );
  }
  const parsed = parseBody(body);
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("question_types")
    .insert({ key, ...parsed })
    .select(COLS)
    .single();
  if (error || !data) {
    // 23505 = unique_violation (중복 key)
    const msg =
      error?.code === "23505"
        ? "이미 존재하는 유형 키입니다."
        : "저장에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ type: toDef(data) }, { status: 201 });
}

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
  const key = (body as { key?: unknown }).key;
  if (typeof key !== "string" || key.trim().length === 0) {
    return NextResponse.json({ error: "유형 키가 필요합니다." }, { status: 400 });
  }
  const parsed = parseBody(body);
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("question_types")
    .update(parsed)
    .eq("key", key)
    .select(COLS)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 400 });
  }
  return NextResponse.json({ type: toDef(data) });
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const key = new URL(request.url).searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key가 필요합니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("question_types")
    .delete()
    .eq("key", key);
  if (error) {
    // 23503 = foreign_key_violation (해당 유형을 쓰는 문제가 존재)
    const msg =
      error.code === "23503"
        ? "이 유형을 사용하는 문제가 있어 삭제할 수 없습니다. 먼저 문제의 유형을 변경하세요."
        : "삭제에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
