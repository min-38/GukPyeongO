import { NextResponse } from "next/server";

import { isAdmin } from "@/app/lib/admin-session.server";
import { ROUND_MAX_SCORE, stepPoints } from "@/app/lib/scenario-points";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

// 회차 편성 (#66, #100).
// GET    — 회차 목록(최근 시작 순)과 각 회차에 편성된 시나리오.
// PUT    — 회차 하나를 통째로 저장한다. id가 없으면 새로 만든다(넘긴 순서가 곧 푸는 순서).
// DELETE — ?id= 로 회차를 지운다. 응시자가 있으면 DB가 막는다.

export interface AdminRound {
  id: string;
  startsAt: string;
  endsAt: string;
  scenarioIds: string[];
}

const isTime = (v: unknown): v is string =>
  typeof v === "string" && Number.isFinite(Date.parse(v));

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const [{ data: rounds, error }, { data: picks }] = await Promise.all([
    supabase
      .from("rounds")
      .select("id, starts_at, ends_at")
      .order("starts_at", { ascending: false }),
    supabase
      .from("round_scenarios")
      .select("round_id, scenario_id, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  if (error) {
    return NextResponse.json(
      { error: "편성을 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  const byRound = new Map<string, string[]>();
  for (const row of picks ?? []) {
    const list = byRound.get(row.round_id) ?? [];
    list.push(row.scenario_id);
    byRound.set(row.round_id, list);
  }

  const list: AdminRound[] = (rounds ?? []).map((r) => ({
    id: r.id,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    scenarioIds: byRound.get(r.id) ?? [],
  }));
  return NextResponse.json({ rounds: list });
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

  const b = body as {
    id?: unknown;
    startsAt?: unknown;
    endsAt?: unknown;
    scenarioIds?: unknown;
  };
  if (!isTime(b.startsAt) || !isTime(b.endsAt)) {
    return NextResponse.json(
      { error: "시작·마감 일시를 입력해주세요." },
      { status: 400 },
    );
  }
  if (Date.parse(b.endsAt) <= Date.parse(b.startsAt)) {
    return NextResponse.json(
      { error: "마감은 시작보다 뒤여야 합니다." },
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
      { error: "같은 시나리오를 한 회차에 두 번 넣을 수 없습니다." },
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
    const total = (steps ?? []).reduce((sum, st) => sum + stepPoints(st), 0);
    if (total !== ROUND_MAX_SCORE) {
      return NextResponse.json(
        {
          error: `회차 만점은 ${ROUND_MAX_SCORE}점이어야 합니다. 지금 ${total}점입니다.`,
        },
        { status: 400 },
      );
    }
  }

  // 회차 자체를 먼저 만들거나 기간을 고친다. 겹침은 DB의 exclude 제약이 막는다.
  const window = { starts_at: b.startsAt, ends_at: b.endsAt };
  const saved =
    typeof b.id === "string" && b.id.length > 0
      ? await supabase
          .from("rounds")
          .update(window)
          .eq("id", b.id)
          .select("id")
          .single()
      : await supabase.from("rounds").insert(window).select("id").single();

  if (saved.error || !saved.data) {
    const msg =
      saved.error?.code === "23P01"
        ? "다른 회차와 기간이 겹칩니다."
        : "회차 저장에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const roundId = saved.data.id as string;

  // 편성은 통째로 교체한다. 지우기와 넣기를 따로 던지면 넣기가 실패했을 때
  // 지운 것만 남아 회차가 빈 채로 살아 있게 된다 — 진행 중이었다면 그 자리에서 "준비 중"이 된다.
  // DB 함수 하나가 곧 트랜잭션 하나라, 중간에 틀어지면 지운 것까지 되돌아간다.
  const { error: replaceError } = await supabase.rpc("set_round_scenarios", {
    p_round: roundId,
    p_ids: ids,
  });
  if (replaceError) {
    const msg =
      replaceError.code === "23503"
        ? "없는 시나리오가 포함돼 있습니다."
        : "편성 저장에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const round: AdminRound = {
    id: roundId,
    startsAt: b.startsAt,
    endsAt: b.endsAt,
    scenarioIds: ids,
  };
  return NextResponse.json({ ok: true, round });
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin().from("rounds").delete().eq("id", id);
  if (error) {
    // 응시 기록이 물고 있으면 on delete restrict 가 막는다.
    const msg =
      error.code === "23503"
        ? "이미 응시한 사람이 있어 삭제할 수 없습니다."
        : "회차를 지우지 못했습니다.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
