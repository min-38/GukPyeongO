import { NextResponse } from "next/server";

import { isAdmin } from "@/app/lib/admin-session.server";
import { stepPoints } from "@/app/lib/scenario-points";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

// 하루치 만점. 등급은 획득 점수 ÷ 만점이라(#89) 날마다 만점이 달라지면
// 같은 등급이 다른 실력을 뜻하게 된다. 편성 단계에서 100점으로 못 박는다.
export const DAILY_MAX_SCORE = 100;

// 날짜별 시나리오 편성 (#66).
// GET  — 날짜별 편성 목록(가까운 날짜부터). ?date=YYYY-MM-DD 를 주면 그 날짜만.
// PUT  — 한 날짜의 편성을 통째로 바꾼다(넘긴 순서가 곧 푸는 순서).

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const date = new URL(request.url).searchParams.get("date");
  if (date !== null && !DATE_RE.test(date)) {
    return NextResponse.json(
      { error: "날짜 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  let query = getSupabaseAdmin()
    .from("scenario_schedule")
    .select("publish_date, scenario_id, sort_order")
    .order("publish_date", { ascending: true })
    .order("sort_order", { ascending: true });
  if (date) query = query.eq("publish_date", date);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "편성을 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  // 날짜별로 묶어서 돌려준다 — 화면이 그대로 그리면 되도록.
  const byDate = new Map<string, string[]>();
  for (const row of data ?? []) {
    const list = byDate.get(row.publish_date) ?? [];
    list.push(row.scenario_id);
    byDate.set(row.publish_date, list);
  }
  return NextResponse.json({
    schedule: [...byDate.entries()].map(([date, scenarioIds]) => ({
      date,
      scenarioIds,
    })),
  });
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const b = body as { date?: unknown; scenarioIds?: unknown };
  if (typeof b.date !== "string" || !DATE_RE.test(b.date)) {
    return NextResponse.json(
      { error: "날짜를 선택해주세요." },
      { status: 400 },
    );
  }
  if (
    !Array.isArray(b.scenarioIds) ||
    !b.scenarioIds.every((id) => typeof id === "string")
  ) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const ids = b.scenarioIds as string[];
  if (new Set(ids).size !== ids.length) {
    return NextResponse.json(
      { error: "같은 시나리오를 하루에 두 번 넣을 수 없습니다." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  // 만점이 100이 아니면 게시하지 않는다. 비우는 것(편성 해제)은 허용한다.
  if (ids.length > 0) {
    const { data: steps, error: stepError } = await supabase
      .from("scenario_steps")
      .select("difficulty, points, scenario_id")
      .in("scenario_id", ids);
    if (stepError) {
      return NextResponse.json(
        { error: "배점을 확인하지 못했습니다." },
        { status: 500 },
      );
    }
    const total = (steps ?? []).reduce(
      (sum, st) =>
        sum + stepPoints(st),
      0,
    );
    if (total !== DAILY_MAX_SCORE) {
      return NextResponse.json(
        {
          error: `하루 만점은 ${DAILY_MAX_SCORE}점이어야 합니다. 지금 ${total}점입니다.`,
        },
        { status: 400 },
      );
    }
  }

  // 그 날짜의 편성을 통째로 교체한다. 순서만 바꾸는 경우도 있어 지우고 다시 넣는 편이 단순하다.
  const { error: deleteError } = await supabase
    .from("scenario_schedule")
    .delete()
    .eq("publish_date", b.date);
  if (deleteError) {
    return NextResponse.json(
      { error: "편성 저장에 실패했습니다." },
      { status: 500 },
    );
  }

  if (ids.length > 0) {
    const { error } = await supabase.from("scenario_schedule").insert(
      ids.map((scenario_id, i) => ({
        publish_date: b.date,
        scenario_id,
        sort_order: i + 1,
      })),
    );
    if (error) {
      const msg =
        error.code === "23503"
          ? "없는 시나리오가 포함돼 있습니다."
          : "편성 저장에 실패했습니다.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, date: b.date, scenarioIds: ids });
}
