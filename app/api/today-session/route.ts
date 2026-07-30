import { NextResponse } from "next/server";

import { getCurrentRound } from "@/app/lib/schedule.server";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";
import { getOrCreateVisitorId } from "@/app/lib/visitor.server";

// 회차 시작 기록 (#91, #100).
// 완료(채점)만 남기면 시작하고 이탈한 사람이 보이지 않는다. 시작 시점에 한 줄 남긴다.
// 같은 사람이 여러 번 눌러도 (round_id, visitor_id) 유니크로 한 줄이다.
//
// 이 행은 "회차가 열려 있을 때 시작했다"는 증거이기도 하다 — 풀던 중에 마감이 지나도
// 채점을 받아주는 근거로 /api/today-grade 가 이 행을 본다.
export async function POST() {
  try {
    const round = await getCurrentRound();
    if (!round) return NextResponse.json({ ok: false });
    const visitorId = await getOrCreateVisitorId();
    await getSupabaseAdmin()
      .from("scenario_sessions")
      .upsert(
        { round_id: round.id, visitor_id: visitorId },
        { onConflict: "round_id,visitor_id", ignoreDuplicates: true }
      );
    return NextResponse.json({ ok: true });
  } catch {
    // 기록 실패가 문제 푸는 걸 막지는 않는다.
    return NextResponse.json({ ok: false });
  }
}
