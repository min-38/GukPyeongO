import { NextResponse } from "next/server";

import { isAdmin } from "@/app/lib/admin-session.server";
import { todayKst } from "@/app/lib/schedule.server";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

// 운영 대시보드 지표 (#91).
// 회차 기록(scenario_sessions)을 날짜별로 모아 돌려준다.

const RECENT_DAYS = 14;

export interface DayMetrics {
  date: string;
  started: number;
  finished: number;
  avgScore: number | null;
}

// 많이 틀린 문항. scenario_steps에 이미 쌓이는 누적치를 정답률 낮은 순으로 본다.
export interface HardStep {
  title: string;
  prompt: string;
  attempts: number;
  correctRate: number;
}

export interface DashboardResponse {
  today: DayMetrics & { gradeDist: { grade: number; count: number }[] };
  recent: DayMetrics[];
  hardSteps: HardStep[];
}

interface Row {
  publish_date: string;
  finished_at: string | null;
  score: number | null;
  grade: number | null;
}

function summarize(date: string, rows: Row[]): DayMetrics {
  const finished = rows.filter((r) => r.finished_at !== null);
  const scores = finished
    .map((r) => r.score)
    .filter((s): s is number => s !== null);
  return {
    date,
    started: rows.length,
    finished: finished.length,
    // 완주한 사람만 평균에 넣는다 — 이탈자를 0점으로 세면 평균이 왜곡된다.
    avgScore: scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null,
  };
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const today = todayKst();
  const from = new Date(Date.now() + 9 * 60 * 60 * 1000);
  from.setDate(from.getDate() - (RECENT_DAYS - 1));
  const fromDate = from.toISOString().slice(0, 10);

  const { data, error } = await getSupabaseAdmin()
    .from("scenario_sessions")
    .select("publish_date, finished_at, score, grade")
    .gte("publish_date", fromDate)
    .order("publish_date", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "지표를 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as Row[];
  const byDate = new Map<string, Row[]>();
  for (const row of rows) {
    byDate.set(row.publish_date, [
      ...(byDate.get(row.publish_date) ?? []),
      row,
    ]);
  }

  // 표본이 너무 적으면 정답률이 흔들린다 — 최소 시도 수를 둔다.
  const MIN_ATTEMPTS = 5;
  const { data: stepData } = await getSupabaseAdmin()
    .from("scenario_steps")
    .select("prompt, attempts, correct_count, scenarios(title)")
    .gte("attempts", MIN_ATTEMPTS);

  const hardSteps = (
    (stepData ?? []) as unknown as {
      prompt: string;
      attempts: number;
      correct_count: number;
      scenarios: { title: string } | null;
    }[]
  )
    .map((s) => ({
      title: s.scenarios?.title ?? "",
      prompt: s.prompt,
      attempts: s.attempts,
      correctRate: Math.round((s.correct_count / s.attempts) * 100),
    }))
    .sort((a, b) => a.correctRate - b.correctRate)
    .slice(0, 10);

  const todayRows = byDate.get(today) ?? [];
  const gradeCount = new Map<number, number>();
  for (const r of todayRows) {
    if (r.grade === null) continue;
    gradeCount.set(r.grade, (gradeCount.get(r.grade) ?? 0) + 1);
  }

  const response: DashboardResponse = {
    today: {
      ...summarize(today, todayRows),
      gradeDist: [...gradeCount.entries()]
        .map(([grade, count]) => ({ grade, count }))
        .sort((a, b) => a.grade - b.grade),
    },
    recent: [...byDate.entries()]
      .map(([date, list]) => summarize(date, list))
      .sort((a, b) => b.date.localeCompare(a.date)),
    hardSteps,
  };
  return NextResponse.json(response);
}
