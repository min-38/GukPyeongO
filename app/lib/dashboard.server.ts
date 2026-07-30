import "server-only";

import { getSupabaseAdmin } from "./supabase-admin.server";

// 운영 대시보드가 읽는 지표 (#103).
// 세는 일은 DB 뷰(supabase/dashboard_stats.sql)가 한다 — 여기서는 뷰를 읽어 화면 모양으로만 맞춘다.
// 예전에는 행을 전부 끌어와 JS에서 셌다. 응시자가 늘면 그대로 무너지는 방식이었다.

const RECENT_ROUNDS = 12;

export interface RoundMetrics {
  roundId: string;
  label: string; // 회차 시작 일시(KST)
  started: number;
  finished: number;
  avgScore: number | null;
  avgSeconds: number | null;
}

export interface StepQuality {
  stepId: string;
  scenarioTitle: string;
  prompt: string;
  type: string;
  difficulty: number;
  attempts: number;
  correctRate: number;
  avgStars: number | null;
  ratingCount: number;
  openReports: number;
}

export interface RateBucket {
  key: string;
  attempts: number;
  correct: number;
  rate: number;
}

export interface DashboardData {
  // 오래된 회차부터. 그래프의 x축이 시간 순으로 흐르게.
  rounds: RoundMetrics[];
  current: (RoundMetrics & { gradeDist: number[] }) | null;
  hours: { hour: number; started: number }[];
  visitors: { visitors: number; repeatVisitors: number };
  // 분류는 자유 입력이라 수십 개까지 늘어난다 — 낮은 순 10개만 보낸다.
  types: RateBucket[];
  typesTotal: number;
  difficulty: RateBucket[];
  hardSteps: StepQuality[];
  readiness: {
    upcomingRounds: number;
    lastEndsAt: string | null;
    unscheduledPublished: number;
    openReports: number;
  };
}

const label = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const rate = (correct: number, attempts: number) =>
  attempts > 0 ? Math.round((correct / attempts) * 100) : 0;

// 표본이 적으면 정답률이 흔들린다 — 최소 시도 수를 둔다.
const MIN_ATTEMPTS = 5;

// 분류(step.type)는 자유 입력이라 서른 개가 넘는다. 다 그리면 아무것도 안 읽힌다.
const TYPE_LIMIT = 10;

export async function getDashboardData(): Promise<DashboardData | null> {
  try {
    const db = getSupabaseAdmin();
    const [rounds, grades, hours, visitors, types, difficulty, steps, ready] =
      await Promise.all([
        db
          .from("dashboard_round_stats")
          .select("round_id, starts_at, ends_at, started, finished, avg_score, avg_seconds")
          .order("starts_at", { ascending: false })
          .limit(RECENT_ROUNDS),
        db.from("dashboard_grade_stats").select("round_id, grade, count"),
        db.from("dashboard_hour_stats").select("hour, started"),
        db.from("dashboard_visitor_stats").select("visitors, repeat_visitors").maybeSingle(),
        db.from("dashboard_type_stats").select("type, attempts, correct"),
        db.from("dashboard_difficulty_stats").select("difficulty, attempts, correct"),
        db
          .from("dashboard_step_quality")
          .select(
            "step_id, scenario_title, prompt, type, difficulty, attempts, correct_rate, avg_stars, rating_count, open_reports",
          )
          .gte("attempts", MIN_ATTEMPTS)
          .order("correct_rate", { ascending: true })
          .limit(10),
        db
          .from("dashboard_readiness")
          .select("upcoming_rounds, last_ends_at, unscheduled_published, open_reports")
          .maybeSingle(),
      ]);

    const roundRows = (rounds.data ?? []) as {
      round_id: string;
      starts_at: string;
      ends_at: string;
      started: number;
      finished: number;
      avg_score: number | null;
      avg_seconds: number | null;
    }[];

    const toMetrics = (r: (typeof roundRows)[number]): RoundMetrics => ({
      roundId: r.round_id,
      label: label(r.starts_at),
      started: r.started,
      finished: r.finished,
      avgScore: r.avg_score,
      avgSeconds: r.avg_seconds,
    });

    // 진행 중인 회차. 없으면 가장 최근 회차를 그 자리에 세운다 — 빈 기간에 화면이 텅 비지 않게.
    const now = new Date().toISOString();
    const currentRow =
      roundRows.find((r) => r.starts_at <= now && now < r.ends_at) ??
      roundRows[0];

    const gradeRows = (grades.data ?? []) as {
      round_id: string;
      grade: number;
      count: number;
    }[];
    const gradeDist = Array.from({ length: 9 }, (_, i) =>
      currentRow
        ? (gradeRows.find(
            (g) => g.round_id === currentRow.round_id && g.grade === i + 1,
          )?.count ?? 0)
        : 0,
    );

    const hourRows = (hours.data ?? []) as { hour: number; started: number }[];

    return {
      rounds: [...roundRows].reverse().map(toMetrics),
      current: currentRow
        ? { ...toMetrics(currentRow), gradeDist }
        : null,
      // 빈 시간대도 자리를 지켜야 하루의 모양이 보인다.
      hours: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        started: hourRows.find((h) => h.hour === hour)?.started ?? 0,
      })),
      visitors: {
        visitors: visitors.data?.visitors ?? 0,
        repeatVisitors: visitors.data?.repeat_visitors ?? 0,
      },
      types: ((types.data ?? []) as unknown as {
        type: string;
        attempts: number;
        correct: number;
      }[])
        .map((t) => ({
          key: t.type,
          attempts: t.attempts,
          correct: t.correct,
          rate: rate(t.correct, t.attempts),
        }))
        .sort((a, b) => a.rate - b.rate)
        .slice(0, TYPE_LIMIT),
      typesTotal: (types.data ?? []).length,
      difficulty: ((difficulty.data ?? []) as unknown as {
        difficulty: number;
        attempts: number;
        correct: number;
      }[])
        .map((d) => ({
          key: `${d.difficulty}난이도`,
          attempts: d.attempts,
          correct: d.correct,
          rate: rate(d.correct, d.attempts),
        }))
        .sort((a, b) => a.key.localeCompare(b.key)),
      hardSteps: ((steps.data ?? []) as unknown as {
        step_id: string;
        scenario_title: string;
        prompt: string;
        type: string;
        difficulty: number;
        attempts: number;
        correct_rate: number;
        avg_stars: number | null;
        rating_count: number;
        open_reports: number;
      }[]).map((s) => ({
        stepId: s.step_id,
        scenarioTitle: s.scenario_title,
        prompt: s.prompt,
        type: s.type,
        difficulty: s.difficulty,
        attempts: s.attempts,
        correctRate: s.correct_rate,
        avgStars: s.avg_stars,
        ratingCount: s.rating_count,
        openReports: s.open_reports,
      })),
      readiness: {
        upcomingRounds: ready.data?.upcoming_rounds ?? 0,
        lastEndsAt: ready.data?.last_ends_at ?? null,
        unscheduledPublished: ready.data?.unscheduled_published ?? 0,
        openReports: ready.data?.open_reports ?? 0,
      },
    };
  } catch {
    // DB 미설정 등 — 화면이 안내를 띄운다.
    return null;
  }
}
