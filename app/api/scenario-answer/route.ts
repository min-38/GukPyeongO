import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";
import { getOrCreateVisitorId } from "@/app/lib/visitor.server";

// 시나리오 문항 채점 (#83).
// 정답을 클라이언트 번들에 넣지 않기 위해, 고른 답을 서버가 받아 판정한다.
// 같은 호출에서 방문자별 답안이 한 줄 남고, 그 줄이 새로 생겼을 때만 시도/정답 수가 오른다
// (DB 함수 answer_scenario_step). 회차 채점(/api/today-grade)도 이 기록만 보고 점수를 낸다 —
// 정답을 미리 긁어도 그 순간 첫 선택이 확정되므로 나중에 답을 바꿔 낼 수 없다.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const b = body as { slug?: unknown; stepKey?: unknown; choiceIndex?: unknown };
  if (typeof b.slug !== "string" || typeof b.stepKey !== "string") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  // 무응답(시간 초과)은 null로 온다. 시도로는 세되 정답으로는 세지 않는다.
  const choiceIndex =
    b.choiceIndex === null || b.choiceIndex === undefined
      ? null
      : Number(b.choiceIndex);
  if (choiceIndex !== null && !Number.isInteger(choiceIndex)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  try {
    const visitorId = await getOrCreateVisitorId();
    const { data, error } = await getSupabaseAdmin().rpc(
      "answer_scenario_step",
      {
        p_slug: b.slug,
        p_step_key: b.stepKey,
        p_choice: choiceIndex,
        p_visitor: visitorId,
      }
    );
    const row = (data ?? [])[0] as
      | { answer_index: number; is_correct: boolean }
      | undefined;
    if (error || !row) {
      return NextResponse.json(
        { error: "채점하지 못했습니다." },
        { status: 400 }
      );
    }
    return NextResponse.json({
      answerIndex: row.answer_index,
      isCorrect: row.is_correct,
    });
  } catch {
    return NextResponse.json(
      { error: "채점하지 못했습니다." },
      { status: 500 }
    );
  }
}
