import { NextResponse } from "next/server";

import { isAdmin } from "@/app/lib/admin-session.server";
import {
  type AdminQuestion,
  type AuditAction,
  type QuestionFormat,
  QUESTION_FORMAT_LABELS,
  type QuestionType,
} from "@/app/lib/quiz";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

type Db = ReturnType<typeof getSupabaseAdmin>;

// 문제 변경 로그 기록 (best-effort — 실패해도 본 작업에는 영향 주지 않음)
async function logAudit(
  supabase: Db,
  action: AuditAction,
  questionId: string,
  snapshot: AdminQuestion | null
) {
  try {
    await supabase
      .from("question_audit")
      .insert({ action, question_id: questionId, snapshot });
  } catch {
    // 로그 실패 무시
  }
}

// 유형(type)은 DB(question_types)에서 관리되며 FK로 검증된다(여기선 비어있지 않은지만 확인).
// 형식(format)은 코드로 정의된다 — 라벨 맵에서 직접 도출.
const FORMATS = Object.keys(QUESTION_FORMAT_LABELS) as QuestionFormat[];
const COLS =
  "id, type, format, prompt, choices, answer_index, answers, time_limit_sec";

interface Row {
  id: string;
  type: string;
  format: string | null;
  prompt: string;
  choices: string[];
  answer_index: number;
  answers: string[] | null;
  time_limit_sec: number;
}

function toAdminQuestion(row: Row): AdminQuestion {
  return {
    id: row.id,
    type: row.type as QuestionType,
    format: (row.format ?? "multiple_choice") as QuestionFormat,
    prompt: row.prompt,
    choices: row.choices,
    answerIndex: row.answer_index,
    answers: row.answers ?? [],
    timeLimitSec: row.time_limit_sec,
  };
}

interface QuestionInput {
  type: QuestionType;
  format: QuestionFormat;
  prompt: string;
  choices: string[];
  answer_index: number;
  answers: string[];
  time_limit_sec: number;
}

// 입력 검증. 유효하면 DB 컬럼 형태를 반환, 아니면 에러 메시지.
function parseInput(body: unknown): QuestionInput | string {
  if (typeof body !== "object" || body === null) return "잘못된 요청입니다.";
  const b = body as Record<string, unknown>;

  if (typeof b.type !== "string" || b.type.trim().length === 0)
    return "유형을 선택해주세요.";
  // format 미지정 시 객관식으로 간주 (하위 호환)
  const format = (b.format ?? "multiple_choice") as QuestionFormat;
  if (!FORMATS.includes(format)) return "문제 형식이 올바르지 않습니다.";
  if (typeof b.prompt !== "string" || b.prompt.trim().length === 0)
    return "문제 내용을 입력해주세요.";

  const timeLimitSec = b.timeLimitSec;
  if (
    typeof timeLimitSec !== "number" ||
    !Number.isInteger(timeLimitSec) ||
    timeLimitSec <= 0
  )
    return "제한시간은 1초 이상이어야 합니다.";

  if (format === "short_answer") {
    if (
      !Array.isArray(b.answers) ||
      b.answers.length < 1 ||
      !b.answers.every((a) => typeof a === "string" && a.trim().length > 0)
    )
      return "허용 정답을 1개 이상, 빈 값 없이 입력해주세요.";
    return {
      type: b.type as QuestionType,
      format,
      prompt: b.prompt.trim(),
      choices: [],
      answer_index: 0,
      answers: (b.answers as string[]).map((a) => a.trim()),
      time_limit_sec: timeLimitSec,
    };
  }

  // multiple_choice
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

  return {
    type: b.type as QuestionType,
    format,
    prompt: b.prompt.trim(),
    choices: (b.choices as string[]).map((c) => c.trim()),
    answer_index: answerIndex,
    answers: [],
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
    .select(COLS)
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
  const parsed = parseInput(body);
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  // id는 DB에서 uuid로 자동 생성된다.
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("questions")
    .insert({ sort_order: 999, ...parsed })
    .select(COLS)
    .single();
  if (error || !data) {
    const msg =
      error?.code === "23503"
        ? "선택한 유형이 존재하지 않습니다."
        : "저장에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const created = toAdminQuestion(data);
  await logAudit(supabase, "create", created.id, created);
  return NextResponse.json({ question: created }, { status: 201 });
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
    .select(COLS)
    .single();
  if (error || !data) {
    const msg =
      error?.code === "23503"
        ? "선택한 유형이 존재하지 않습니다."
        : "수정에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const updated = toAdminQuestion(data);
  await logAudit(supabase, "update", updated.id, updated);
  return NextResponse.json({ question: updated });
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
  // 삭제 전 스냅샷 확보 (로그용)
  const { data: existing } = await supabase
    .from("questions")
    .select(COLS)
    .eq("id", id)
    .single();

  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }

  await logAudit(
    supabase,
    "delete",
    id,
    existing ? toAdminQuestion(existing) : null
  );
  return NextResponse.json({ ok: true });
}
