import { NextResponse } from "next/server";

import { type GradeRank } from "@/app/lib/quiz";
import { createGradeToken, getSigningSecret } from "@/app/lib/score-token";
import { gradeForScore, gradeSegments } from "@/app/lib/scoring";
import { getCurrentRound } from "@/app/lib/schedule.server";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";
import { getOrCreateVisitorId } from "@/app/lib/visitor.server";
import { stepPoints } from "@/app/lib/scenario-points";

// 회차 채점 (#89, #100).
// 점수의 근거는 클라이언트가 보낸 답이 아니라 /api/scenario-answer 가 남긴 방문자별 답안이다
// (supabase/scenario_step_answers.sql). 정답·배점·만점도 서버가 DB에서 읽는다.
//
// 답을 요청 본문에서 받던 시절에는, 정답만 먼저 긁어낸 뒤 그 답을 제출하면 1등급이 나왔다.
// 이제 문항을 푸는 그 순간 첫 선택이 DB에 확정되므로 나중에 답을 바꿔 낼 수 없다.
// 그래서 이 라우트는 "어느 회차를 끝냈는지"만 받는다.
//
// 문항별 시도/정답 집계도 /api/scenario-answer 가 이미 했다. 여기서는 다시 올리지 않는다.

type Db = ReturnType<typeof getSupabaseAdmin>;

interface StepRow {
  id: string;
  step_key: string;
  sort_order: number;
  points: number | null;
  answer_index: number;
  difficulty: number;
  type: string;
  scenarios: { slug: string } | null;
}

export interface TodayGradeResponse {
  grade: number;
  score: number;
  maxScore: number;
  correctCount: number;
  totalCount: number;
  gradeToken: string;
  // 어느 회차를 푼 결과인지(#100). 다시 보기가 이 회차의 지문을 다시 읽어온다.
  roundId: string;
  // 유형(문항 분류)별 정답 수 — 결과 화면의 취약 유형 표시용.
  typeStats: { type: string; correct: number; total: number }[];
  // 채점을 끝낸 시각(#95). 기기 시계는 어긋나 있을 수 있어 서버 시계를 쓴다.
  finishedAt: string;
  // 등급 분포 속 내 위치(#95). 기록을 못 남긴 경우엔 없다.
  rank?: GradeRank;
}

// 같은 회차를 푼 사람들 사이에서 내 득점률이 어디쯤인지 (#115).
// 모집단은 이 회차 응시자다. 회차마다 문제가 달라 누적으로 세면 다른 문제를 푼 사람과
// 견주게 된다 — "이번 주 문제에서 내가 어디쯤인가"를 못 본다.
// 회차 초반이라 사람이 적을 때는 화면이 상위 %를 감춘다(GradeBar의 MIN_POPULATION).
async function gradeRank(
  supabase: Db,
  roundId: string,
  percent: number,
): Promise<GradeRank | undefined> {
  const rows = () =>
    supabase
      .from("scenario_sessions")
      .select("id", { count: "exact", head: true })
      .eq("round_id", roundId)
      .not("percent", "is", null);

  // ponytail: 등급마다 count 한 번씩(9번) 던진다. percent 인덱스가 받아주는 크기라 그냥 센다.
  // 응시자가 더 늘어 이 열 번이 부담되면 등급별 집계를 따로 쌓는 쪽으로 옮긴다.
  const [{ count: total }, { count: above }, ...perGrade] = await Promise.all([
    rows(),
    rows().gt("percent", percent),
    ...gradeSegments().map((s) =>
      s.grade === 1
        ? rows().gte("percent", s.from)
        : rows().gte("percent", s.from).lt("percent", s.to),
    ),
  ]);
  if (!total) return undefined;

  return {
    percent,
    // 나보다 높은 사람이 없어도 상위 0%로는 적지 않는다 — 최소 1%.
    topPercent: Math.max(1, Math.round(((above ?? 0) / total) * 100)),
    total,
    counts: perGrade.map((r) => r.count ?? 0),
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const roundId = (body as { roundId?: unknown }).roundId;
  if (typeof roundId !== "string") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const visitorId = await getOrCreateVisitorId();

    // 이 회차를 채점해줄 사람인지 본다(#100).
    // 시작 기록(scenario_sessions)은 회차가 열려 있을 때만 만들어지므로, 그 행이 있다는 것
    // 자체가 "기간 안에 시작했다"는 증거다 — 풀던 중에 마감이 지나도 결과를 인정한다.
    const { data: started } = await supabase
      .from("scenario_sessions")
      .select("id, finished_at")
      .eq("round_id", roundId)
      .eq("visitor_id", visitorId)
      .maybeSingle();

    // 한 회차는 한 번만 응시한다(튜토리얼에도 그렇게 적어 두었다).
    // 여태 이 규칙은 브라우저 저장소에만 있어서, 저장소를 비우고 다시 내면 기록이 덮여 썼다.
    // 등급 분포와 상위 % 가 그 기록으로 계산되므로 서버에서 막는다.
    if (started?.finished_at) {
      return NextResponse.json(
        { error: "이미 응시한 회차입니다." },
        { status: 409 },
      );
    }
    // ponytail: 시작 기록은 fire-and-forget이라 실패했을 수 있다. 그때는 회차가 열려 있는지로 봐준다.
    // 기록이 실패한 채로 마감까지 지나면 거부된다 — 시작 전에 기록을 기다리면 막을 수 있지만 시작이 그만큼 늦어진다.
    if (!started) {
      const current = await getCurrentRound();
      if (current?.id !== roundId) {
        return NextResponse.json(
          { error: "이미 마감된 회차입니다." },
          { status: 400 },
        );
      }
    }

    // 이 회차에 편성된 시나리오의 문항 전체 — 만점은 여기서 나온다.
    const { data, error } = await supabase
      .from("round_scenarios")
      .select(
        "sort_order, scenarios!inner(slug, status, scenario_steps(id, step_key, answer_index, difficulty, points, type, sort_order))",
      )
      .eq("round_id", roundId)
      // 채점만 할 때는 순서가 상관없었지만, 문제 다시 보기(#96)가 이 순서를 그대로 쓴다.
      // 편성 순서와 문항 순서대로 나와야 대화가 오간 차례대로 쌓인다.
      .order("sort_order", { ascending: true })
      .order("sort_order", {
        referencedTable: "scenarios.scenario_steps",
        ascending: true,
      });

    if (error || !data) {
      return NextResponse.json(
        { error: "채점하지 못했습니다." },
        { status: 500 },
      );
    }

    const steps: StepRow[] = [];
    for (const row of data as unknown as {
      scenarios: {
        slug: string;
        status: string;
        scenario_steps: Omit<StepRow, "scenarios">[];
      } | null;
    }[]) {
      const s = row.scenarios;
      if (!s || s.status !== "published") continue;
      for (const st of s.scenario_steps ?? []) {
        steps.push({ ...st, scenarios: { slug: s.slug } });
      }
    }

    if (steps.length === 0) {
      return NextResponse.json(
        { error: "이 회차에 편성된 문제가 없습니다." },
        { status: 400 },
      );
    }

    // 점수의 근거는 오직 서버가 남긴 답안이다. 클라이언트가 보낸 값은 쓰지 않는다.
    // 답안 키에 회차가 들어갔다(#102). 회차로 좁히지 않으면 같은 문항을 다시 편성했을 때
    // 지난 회차의 선택이 섞여 들어온다.
    const { data: recorded } = await supabase
      .from("scenario_step_answers")
      .select("step_id, choice_index")
      .eq("visitor_id", visitorId)
      .eq("round_id", roundId)
      .in(
        "step_id",
        steps.map((s) => s.id),
      );
    const picked = new Map<string, number | null>(
      (recorded ?? []).map((r) => [r.step_id as string, r.choice_index]),
    );

    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    const byType = new Map<string, { correct: number; total: number }>();

    for (const step of steps) {
      const points = stepPoints(step);
      maxScore += points;

      // 기록이 없는 문항(끝까지 못 간 경우)과 무응답은 똑같이 못 푼 것으로 묶인다.
      const correct = picked.get(step.id) === step.answer_index;
      if (correct) {
        score += points;
        correctCount += 1;
      }

      const stat = byType.get(step.type) ?? { correct: 0, total: 0 };
      stat.total += 1;
      if (correct) stat.correct += 1;
      byType.set(step.type, stat);
    }

    const grade = gradeForScore(score, maxScore);

    // 회차 완료 기록 (#91). 실패해도 채점 결과는 그대로 돌려준다.
    const finishedAt = new Date().toISOString();
    let rank: GradeRank | undefined;
    try {
      await supabase.from("scenario_sessions").upsert(
        {
          round_id: roundId,
          visitor_id: visitorId,
          finished_at: finishedAt,
          score,
          max_score: maxScore,
          grade,
        },
        { onConflict: "round_id,visitor_id" },
      );
      // 내 기록을 넣은 뒤에 센다 — 모집단에 나도 들어가야 "상위 100%"가 성립한다.
      rank = await gradeRank(supabase, roundId, (score / maxScore) * 100);
    } catch {
      // 지표 기록 실패는 무시한다 — 분포 막대만 빠진다
    }
    const response: TodayGradeResponse = {
      grade,
      score,
      maxScore,
      correctCount,
      totalCount: steps.length,
      gradeToken: createGradeToken(grade, roundId, getSigningSecret()),
      roundId,
      typeStats: [...byType.entries()].map(([type, s]) => ({ type, ...s })),
      finishedAt,
      ...(rank ? { rank } : {}),
    };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "채점하지 못했습니다." },
      { status: 500 },
    );
  }
}
