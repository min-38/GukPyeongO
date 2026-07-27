import { NextResponse } from "next/server";

import { todayKst } from "@/app/lib/schedule.server";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";
import { getOrCreateVisitorId } from "@/app/lib/visitor.server";

// 오늘 회차 시작 기록 (#91).
// 완료(채점)만 남기면 시작하고 이탈한 사람이 보이지 않는다. 시작 시점에 한 줄 남긴다.
// 같은 사람이 같은 날 여러 번 눌러도 (publish_date, visitor_id) 유니크로 한 줄이다.
export async function POST() {
  try {
    const visitorId = await getOrCreateVisitorId();
    await getSupabaseAdmin()
      .from("scenario_sessions")
      .upsert(
        { publish_date: todayKst(), visitor_id: visitorId },
        { onConflict: "publish_date,visitor_id", ignoreDuplicates: true }
      );
    return NextResponse.json({ ok: true });
  } catch {
    // 기록 실패가 문제 푸는 걸 막지는 않는다.
    return NextResponse.json({ ok: false });
  }
}
