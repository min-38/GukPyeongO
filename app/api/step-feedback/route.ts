import { NextResponse } from "next/server";

import {
  MAX_RATING_COMMENT_LENGTH,
  MAX_REPORT_DETAIL_LENGTH,
  REPORT_REASONS,
} from "@/app/lib/quiz";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";
import { getOrCreateVisitorId } from "@/app/lib/visitor.server";

// 문항 항의·별점 받기 (#96).
// 문제 다시 보기에서 미트볼을 눌러 남긴다. 둘을 한 라우트로 받는 이유는
// 보내는 자리도 하나이고, 문항을 찾는 절차(slug+stepKey → id)가 같기 때문.
//
// 클라이언트는 scenario_steps 의 uuid를 모른다(화면이 쓰는 건 slug와 stepKey다).
// 그래서 여기서 찾아 바꾼다 — 클라이언트가 아무 uuid나 적어 보내는 길도 함께 막힌다.
async function findStepId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  slug: string,
  stepKey: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("scenario_steps")
    .select("id, scenarios!inner(slug)")
    .eq("step_key", stepKey)
    .eq("scenarios.slug", slug)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

// 항의가 어느 회차의 것인지 (#103). 어드민이 "이 사람이 무엇을 골랐나"를 회차까지 맞춰 찾는다.
// 클라이언트가 보낸 값을 믿지 않고 시작 기록에서 찾는다 —
// answer_scenario_step 이 답안에 회차를 적을 때 쓰는 방식과 같다.
async function findRoundId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  visitorId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("scenario_sessions")
    .select("round_id")
    .eq("visitor_id", visitorId)
    .not("round_id", "is", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { round_id: string } | null)?.round_id ?? null;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (typeof b.slug !== "string" || typeof b.stepKey !== "string") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const stepId = await findStepId(supabase, b.slug, b.stepKey);
  if (!stepId) {
    return NextResponse.json(
      { error: "문항을 찾지 못했습니다." },
      { status: 404 },
    );
  }

  if (b.type === "report") {
    if (!REPORT_REASONS.includes(b.reason as (typeof REPORT_REASONS)[number])) {
      return NextResponse.json(
        { error: "항의 사유를 선택해주세요." },
        { status: 400 },
      );
    }
    const detail = typeof b.detail === "string" ? b.detail.trim() : "";
    if (detail.length > MAX_REPORT_DETAIL_LENGTH) {
      return NextResponse.json(
        { error: `상세 내용은 ${MAX_REPORT_DETAIL_LENGTH}자까지 쓸 수 있어요.` },
        { status: 400 },
      );
    }
    // 같은 사람이 같은 회차의 같은 문항에 다시 넣으면 덮어쓴다 — 시트를 접었다 펴는 것만으로
    // 항의가 여러 줄 쌓이면 어드민이 같은 말을 반복해 읽는다.
    // 회차가 다르면 다른 항의다(#103) — 같은 지문을 다시 편성하면 고른 답도 달라진다.
    const visitorId = await getOrCreateVisitorId();
    const { error } = await supabase.from("step_reports").upsert(
      {
        step_id: stepId,
        visitor_id: visitorId,
        round_id: await findRoundId(supabase, visitorId),
        reason: b.reason,
        detail: detail || null,
      },
      { onConflict: "step_id,visitor_id,round_id" },
    );
    if (error) {
      return NextResponse.json(
        { error: "접수하지 못했습니다." },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (b.type === "rating") {
    const stars = Number(b.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: "별점을 선택해주세요." },
        { status: 400 },
      );
    }
    const comment = typeof b.comment === "string" ? b.comment.trim() : "";
    if (comment.length > MAX_RATING_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `한마디는 ${MAX_RATING_COMMENT_LENGTH}자까지 쓸 수 있어요.` },
        { status: 400 },
      );
    }
    // 같은 사람이 다시 매기면 덮어쓴다 — 평균이 한 사람 손에 휘둘리지 않게.
    const { error } = await supabase.from("step_ratings").upsert(
      {
        step_id: stepId,
        visitor_id: await getOrCreateVisitorId(),
        stars,
        comment: comment || null,
      },
      { onConflict: "step_id,visitor_id" },
    );
    if (error) {
      return NextResponse.json(
        { error: "저장하지 못했습니다." },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
}
