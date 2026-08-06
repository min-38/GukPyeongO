import { NextResponse } from "next/server";

import { getCurrentRound } from "@/app/lib/schedule.server";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";
import { getOrCreateVisitorId } from "@/app/lib/visitor.server";

// 회차 시작 기록 (#91, #100, #105).
// 완료(채점)만 남기면 시작하고 이탈한 사람이 보이지 않는다. 시작 시점에 한 줄 남긴다.
// 같은 사람이 여러 번 눌러도 (round_id, visitor_id) 유니크로 한 줄이다.
//
// 이 행은 "회차가 열려 있을 때 시작했다"는 증거이기도 하다 — 풀던 중에 마감이 지나도
// 채점을 받아주는 근거로 /api/today-grade 가 이 행을 본다.
//
// body 에 { stage: "reading" } 이 오면 첫 지문 화면에 들어간 시각을 남긴다(#105).
// 시작과 첫 문항 사이에는 유형 튜토리얼과 지문 전문 두 화면이 있는데, 이 표식 하나로
// 둘 중 어디서 나갔는지가 갈린다.
// 이어풀기 (#109). 이번 회차에서 이미 답한 문항을 돌려준다.
// 답은 이미 서버에 있다 — 브라우저가 잃는 것은 "몇 번째 지문이었나"뿐이라
// 그걸 여기서 되찾아 준다.
//
// 고른 보기와 정답을 함께 내보낸다. 답하는 순간 화면에 이미 공개된 값이라 새로 새는 것이 없고,
// 아직 답하지 않은 문항은 애초에 여기 담기지 않는다.
export interface TodayAnswered {
  slug: string;
  stepKey: string;
  choiceIndex: number | null;
  answerIndex: number;
}

export async function GET() {
  try {
    const round = await getCurrentRound();
    if (!round) return NextResponse.json({ answered: [] });
    const visitorId = await getOrCreateVisitorId();

    const { data } = await getSupabaseAdmin()
      .from("scenario_step_answers")
      .select(
        "choice_index, scenario_steps!inner(step_key, answer_index, scenarios!inner(slug))",
      )
      .eq("visitor_id", visitorId)
      .eq("round_id", round.id);

    const rows = (data ?? []) as unknown as {
      choice_index: number | null;
      scenario_steps: {
        step_key: string;
        answer_index: number;
        scenarios: { slug: string } | null;
      } | null;
    }[];

    const answered: TodayAnswered[] = [];
    for (const row of rows) {
      const step = row.scenario_steps;
      if (!step?.scenarios) continue;
      answered.push({
        slug: step.scenarios.slug,
        stepKey: step.step_key,
        choiceIndex: row.choice_index,
        answerIndex: step.answer_index,
      });
    }
    return NextResponse.json({ answered });
  } catch {
    // 못 찾으면 처음부터 푼다 — 지금까지와 같다.
    return NextResponse.json({ answered: [] });
  }
}

export async function POST(request: Request) {
  try {
    const round = await getCurrentRound();
    if (!round) return NextResponse.json({ ok: false });
    const visitorId = await getOrCreateVisitorId();
    const db = getSupabaseAdmin();

    // 본문은 없을 수도 있다(시작 기록은 빈 POST 다).
    const stage = await request
      .json()
      .then((b: unknown) => (b as { stage?: unknown }).stage)
      .catch(() => undefined);

    if (stage === "reading") {
      // 이미 값이 있으면 덮지 않는다 — 요청이 중복돼도 처음 들어간 시각이 남는다.
      await db
        .from("scenario_sessions")
        .update({ first_reading_at: new Date().toISOString() })
        .eq("round_id", round.id)
        .eq("visitor_id", visitorId)
        .is("first_reading_at", null);
      return NextResponse.json({ ok: true });
    }

    await db
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
