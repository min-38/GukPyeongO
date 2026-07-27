import "server-only";

import {
  type AdminScenario,
  type AdminScenarioStep,
  type ScenarioKind,
  type ScenarioStatus,
} from "./scenario-admin";
import { getSupabaseAdmin } from "./supabase-admin.server";

// 어드민용 시나리오 조회 (#66).
// 목록 API와 편집 페이지가 같은 매핑을 쓰도록 여기 모았다.
// 공개 로더(scenarios.server.ts)와 달리 정답·통계까지 그대로 가져온다 — 출제자에게는 필요하다.

export const SCENARIO_COLS =
  "id, slug, kind, title, source_label, payload, status, sort_order";
export const STEP_COLS =
  "id, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order, attempts, correct_count";

interface StepRow {
  id: string;
  step_key: string;
  type: string;
  prompt: string;
  choices: string[];
  answer_index: number;
  difficulty: number;
  time_limit_sec: number;
  show_up_to: number | null;
  extra: Record<string, unknown> | null;
  sort_order: number;
  attempts: number;
  correct_count: number;
}

interface ScenarioRow {
  id: string;
  slug: string;
  kind: string;
  title: string;
  source_label: string;
  payload: Record<string, unknown>;
  status: string;
  sort_order: number;
  scenario_steps?: StepRow[];
}

function toStep(row: StepRow): AdminScenarioStep {
  return {
    id: row.id,
    stepKey: row.step_key,
    type: row.type,
    prompt: row.prompt,
    choices: row.choices,
    answerIndex: row.answer_index,
    difficulty: row.difficulty,
    timeLimitSec: row.time_limit_sec,
    showUpTo: row.show_up_to,
    extra: row.extra ?? {},
    attempts: row.attempts,
    correctCount: row.correct_count,
  };
}

export function toScenario(row: ScenarioRow): AdminScenario {
  const steps = [...(row.scenario_steps ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind as ScenarioKind,
    title: row.title ?? "",
    sourceLabel: row.source_label,
    status: row.status as ScenarioStatus,
    sortOrder: row.sort_order,
    payload: row.payload,
    steps: steps.map(toStep),
  };
}

const SELECT = `${SCENARIO_COLS}, scenario_steps(${STEP_COLS})`;

export async function fetchScenarios(): Promise<AdminScenario[] | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("scenarios")
    .select(SELECT)
    .order("sort_order", { ascending: true });
  if (error) return null;
  return (data ?? []).map((row) => toScenario(row as ScenarioRow));
}

export async function fetchScenario(id: string): Promise<AdminScenario | null> {
  const { data } = await getSupabaseAdmin()
    .from("scenarios")
    .select(SELECT)
    .eq("id", id)
    .single();
  return data ? toScenario(data as ScenarioRow) : null;
}
