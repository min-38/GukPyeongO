import "server-only";

import { getSupabaseAdmin } from "./supabase-admin.server";
import { readVisitorId } from "./visitor.server";

// 홈에 여는 지난 회차 기록 (#113).
// 처음 들어온 사람이 "이 서비스 굴러가고 있구나"를 알아야 문제를 풀기 시작한다.
//
// 어드민 뷰를 그대로 내보내지 않는다. 거기에는 공개하면 안 되는 값이 섞여 있다.
//  · 완주율 22% — "다섯 중 넷이 포기하는 테스트"로 읽힌다
//  · 재방문율 0% — 회차가 하나뿐이라 구조상 나올 수 없던 값이다
//  · 회차별 응시자 수 — 작은 숫자가 그대로 노출된다. 누적으로 대신한다
// 그래서 공개할 것만 골라 담는 얇은 층을 따로 둔다.
//
// **마감된 회차만** 연다. 진행 중인 회차의 등급 분포를 풀기 전에 보면 힌트가 된다.

// 최근 몇 회차까지 보여줄지. 이력이 길어지면 화면이 아니라 기록 보관소가 된다.
const RECENT = 6;

export interface PastRound {
  roundId: string;
  label: string; // 회차 시작 일시(KST)
  scenarios: number;
  steps: number;
  // 1~9등급 인원. 지난 회차가 어떤 모양이었는지 보여준다.
  gradeDist: number[];
  // 다시 온 사람에게만 — 그 회차에 내가 몇 등급이었는지. 기록이 없으면 null.
  myGrade: number | null;
}

export interface PublicHistory {
  // 지금까지 회차를 시작한 사람 수(중복 제외). 회차가 쌓일수록 커진다.
  totalVisitors: number;
  // 최근 마감된 회차부터.
  rounds: PastRound[];
}

const label = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  });

export async function getPublicHistory(): Promise<PublicHistory | null> {
  try {
    const db = getSupabaseAdmin();
    // 쿠키가 없는 사람에게는 새로 심지 않는다 — 홈을 보는 것만으로 방문자가 생기면 안 된다.
    const visitorId = await readVisitorId();

    const now = new Date().toISOString();
    const { data: roundRows } = await db
      .from("rounds")
      .select("id, starts_at")
      .lt("ends_at", now)
      .order("starts_at", { ascending: false })
      .limit(RECENT);

    const rounds = (roundRows ?? []) as { id: string; starts_at: string }[];
    if (rounds.length === 0) return { totalVisitors: 0, rounds: [] };

    const ids = rounds.map((r) => r.id);
    const [visitors, grades, scenarioRows, mine] = await Promise.all([
      db.from("dashboard_visitor_stats").select("visitors").maybeSingle(),
      db.from("dashboard_grade_stats").select("round_id, grade, count").in("round_id", ids),
      db
        .from("round_scenarios")
        .select("round_id, scenarios!inner(scenario_steps(id))")
        .in("round_id", ids),
      visitorId
        ? db
            .from("scenario_sessions")
            .select("round_id, grade")
            .eq("visitor_id", visitorId)
            .in("round_id", ids)
            .not("grade", "is", null)
        : Promise.resolve({ data: [] }),
    ]);

    const gradeRows = (grades.data ?? []) as {
      round_id: string;
      grade: number;
      count: number;
    }[];

    // 지문 수와 문항 수는 편성에서 센다 — 응시자 수와 달리 회차의 크기라 공개해도 된다.
    const size = new Map<string, { scenarios: number; steps: number }>();
    for (const row of (scenarioRows.data ?? []) as unknown as {
      round_id: string;
      scenarios: { scenario_steps: unknown[] } | null;
    }[]) {
      const acc = size.get(row.round_id) ?? { scenarios: 0, steps: 0 };
      acc.scenarios += 1;
      acc.steps += row.scenarios?.scenario_steps?.length ?? 0;
      size.set(row.round_id, acc);
    }

    const myGrades = new Map(
      ((mine.data ?? []) as { round_id: string; grade: number }[]).map((r) => [
        r.round_id,
        r.grade,
      ]),
    );

    return {
      totalVisitors: visitors.data?.visitors ?? 0,
      rounds: rounds.map((r) => ({
        roundId: r.id,
        label: label(r.starts_at),
        scenarios: size.get(r.id)?.scenarios ?? 0,
        steps: size.get(r.id)?.steps ?? 0,
        gradeDist: Array.from(
          { length: 9 },
          (_, i) =>
            gradeRows.find((g) => g.round_id === r.id && g.grade === i + 1)
              ?.count ?? 0,
        ),
        myGrade: myGrades.get(r.id) ?? null,
      })),
    };
  } catch {
    // 기록을 못 읽어도 홈은 열려야 한다 — 화면이 이 구획을 통째로 접는다.
    return null;
  }
}
