import { NextResponse } from "next/server";

import { isAdmin } from "@/app/lib/admin-session.server";
import { type AuditAction } from "@/app/lib/quiz";
import {
  type AdminScenario,
  SCENARIO_KINDS,
  SCENARIO_STATUSES,
  type ScenarioKind,
  type ScenarioStatus,
} from "@/app/lib/scenario-admin";
import { checkScenarioRules } from "@/app/lib/scenario-rules";
import { ROUND_MAX_SCORE, stepPoints } from "@/app/lib/scenario-points";
import {
  fetchScenario,
  fetchScenarios,
} from "@/app/lib/scenarios-admin.server";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

type Db = ReturnType<typeof getSupabaseAdmin>;

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

interface ParsedStep {
  step_key: string;
  type: string;
  prompt: string;
  choices: string[];
  answer_index: number;
  difficulty: number;
  points: number;
  time_limit_sec: number;
  show_up_to: number | null;
  extra: Record<string, unknown>;
  sort_order: number;
}

interface ParsedInput {
  slug: string;
  kind: ScenarioKind;
  title: string;
  source_label: string;
  payload: Record<string, unknown>;
  status: ScenarioStatus;
  sort_order: number;
  steps: ParsedStep[];
}

const SLUG_RE = /^[a-z0-9-]+$/;

// 메신저 문항의 추가 필드. 대화(context)와 답변 후 반응은 문항이 각자 들고 간다.
// 유효하면 저장할 객체를, 아니면 에러 메시지를 돌려준다.
function parseChatExtra(raw: unknown, at: string) {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw))
    return `${at}: 메신저 문항 정보가 없습니다.`;
  const s = raw as Record<string, unknown>;

  const context = s.context;
  if (!Array.isArray(context) || context.length === 0)
    return `${at}: 맥락 대사를 1개 이상 입력해주세요.`;
  for (const raw of context) {
    const m = raw as Record<string, unknown>;
    if (
      typeof m?.speaker !== "string" ||
      m.speaker.trim().length === 0 ||
      typeof m?.text !== "string" ||
      m.text.trim().length === 0
    )
      return `${at}: 맥락 대사의 화자와 내용을 모두 입력해주세요.`;
  }

  const reactions = ["reactCorrect", "reactWrong", "reactTimeout"] as const;
  for (const key of reactions) {
    const v = s[key];
    if (typeof v !== "string" || v.trim().length === 0)
      return `${at}: 반응 대사(${key})를 입력해주세요.`;
  }

  // 보낸 시각(#94)은 선택. 빈 값이면 아예 넣지 않아 화면이 자리를 비운다.
  const time = (v: unknown) =>
    typeof v === "string" && v.trim().length > 0 ? { at: v.trim() } : {};
  // 빈 값이면 키 자체를 넣지 않는다 — 화면이 기본값으로 되돌아간다.
  const text = (v: unknown, key: string) =>
    typeof v === "string" && v.trim().length > 0 ? { [key]: v.trim() } : {};

  return {
    context: (
      context as {
        speaker: string;
        text: string;
        at?: unknown;
        mine?: unknown;
      }[]
    ).map((m) => ({
      speaker: m.speaker.trim(),
      text: m.text.trim(),
      ...time(m.at),
      // 내가 이미 한 말이면 오른쪽 말풍선으로 나간다(#99).
      ...(m.mine === true ? { mine: true } : {}),
    })),
    reactCorrect: (s.reactCorrect as string).trim(),
    reactWrong: (s.reactWrong as string).trim(),
    reactTimeout: (s.reactTimeout as string).trim(),
    // 반응 화자는 선택. 비우면 지문의 상대 화자가 말한다.
    ...text(s.reactCorrectSpeaker, "reactCorrectSpeaker"),
    ...text(s.reactWrongSpeaker, "reactWrongSpeaker"),
    ...text(s.reactTimeoutSpeaker, "reactTimeoutSpeaker"),
    ...time(s.at),
    // 대화가 며칠에 걸칠 때 날이 바뀌는 문항에만 적는다(#99).
    ...text(s.date, "date"),
  };
}

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
  // 목록에서 문제를 알아볼 이름(#92). 없으면 편성 화면이 다시 라벨만 남는다.
  if (typeof b.title !== "string" || b.title.trim().length === 0)
    return "문제 제목을 입력해주세요.";
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

    // 배점은 문항이 직접 갖는다(#99). 하루 만점 100점을 이 값들로 맞춘다.
    const points = s.points;
    if (
      typeof points !== "number" ||
      !Number.isInteger(points) ||
      points < 1 ||
      points > 100
    )
      return `${at}: 배점은 1~100 사이의 정수여야 합니다.`;

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

    let extra: Record<string, unknown> = {};
    if (b.kind === "chat") {
      const parsedExtra = parseChatExtra(s.extra, at);
      if (typeof parsedExtra === "string") return parsedExtra;
      extra = parsedExtra;
    }
    if (b.kind === "word") {
      // 어휘는 묻는 낱말이 지문 자리에 크게 뜬다(#101) — 질문(prompt)과 따로 받는다.
      const word = (s.extra as { word?: unknown } | undefined)?.word;
      if (typeof word !== "string" || word.trim().length === 0)
        return `${at}: 낱말을 입력해주세요.`;
      extra = { word: word.trim() };
    }

    steps.push({
      step_key: s.stepKey,
      type: s.type.trim(),
      prompt: s.prompt.trim(),
      choices: (s.choices as string[]).map((c) => c.trim()),
      answer_index: answerIndex,
      difficulty,
      points,
      time_limit_sec: timeLimitSec,
      show_up_to: typeof showUpTo === "number" ? showUpTo : null,
      extra,
      sort_order: i + 1,
    });
  }

  return {
    slug: b.slug,
    kind: b.kind as ScenarioKind,
    title: b.title.trim(),
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

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const scenarios = await fetchScenarios();
  if (!scenarios) {
    return NextResponse.json(
      { error: "시나리오를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
  return NextResponse.json({ scenarios });
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
        ? `식별자 '${parsed.slug}'는 이미 다른 문제가 쓰고 있습니다.`
        : "저장에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const stepError = await syncSteps(supabase, data.id, steps);
  if (stepError) {
    // 문항 없이 지문만 남는 상태를 피한다
    await supabase.from("scenarios").delete().eq("id", data.id);
    return NextResponse.json({ error: stepError }, { status: 400 });
  }

  const created = await fetchScenario(data.id);
  if (created) await logAudit(supabase, "create", created.id, created);
  return NextResponse.json({ scenario: created, warnings }, { status: 201 });
}

// 회차 만점 100점은 편성 저장(/api/admin/schedule)에서만 검사해 왔다.
// 그래서 이미 편성된 시나리오의 배점을 여기서 고치면 검사를 지나쳐, 회차 만점이
// 조용히 100이 아니게 된다 — 등급컷(GRADE_CUTS)이 100점 만점을 전제하므로 등급의 뜻이 달라진다.
//
// 이미 시작한 회차는 지금 이 순간 누군가 그 배점으로 채점받고 있으므로 막는다.
// 아직 시작하지 않은 회차는 열리기 전에 고치면 되니 경고만 남긴다 —
// 배점을 여러 시나리오에 나눠 옮기는 중이라면 중간에 100이 아닌 때가 있을 수밖에 없다.
async function checkRoundTotals(
  supabase: Db,
  scenarioId: string,
  steps: { difficulty: number; points: number }[],
): Promise<{ blocked: string | null; warnings: string[] }> {
  const warnings: string[] = [];

  const { data: memberships } = await supabase
    .from("round_scenarios")
    .select("round_id")
    .eq("scenario_id", scenarioId);
  const roundIds = [...new Set((memberships ?? []).map((r) => r.round_id as string))];
  if (roundIds.length === 0) return { blocked: null, warnings };

  const [{ data: rounds }, { data: picks }] = await Promise.all([
    supabase.from("rounds").select("id, starts_at").in("id", roundIds),
    supabase.from("round_scenarios").select("round_id, scenario_id").in("round_id", roundIds),
  ]);

  // 이 회차들에 편성된 다른 시나리오의 배점을 모은다. 고치는 시나리오는 새 값으로 센다.
  const otherIds = [
    ...new Set(
      (picks ?? [])
        .map((p) => p.scenario_id as string)
        .filter((sid) => sid !== scenarioId),
    ),
  ];
  const { data: otherSteps } = otherIds.length
    ? await supabase
        .from("scenario_steps")
        .select("scenario_id, difficulty, points")
        .in("scenario_id", otherIds)
    : { data: [] as { scenario_id: string; difficulty: number; points: number | null }[] };

  const pointsByScenario = new Map<string, number>();
  pointsByScenario.set(
    scenarioId,
    steps.reduce((sum, st) => sum + stepPoints(st), 0),
  );
  for (const st of otherSteps ?? []) {
    const sid = st.scenario_id as string;
    pointsByScenario.set(sid, (pointsByScenario.get(sid) ?? 0) + stepPoints(st));
  }

  const now = Date.now();
  for (const round of rounds ?? []) {
    const members = (picks ?? [])
      .filter((p) => p.round_id === round.id)
      .map((p) => p.scenario_id as string);
    const total = members.reduce((sum, sid) => sum + (pointsByScenario.get(sid) ?? 0), 0);
    if (total === ROUND_MAX_SCORE) continue;

    const started = Date.parse(round.starts_at as string) <= now;
    const msg = `이 시나리오가 편성된 회차의 만점이 ${total}점이 됩니다(${ROUND_MAX_SCORE}점이어야 합니다).`;
    if (started) {
      return {
        blocked: `${msg} 이미 시작한 회차라 배점을 바꿀 수 없습니다.`,
        warnings,
      };
    }
    warnings.push(`${msg} 회차가 열리기 전에 맞춰주세요.`);
  }
  return { blocked: null, warnings };
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

  // 쓰기 전에 본다 — 막을 거라면 시나리오를 건드리지 않은 채로 돌려보내야 한다.
  const totals = await checkRoundTotals(supabase, id, steps);
  if (totals.blocked) {
    return NextResponse.json({ error: totals.blocked }, { status: 400 });
  }

  const { error } = await supabase
    .from("scenarios")
    .update({ ...scenario, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    const msg =
      error.code === "23505"
        ? `식별자 '${parsed.slug}'는 이미 다른 문제가 쓰고 있습니다.`
        : "수정에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const stepError = await syncSteps(supabase, id, steps);
  if (stepError) {
    return NextResponse.json({ error: stepError }, { status: 400 });
  }

  const updated = await fetchScenario(id);
  if (!updated) {
    return NextResponse.json(
      { error: "수정에 실패했습니다." },
      { status: 400 },
    );
  }
  await logAudit(supabase, "update", updated.id, updated);
  return NextResponse.json({
    scenario: updated,
    warnings: [...warnings, ...totals.warnings],
  });
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
  const existing = await fetchScenario(id);

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
