import { NextResponse } from "next/server";

import { isAdmin } from "@/app/lib/admin-session.server";
import {
  type AdminRoundRating,
  type AdminStepRating,
  type AdminStepReport,
} from "@/app/lib/quiz";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

// 문항 항의·별점 읽기 (#96).
// 항의는 처리 상태를 넘겨야 해서 줄 단위로, 별점은 "어떤 문제가 좋았나"를 보는 자리라
// 문항 단위 평균으로 묶어 내려준다.

interface StepJoin {
  prompt: string;
  scenario_id: string;
  scenarios: { title: string } | null;
}

// 항의 줄에는 선택지·정답이 더 필요하다 — 무엇을 골라서 틀렸는지 봐야
// 항의가 타당한지 판단할 수 있다.
interface ReportStepJoin extends StepJoin {
  choices: string[] | null;
  answer_index: number;
}

interface ReportRow {
  id: string;
  reason: string;
  detail: string | null;
  status: string;
  created_at: string;
  step_id: string;
  // 나중에 추가한 컬럼이라 그 전에 쌓인 항의는 비어 있다.
  visitor_id: string | null;
  // 어느 회차에서 낸 항의인지(#103). 회차 밖 항의와 옛 항의는 비어 있다.
  round_id: string | null;
  scenario_steps: ReportStepJoin | null;
}

interface RatingRow {
  step_id: string;
  stars: number;
  comment: string | null;
  scenario_steps: StepJoin | null;
}

// ponytail: 최근 500줄만 읽어 JS에서 평균을 낸다. 더 쌓이면 뷰나 집계 테이블로 옮긴다.
const RATING_SCAN_LIMIT = 500;

function toReport(
  row: ReportRow,
  picked: Map<string, number | null>,
): AdminStepReport {
  return {
    id: row.id,
    reason: row.reason,
    detail: row.detail,
    status: row.status === "resolved" ? "resolved" : "open",
    createdAt: row.created_at,
    // 문제가 지워졌으면 갈 곳이 없다 — 빈 값으로 두고 화면에서 링크를 접는다.
    scenarioId: row.scenario_steps?.scenario_id ?? "",
    scenarioTitle: row.scenario_steps?.scenarios?.title ?? "(삭제된 문제)",
    stepPrompt: row.scenario_steps?.prompt ?? "(삭제된 문항)",
    choices: row.scenario_steps?.choices ?? [],
    answerIndex: row.scenario_steps?.answer_index ?? -1,
    // undefined = 고른 기록이 없음(visitor_id 이전 항의거나 답하기 전에 신고).
    // null = 무응답(시간 초과). 화면에서 둘을 다르게 말해야 한다.
    pickedIndex: lookupPick(picked, row.visitor_id, row.step_id, row.round_id),
  };
}

// 세 값을 이어 붙인 키. step_id 가 uuid 라 널 문자로 가르면 부딪힐 일이 없다.
// 회차까지 넣는다(#103) — 같은 지문을 다시 편성하면 한 사람의 같은 문항에 답이 여러 줄 쌓인다.
const answerKey = (visitorId: string, stepId: string, roundId: string | null) =>
  `${visitorId}\u0000${stepId}\u0000${roundId ?? ""}`;

// has/get 을 나눠 본다 — `get() ?? undefined` 로 뭉치면 무응답(null)이
// "기록 없음"으로 둔갑해 화면이 거짓말을 한다.
function lookupPick(
  picked: Map<string, number | null>,
  visitorId: string | null,
  stepId: string,
  roundId: string | null,
): number | null | undefined {
  if (!visitorId) return undefined;
  const key = answerKey(visitorId, stepId, roundId);
  return picked.has(key) ? picked.get(key) : undefined;
}

function toRatings(rows: RatingRow[]): AdminStepRating[] {
  const byStep = new Map<string, AdminStepRating & { sum: number }>();
  for (const row of rows) {
    const acc = byStep.get(row.step_id) ?? {
      stepId: row.step_id,
      scenarioId: row.scenario_steps?.scenario_id ?? "",
      scenarioTitle: row.scenario_steps?.scenarios?.title ?? "(삭제된 문제)",
      stepPrompt: row.scenario_steps?.prompt ?? "(삭제된 문항)",
      average: 0,
      count: 0,
      comments: [],
      sum: 0,
    };
    acc.sum += row.stars;
    acc.count += 1;
    if (row.comment) acc.comments.push(row.comment);
    byStep.set(row.step_id, acc);
  }
  return [...byStep.values()]
    .map(({ sum, ...r }) => ({
      ...r,
      average: Math.round((sum / r.count) * 10) / 10,
    }))
    // 낮은 별점부터 — 손볼 문항이 위로 올라와야 한다.
    .sort((a, b) => a.average - b.average);
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const select = "scenario_steps(prompt, scenario_id, scenarios(title))";

  const [reports, ratings] = await Promise.all([
    supabase
      .from("step_reports")
      .select(
        `id, reason, detail, status, created_at, step_id, visitor_id, round_id, ` +
          `scenario_steps(prompt, scenario_id, choices, answer_index, scenarios(title))`,
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("step_ratings")
      .select(`step_id, stars, comment, ${select}`)
      .order("created_at", { ascending: false })
      .limit(RATING_SCAN_LIMIT),
  ]);

  if (reports.error || ratings.error) {
    return NextResponse.json(
      { error: "항의·평가를 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  const reportRows = (reports.data ?? []) as unknown as ReportRow[];

  // 항의한 사람이 무엇을 골랐는지. scenario_step_answers 는 step_reports 와
  // 외래키로 이어져 있지 않아 조인이 안 된다 — 필요한 것만 따로 읽어 붙인다.
  //
  // in() 두 개는 곱집합이라 남의 답까지 딸려 온다. 키를 (방문자, 문항, 회차)로 맞춰
  // 실제 짝만 골라 담는다.
  const picked = new Map<string, number | null>();
  const visitorIds = [
    ...new Set(reportRows.map((r) => r.visitor_id).filter((v): v is string => !!v)),
  ];
  if (visitorIds.length > 0) {
    const wanted = new Set(
      reportRows
        .filter((r) => r.visitor_id)
        .map((r) => answerKey(r.visitor_id!, r.step_id, r.round_id)),
    );
    const { data: answers } = await supabase
      .from("scenario_step_answers")
      .select("visitor_id, step_id, choice_index, round_id")
      .in("visitor_id", visitorIds)
      .in("step_id", [...new Set(reportRows.map((r) => r.step_id))]);

    for (const a of answers ?? []) {
      const key = answerKey(
        a.visitor_id as string,
        a.step_id as string,
        (a.round_id as string | null) ?? null,
      );
      if (wanted.has(key)) picked.set(key, a.choice_index as number | null);
    }
  }

  // 회차 평가(#112). 회차 수만큼만 나오는 줄이라 평균은 뷰가 내고, 남긴 말만 따로 읽는다.
  const [roundAgg, roundComments] = await Promise.all([
    supabase
      .from("dashboard_round_ratings")
      .select("round_id, starts_at, average, count")
      .order("starts_at", { ascending: false })
      .limit(12),
    supabase
      .from("round_ratings")
      .select("round_id, comment")
      .not("comment", "is", null)
      .order("created_at", { ascending: false })
      .limit(RATING_SCAN_LIMIT),
  ]);

  const saidByRound = new Map<string, string[]>();
  for (const row of (roundComments.data ?? []) as {
    round_id: string;
    comment: string;
  }[]) {
    saidByRound.set(row.round_id, [
      ...(saidByRound.get(row.round_id) ?? []),
      row.comment,
    ]);
  }

  const roundRatings: AdminRoundRating[] = (
    (roundAgg.data ?? []) as unknown as {
      round_id: string;
      starts_at: string;
      average: number;
      count: number;
    }[]
  ).map((r) => ({
    roundId: r.round_id,
    label: new Date(r.starts_at).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "2-digit",
      day: "2-digit",
    }),
    average: Number(r.average),
    count: r.count,
    comments: saidByRound.get(r.round_id) ?? [],
  }));

  return NextResponse.json({
    reports: reportRows.map((r) => toReport(r, picked)),
    ratings: toRatings((ratings.data ?? []) as unknown as RatingRow[]),
    roundRatings,
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
  const { id, status } = body as { id?: unknown; status?: unknown };
  if (typeof id !== "string" || (status !== "open" && status !== "resolved")) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("step_reports")
    .update({ status })
    .eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: "변경하지 못했습니다." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
