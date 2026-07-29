import { NextResponse } from "next/server";

import { isAdmin } from "@/app/lib/admin-session.server";
import {
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

interface ReportRow {
  id: string;
  reason: string;
  detail: string | null;
  status: string;
  created_at: string;
  scenario_steps: StepJoin | null;
}

interface RatingRow {
  step_id: string;
  stars: number;
  comment: string | null;
  scenario_steps: StepJoin | null;
}

// ponytail: 최근 500줄만 읽어 JS에서 평균을 낸다. 더 쌓이면 뷰나 집계 테이블로 옮긴다.
const RATING_SCAN_LIMIT = 500;

function toReport(row: ReportRow): AdminStepReport {
  return {
    id: row.id,
    reason: row.reason,
    detail: row.detail,
    status: row.status === "resolved" ? "resolved" : "open",
    createdAt: row.created_at,
    scenarioTitle: row.scenario_steps?.scenarios?.title ?? "(삭제된 문제)",
    stepPrompt: row.scenario_steps?.prompt ?? "(삭제된 문항)",
  };
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
      .select(`id, reason, detail, status, created_at, ${select}`)
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

  return NextResponse.json({
    reports: ((reports.data ?? []) as unknown as ReportRow[]).map(toReport),
    ratings: toRatings((ratings.data ?? []) as unknown as RatingRow[]),
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
