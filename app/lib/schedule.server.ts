import "server-only";

import { unstable_cache } from "next/cache";

import { type ScenarioKind } from "./scenario-admin";
import { getSupabaseAdmin } from "./supabase-admin.server";

// 회차에 편성된 문제 불러오기 (#87, #100).
// 유저는 slug로 시나리오에 직접 가지 않는다 — 편성된 순서대로 이어서 푼다.
// 정답(answer_index)은 여기서도 조회하지 않는다. 채점은 서버가 한다(#83).
//
// 편성 단위는 하루가 아니라 회차다(#100). 회차는 시작 시각부터 마감 시각까지 열려 있다.

// 문제를 풀 수 있는 기간 한 구간.
export interface Round {
  id: string;
  startsAt: string;
  endsAt: string;
}

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

interface RoundRow {
  id: string;
  starts_at: string;
  ends_at: string;
}

const toRound = (r: RoundRow): Round => ({
  id: r.id,
  startsAt: r.starts_at,
  endsAt: r.ends_at,
});

// 지금 진행 중인 회차. 회차 사이 빈 기간이면 null.
// ponytail: DB를 못 읽어도 null이라 "회차 없음"과 구별되지 않는다 — 화면은 둘 다 "준비 중"으로 같다.
// 구별이 필요해지면 오류 채널을 따로 낸다.
// 회차는 일주일에 한 번 바뀐다. 홈과 /today 가 요청마다 이걸 다시 묻고 있어서
// 출시 첫날 유입이 몰리면 여기가 먼저 막힌다. 1분이면 회차 경계가 그만큼 늦게 보일 뿐이고,
// 시작·마감 시각은 분 단위로 잡으므로 사용자가 알아채지 못한다.
const ROUND_CACHE_SEC = 60;

async function readCurrentRound(): Promise<Round | null> {
  try {
    const now = new Date().toISOString();
    const { data } = await getSupabaseAdmin()
      .from("rounds")
      .select("id, starts_at, ends_at")
      // 반개구간 [시작, 마감) — DB의 겹침 방지 제약과 같은 규칙.
      .lte("starts_at", now)
      .gt("ends_at", now)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ? toRound(data as RoundRow) : null;
  } catch {
    return null;
  }
}

// 캐시 키에 지금 시각(분 단위)을 넣는다 — 회차가 넘어가는 순간을 캐시가 붙들고 있으면
// 다음 회차가 열려도 한동안 "준비 중"으로 보인다.
export async function getCurrentRound(): Promise<Round | null> {
  const minute = Math.floor(Date.now() / (ROUND_CACHE_SEC * 1000));
  return unstable_cache(readCurrentRound, ["current-round", String(minute)], {
    revalidate: ROUND_CACHE_SEC,
  })();
}

// 이미 시작한 회차만 id로 찾는다. 다시 보기(#96)가 주소로 회차를 받기 때문에,
// 아직 시작하지 않은 회차의 지문이 새 나가지 않게 여기서 막는다.
export async function getStartedRound(id: string): Promise<Round | null> {
  try {
    const { data } = await getSupabaseAdmin()
      .from("rounds")
      .select("id, starts_at, ends_at")
      .eq("id", id)
      .lte("starts_at", new Date().toISOString())
      .maybeSingle();
    return data ? toRound(data as RoundRow) : null;
  } catch {
    return null;
  }
}

// 이번 회차를 끝낸 사람 수 (#105). 홈에서 "몇 명이 응시했는지"만 보여준다.
// 기록을 못 읽으면 0명으로 둔다 — 홈이 숫자 없이도 성립해야 한다.
export async function getRoundFinishedCount(roundId: string): Promise<number> {
  try {
    const { count } = await getSupabaseAdmin()
      .from("scenario_sessions")
      .select("id", { count: "exact", head: true })
      .eq("round_id", roundId)
      .not("finished_at", "is", null);
    return count ?? 0;
  } catch {
    return 0;
  }
}

// 편성된 지문은 회차가 열린 뒤 거의 바뀌지 않는데 응시자마다 통째로 다시 읽고 있었다.
// 회차별로 캐시한다. 어드민이 편성을 고쳐도 최대 1분 뒤에는 반영된다.
export async function getRoundScenarios(
  roundId: string
): Promise<ScheduledScenario[]> {
  return unstable_cache(
    () => readRoundScenarios(roundId),
    ["round-scenarios", roundId],
    { revalidate: ROUND_CACHE_SEC },
  )();
}

async function readRoundScenarios(
  roundId: string
): Promise<ScheduledScenario[]> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("round_scenarios")
      .select(
        "sort_order, scenarios(slug, kind, payload, status, scenario_steps(step_key, type, prompt, choices, difficulty, points, time_limit_sec, show_up_to, extra))"
      )
      .eq("round_id", roundId)
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
      // 편성해둔 뒤 게시가 내려갔을 수 있다 — 그런 건 내보내지 않는다.
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
