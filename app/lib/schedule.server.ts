import "server-only";

import { type ScenarioKind } from "./scenario-admin";
import { getSupabaseAdmin } from "./supabase-admin.server";

// 그날 편성된 문제 불러오기 (#87).
// 유저는 slug로 시나리오에 직접 가지 않는다 — 편성된 순서대로 이어서 푼다.
// 정답(answer_index)은 여기서도 조회하지 않는다. 채점은 서버가 한다(#83).

// 한 회차에서 유저가 푸는 시나리오 하나.
export interface ScheduledScenario {
  slug: string;
  kind: ScenarioKind;
  // 표면 컴포넌트가 그대로 받는 모양({...지문, steps}).
  content: Record<string, unknown>;
}

interface StepRow {
  step_key: string;
  type: string;
  prompt: string;
  choices: string[];
  difficulty: number;
  points: number | null;
  time_limit_sec: number;
  show_up_to: number | null;
  extra: Record<string, unknown> | null;
}

interface Row {
  sort_order: number;
  scenarios: {
    slug: string;
    kind: string;
    payload: Record<string, unknown>;
    status: string;
    scenario_steps: StepRow[];
  } | null;
}

function toStep(row: StepRow) {
  return {
    id: row.step_key,
    type: row.type,
    prompt: row.prompt,
    choices: row.choices,
    difficulty: row.difficulty,
    ...(row.points === null ? {} : { points: row.points }),
    timeLimitSec: row.time_limit_sec,
    ...(row.show_up_to === null ? {} : { showUpTo: row.show_up_to }),
    ...(row.extra ?? {}),
  };
}

// 오늘 날짜(KST). 서버가 UTC로 돌아도 하루가 어긋나지 않게 오프셋을 더해 계산한다.
export function todayKst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function getScheduledScenarios(
  date: string
): Promise<ScheduledScenario[]> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("scenario_schedule")
      .select(
        "sort_order, scenarios(slug, kind, payload, status, scenario_steps(step_key, type, prompt, choices, difficulty, points, time_limit_sec, show_up_to, extra))"
      )
      .eq("publish_date", date)
      .order("sort_order", { ascending: true })
      // 문항 순서까지 정해줘야 한다. 안 정하면 DB가 돌려주는 대로라 출제 순서가 뒤섞인다 —
      // 메신저는 대화가 이어지는 유형이라 날짜가 거꾸로 가버린다.
      .order("sort_order", {
        referencedTable: "scenarios.scenario_steps",
        ascending: true,
      });

    if (error || !data) return [];

    return (data as unknown as Row[])
      .map((row) => row.scenarios)
      // 편성해둔 뒤 게시가 내려갔을 수 있다 — 그런 건 오늘 내보내지 않는다.
      .filter((s) => s !== null && s.status === "published")
      .map((s) => ({
        slug: s!.slug,
        kind: s!.kind as ScenarioKind,
        content: {
          ...s!.payload,
          steps: [...(s!.scenario_steps ?? [])].map(toStep),
        },
      }))
      // 문항이 없는 시나리오는 화면이 깨진다.
      .filter((s) => (s.content.steps as unknown[]).length > 0);
  } catch {
    // DB 미설정 등 — 편성 없음으로 취급한다.
    return [];
  }
}
