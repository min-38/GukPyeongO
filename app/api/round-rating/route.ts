import { NextResponse } from "next/server";

import { MAX_RATING_COMMENT_LENGTH } from "@/app/lib/quiz";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";
import { getOrCreateVisitorId } from "@/app/lib/visitor.server";

// 회차 평가 (#112). 결과 화면에서 "이번 회차 어땠나"를 받는다.
// 문항 평가(/api/step-feedback)와 묻는 것이 달라 자리도 테이블도 따로 둔다.

export interface RoundRatingResponse {
  stars: number;
  comment: string | null;
}

// 이미 남긴 평가. 다시 들어와도 남긴 값을 그대로 보여준다.
export async function GET(request: Request) {
  const roundId = new URL(request.url).searchParams.get("round");
  if (!roundId) return NextResponse.json({ rating: null });

  try {
    const visitorId = await getOrCreateVisitorId();
    const { data } = await getSupabaseAdmin()
      .from("round_ratings")
      .select("stars, comment")
      .eq("round_id", roundId)
      .eq("visitor_id", visitorId)
      .maybeSingle();
    return NextResponse.json({ rating: data ?? null });
  } catch {
    // 못 읽으면 안 남긴 것으로 본다 — 다시 남기면 덮어쓰므로 잃는 것이 없다.
    return NextResponse.json({ rating: null });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const b = body as { roundId?: unknown; stars?: unknown; comment?: unknown };

  if (typeof b.roundId !== "string") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const stars = Number(b.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "별점을 선택해주세요." }, { status: 400 });
  }
  const comment = typeof b.comment === "string" ? b.comment.trim() : "";
  if (comment.length > MAX_RATING_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `한마디는 ${MAX_RATING_COMMENT_LENGTH}자까지 쓸 수 있어요.` },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const visitorId = await getOrCreateVisitorId();

    // 끝낸 사람만 남긴다. 결과 화면은 브라우저 저장소로도 열리므로(#97)
    // "결과를 보고 있다"는 것만으로는 근거가 되지 않는다 — 채점 기록으로 본다.
    const { data: session } = await supabase
      .from("scenario_sessions")
      .select("finished_at")
      .eq("round_id", b.roundId)
      .eq("visitor_id", visitorId)
      .maybeSingle();
    if (!session?.finished_at) {
      return NextResponse.json(
        { error: "회차를 끝낸 뒤에 남길 수 있어요." },
        { status: 403 },
      );
    }

    const { error } = await supabase.from("round_ratings").upsert(
      {
        round_id: b.roundId,
        visitor_id: visitorId,
        stars,
        comment: comment || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "round_id,visitor_id" },
    );
    if (error) {
      return NextResponse.json(
        { error: "저장하지 못했습니다." },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "저장하지 못했습니다." },
      { status: 500 },
    );
  }
}
