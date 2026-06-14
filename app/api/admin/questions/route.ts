import { NextResponse } from "next/server";

import { isAdmin } from "@/app/lib/admin-session.server";
import { type AdminQuestion, type QuestionType } from "@/app/lib/quiz";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

const TYPES: QuestionType[] = ["notice", "hanja", "time", "confusable"];

interface Row {
  id: string;
  type: string;
  prompt: string;
  choices: string[];
  answer_index: number;
  time_limit_sec: number;
}

function toAdminQuestion(row: Row): AdminQuestion {
  return {
    id: row.id,
    type: row.type as QuestionType,
    prompt: row.prompt,
    choices: row.choices,
    answerIndex: row.answer_index,
    timeLimitSec: row.time_limit_sec,
  };
}

interface QuestionInput {
  type: QuestionType;
  prompt: string;
  choices: string[];
  answer_index: number;
  time_limit_sec: number;
}

// 입력 검증. 유효하면 DB 컬럼 형태를 반환, 아니면 에러 메시지.
function parseInput(body: unknown): QuestionInput | string {
  if (typeof body !== "object" || body === null) return "잘못된 요청입니다.";
  const b = body as Record<string, unknown>;

  if (!TYPES.includes(b.type as QuestionType)) return "유형이 올바르지 않습니다.";
  if (typeof b.prompt !== "string" || b.prompt.trim().length === 0)
    return "문제 내용을 입력해주세요.";
  if (
    !Array.isArray(b.choices) ||
    b.choices.length < 2 ||
    !b.choices.every((c) => typeof c === "string" && c.trim().length > 0)
  )
    return "보기는 2개 이상, 빈 값 없이 입력해주세요.";
  const answerIndex = b.answerIndex;
  if (
    typeof answerIndex !== "number" ||
    !Number.isInteger(answerIndex) ||
    answerIndex < 0 ||
    answerIndex >= b.choices.length
  )
    return "정답 번호가 보기 범위를 벗어났습니다.";
  const timeLimitSec = b.timeLimitSec;
  if (
    typeof timeLimitSec !== "number" ||
    !Number.isInteger(timeLimitSec) ||
    timeLimitSec <= 0
  )
    return "제한시간은 1초 이상이어야 합니다.";

  return {
    type: b.type as QuestionType,
    prompt: b.prompt.trim(),
    choices: (b.choices as string[]).map((c) => c.trim()),
    answer_index: answerIndex,
    time_limit_sec: timeLimitSec,
  };
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("questions")
    .select("id, type, prompt, choices, answer_index, time_limit_sec")
    .order("sort_order", { ascending: true });
  if (error) {
    return NextResponse.json(
      { error: "문제를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
  return NextResponse.json({ questions: (data ?? []).map(toAdminQuestion) });
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
  const id = (body as { id?: unknown }).id;
  if (typeof id !== "string" || id.trim().length === 0) {
    return NextResponse.json({ error: "문제 ID를 입력해주세요." }, { status: 400 });
  }
  const parsed = parseInput(body);
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("questions")
    .insert({ id: id.trim(), sort_order: 999, ...parsed })
    .select("id, type, prompt, choices, answer_index, time_limit_sec")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: "이미 존재하는 ID이거나 저장에 실패했습니다." },
      { status: 400 }
    );
  }
  return NextResponse.json({ question: toAdminQuestion(data) }, { status: 201 });
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
  const id = (body as { id?: unknown }).id;
  if (typeof id !== "string" || id.trim().length === 0) {
    return NextResponse.json({ error: "문제 ID가 필요합니다." }, { status: 400 });
  }
  const parsed = parseInput(body);
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("questions")
    .update(parsed)
    .eq("id", id)
    .select("id, type, prompt, choices, answer_index, time_limit_sec")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: "수정에 실패했습니다." },
      { status: 400 }
    );
  }
  return NextResponse.json({ question: toAdminQuestion(data) });
}
