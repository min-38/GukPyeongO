import { NextResponse } from "next/server";

import { isAdmin } from "@/app/lib/admin-session.server";
import { type AuditAction } from "@/app/lib/quiz";
import {
  type AdminScenario,
  type AdminScenarioStep,
  SCENARIO_KINDS,
  SCENARIO_STATUSES,
  type ScenarioKind,
  type ScenarioStatus,
} from "@/app/lib/scenario-admin";
import { checkScenarioRules } from "@/app/lib/scenario-rules";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

type Db = ReturnType<typeof getSupabaseAdmin>;

const SCENARIO_COLS =
  "id, slug, kind, source_label, payload, status, sort_order";
const STEP_COLS =
  "id, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, sort_order, attempts, correct_count";

// 시나리오 변경 로그 (best-effort — 실패해도 본 작업에는 영향 주지 않음)
async function logAudit(
  supabase: Db,
  action: AuditAction,
  scenarioId: string,
  snapshot: AdminScenario | null,
) {
  try {
    await supabase
      .from("scenario_audit")
      .insert({ action, scenario_id: scenarioId, snapshot });
  } catch {
    // 로그 실패 무시
  }
}

interface ScenarioRow {
  id: string;
  slug: string;
  kind: string;
  source_label: string;
  payload: Record<string, unknown>;
  status: string;
  sort_order: number;
  scenario_steps?: StepRow[];
}

interface StepRow {
  id: string;
  step_key: string;
  type: string;
  prompt: string;
  choices: string[];
  answer_index: number;
  difficulty: number;
  time_limit_sec: number;
  show_up_to: number | null;
  sort_order: number;
  attempts: number;
  correct_count: number;
}

function toStep(row: StepRow): AdminScenarioStep {
  return {
    id: row.id,
    stepKey: row.step_key,
    type: row.type,
    prompt: row.prompt,
    choices: row.choices,
    answerIndex: row.answer_index,
    difficulty: row.difficulty,
    timeLimitSec: row.time_limit_sec,
    showUpTo: row.show_up_to,
    attempts: row.attempts,
    correctCount: row.correct_count,
  };
}

function toScenario(row: ScenarioRow): AdminScenario {
  const steps = [...(row.scenario_steps ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind as ScenarioKind,
    sourceLabel: row.source_label,
    status: row.status as ScenarioStatus,
    sortOrder: row.sort_order,
    payload: row.payload,
    steps: steps.map(toStep),
  };
}

interface ParsedStep {
  step_key: string;
  type: string;
  prompt: string;
  choices: string[];
  answer_index: number;
  difficulty: number;
  time_limit_sec: number;
  show_up_to: number | null;
  sort_order: number;
}

interface ParsedInput {
  slug: string;
  kind: ScenarioKind;
  source_label: string;
  payload: Record<string, unknown>;
  status: ScenarioStatus;
  sort_order: number;
  steps: ParsedStep[];
}

const SLUG_RE = /^[a-z0-9-]+$/;

// 입력 검증. 유효하면 DB 컬럼 형태를 반환, 아니면 에러 메시지.
// 출제 규칙(문항 수 하한 등) 검증은 #77에서 따로 다룬다.
function parseInput(body: unknown): ParsedInput | string {
  if (typeof body !== "object" || body === null) return "잘못된 요청입니다.";
  const b = body as Record<string, unknown>;

  if (typeof b.slug !== "string" || !SLUG_RE.test(b.slug))
    return "slug는 영소문자·숫자·하이픈만 사용할 수 있습니다.";
  if (!SCENARIO_KINDS.includes(b.kind as ScenarioKind))
    return "유형이 올바르지 않습니다.";
  if (!SCENARIO_STATUSES.includes(b.status as ScenarioStatus))
    return "상태가 올바르지 않습니다.";
  // 표시 라벨의 정본은 payload 안에 있다(화면이 그걸 읽는다).
  // source_label 컬럼은 목록·필터용 사본이라 여기서 payload로부터 파생시킨다.
  const labelSource = b.payload as {
    sourceLabel?: unknown;
    boardName?: unknown;
  };
  const sourceLabel =
    typeof labelSource?.sourceLabel === "string"
      ? labelSource.sourceLabel
      : typeof labelSource?.boardName === "string"
        ? labelSource.boardName
        : "";
  if (
    typeof b.payload !== "object" ||
    b.payload === null ||
    Array.isArray(b.payload)
  )
    return "지문(payload)은 객체여야 합니다.";
  if ((b.payload as Record<string, unknown>).steps !== undefined)
    return "지문에 문항(steps)을 넣을 수 없습니다. 문항은 따로 저장됩니다.";

  const sortOrder = typeof b.sortOrder === "number" ? b.sortOrder : 0;
  if (!Number.isInteger(sortOrder)) return "정렬 순서가 올바르지 않습니다.";

  if (!Array.isArray(b.steps) || b.steps.length === 0)
    return "문항을 1개 이상 추가해주세요.";

  const steps: ParsedStep[] = [];
  const seenKeys = new Set<string>();
  for (const [i, raw] of (b.steps as unknown[]).entries()) {
    const s = raw as Record<string, unknown>;
    const at = `${i + 1}번 문항`;

    if (typeof s.stepKey !== "string" || !SLUG_RE.test(s.stepKey))
      return `${at}: 식별자는 영소문자·숫자·하이픈만 사용할 수 있습니다.`;
    if (seenKeys.has(s.stepKey)) return `${at}: 식별자가 중복됩니다.`;
    seenKeys.add(s.stepKey);

    if (typeof s.type !== "string" || s.type.trim().length === 0)
      return `${at}: 분류를 입력해주세요.`;
    if (typeof s.prompt !== "string" || s.prompt.trim().length === 0)
      return `${at}: 질문을 입력해주세요.`;
    if (
      !Array.isArray(s.choices) ||
      s.choices.length < 2 ||
      !s.choices.every((c) => typeof c === "string" && c.trim().length > 0)
    )
      return `${at}: 보기는 2개 이상, 빈 값 없이 입력해주세요.`;

    const answerIndex = s.answerIndex;
    if (
      typeof answerIndex !== "number" ||
      !Number.isInteger(answerIndex) ||
      answerIndex < 0 ||
      answerIndex >= s.choices.length
    )
      return `${at}: 정답 번호가 보기 범위를 벗어났습니다.`;

    const difficulty = s.difficulty;
    if (
      typeof difficulty !== "number" ||
      !Number.isInteger(difficulty) ||
      difficulty < 1 ||
      difficulty > 3
    )
      return `${at}: 난이도는 1~3 사이여야 합니다.`;

    const timeLimitSec = s.timeLimitSec;
    if (
      typeof timeLimitSec !== "number" ||
      !Number.isInteger(timeLimitSec) ||
      timeLimitSec <= 0
    )
      return `${at}: 제한시간은 1초 이상이어야 합니다.`;

    const showUpTo = s.showUpTo;
    if (
      showUpTo !== null &&
      showUpTo !== undefined &&
      (typeof showUpTo !== "number" ||
        !Number.isInteger(showUpTo) ||
        showUpTo < 1)
    )
      return `${at}: 공개 범위는 1 이상의 정수여야 합니다.`;

    steps.push({
      step_key: s.stepKey,
      type: s.type.trim(),
      prompt: s.prompt.trim(),
      choices: (s.choices as string[]).map((c) => c.trim()),
      answer_index: answerIndex,
      difficulty,
      time_limit_sec: timeLimitSec,
      show_up_to: typeof showUpTo === "number" ? showUpTo : null,
      sort_order: i + 1,
    });
  }

  return {
    slug: b.slug,
    kind: b.kind as ScenarioKind,
    source_label: sourceLabel.trim(),
    payload: b.payload as Record<string, unknown>,
    status: b.status as ScenarioStatus,
    sort_order: sortOrder,
    steps,
  };
}

// 출제 규칙 검사(#76). 구조 검증(parseInput)을 통과한 뒤 유형별 규칙을 본다.
function runRules(parsed: ParsedInput) {
  return checkScenarioRules(
    parsed.kind,
    parsed.payload,
    parsed.steps.map((s) => ({
      prompt: s.prompt,
      choices: s.choices,
      showUpTo: s.show_up_to,
    })),
  );
}

// 문항을 step_key 기준으로 맞춘다. 전부 지우고 다시 넣으면 문항별 통계
// (attempts/correct_count)가 사라지므로, 남는 문항은 update로 살린다.
async function syncSteps(
  supabase: Db,
  scenarioId: string,
  steps: ParsedStep[],
): Promise<string | null> {
  const { error: upsertError } = await supabase.from("scenario_steps").upsert(
    steps.map((s) => ({ ...s, scenario_id: scenarioId })),
    { onConflict: "scenario_id,step_key" },
  );
  if (upsertError) return "문항 저장에 실패했습니다.";

  // 이번 저장에서 빠진 문항은 삭제 (통계도 함께 사라진다)
  const keys = steps.map((s) => s.step_key);
  const { error: deleteError } = await supabase
    .from("scenario_steps")
    .delete()
    .eq("scenario_id", scenarioId)
    .not("step_key", "in", `(${keys.map((k) => `"${k}"`).join(",")})`);
  if (deleteError) return "문항 정리에 실패했습니다.";

  return null;
}

async function fetchOne(
  supabase: Db,
  id: string,
): Promise<AdminScenario | null> {
  const { data } = await supabase
    .from("scenarios")
    .select(`${SCENARIO_COLS}, scenario_steps(${STEP_COLS})`)
    .eq("id", id)
    .single();
  return data ? toScenario(data as ScenarioRow) : null;
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("scenarios")
    .select(`${SCENARIO_COLS}, scenario_steps(${STEP_COLS})`)
    .order("sort_order", { ascending: true });
  if (error) {
    return NextResponse.json(
      { error: "시나리오를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
  return NextResponse.json({
    scenarios: (data ?? []).map((row) => toScenario(row as ScenarioRow)),
  });
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

  const { errors, warnings } = runRules(parsed);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("\n") }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { steps, ...scenario } = parsed;
  const { data, error } = await supabase
    .from("scenarios")
    .insert(scenario)
    .select("id")
    .single();
  if (error || !data) {
    const msg =
      error?.code === "23505"
        ? "이미 같은 slug의 시나리오가 있습니다."
        : "저장에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const stepError = await syncSteps(supabase, data.id, steps);
  if (stepError) {
    // 문항 없이 지문만 남는 상태를 피한다
    await supabase.from("scenarios").delete().eq("id", data.id);
    return NextResponse.json({ error: stepError }, { status: 400 });
  }

  const created = await fetchOne(supabase, data.id);
  if (created) await logAudit(supabase, "create", created.id, created);
  return NextResponse.json({ scenario: created, warnings }, { status: 201 });
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
    return NextResponse.json(
      { error: "시나리오 ID가 필요합니다." },
      { status: 400 },
    );
  }
  const parsed = parseInput(body);
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  const { errors, warnings } = runRules(parsed);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("\n") }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { steps, ...scenario } = parsed;
  const { error } = await supabase
    .from("scenarios")
    .update({ ...scenario, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    const msg =
      error.code === "23505"
        ? "이미 같은 slug의 시나리오가 있습니다."
        : "수정에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const stepError = await syncSteps(supabase, id, steps);
  if (stepError) {
    return NextResponse.json({ error: stepError }, { status: 400 });
  }

  const updated = await fetchOne(supabase, id);
  if (!updated) {
    return NextResponse.json(
      { error: "수정에 실패했습니다." },
      { status: 400 },
    );
  }
  await logAudit(supabase, "update", updated.id, updated);
  return NextResponse.json({ scenario: updated, warnings });
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
  // 삭제 전 스냅샷 확보 (로그용). 문항은 FK cascade로 함께 지워진다.
  const existing = await fetchOne(supabase, id);

  const { error } = await supabase.from("scenarios").delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: "삭제에 실패했습니다." },
      { status: 500 },
    );
  }

  await logAudit(supabase, "delete", id, existing);
  return NextResponse.json({ ok: true });
}
