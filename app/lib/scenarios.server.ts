import "server-only";

import { getSupabaseAdmin } from "./supabase-admin.server";

// 시나리오 콘텐츠 로더 (#74, #86).
// DB는 지문(scenarios.payload)과 문항(scenario_steps)을 나눠 갖고 있으므로,
// 표면 컴포넌트가 받던 모양({...지문, steps})으로 다시 합쳐서 돌려준다.
// mock 폴백은 없앴다(#86) — DB가 유일한 출처다. 못 불러오면 null을 돌려주고
// 화면이 안내를 띄운다(DB 없이 빌드해도 페이지 생성이 실패하지 않게).

interface StepRow {
  step_key: string;
  type: string;
  prompt: string;
  choices: string[];
  difficulty: number;
  time_limit_sec: number;
  show_up_to: number | null;
  extra: Record<string, unknown> | null;
}

// 정답(answer_index)은 애초에 조회하지 않는다 — 클라이언트 번들에 들어가면 안 된다(#83).
// 정답 공개는 /api/scenario-answer 채점 응답으로 받는다.
function toStep(row: StepRow) {
  return {
    id: row.step_key,
    type: row.type,
    prompt: row.prompt,
    choices: row.choices,
    difficulty: row.difficulty,
    timeLimitSec: row.time_limit_sec,
    // 이메일 전용 필드 — 없는 유형에 빈 값을 남기지 않는다.
    ...(row.show_up_to === null ? {} : { showUpTo: row.show_up_to }),
    // 유형별 추가 필드(메신저의 대화·반응)는 표면이 그대로 읽는다.
    ...(row.extra ?? {}),
  };
}

export async function getScenario<T>(slug: string): Promise<T | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("scenarios")
      .select(
        "payload, scenario_steps(step_key, type, prompt, choices, difficulty, time_limit_sec, show_up_to, extra)"
      )
      .eq("slug", slug)
      .eq("status", "published")
      .order("sort_order", { referencedTable: "scenario_steps" })
      .maybeSingle();

    const steps = (data?.scenario_steps ?? []) as StepRow[];
    if (error || !data || steps.length === 0) return null;

    return {
      ...(data.payload as Record<string, unknown>),
      steps: steps.map(toStep),
    } as T;
  } catch {
    // Supabase 환경 변수 미설정 등 — 화면이 안내를 띄우도록 null.
    return null;
  }
}
