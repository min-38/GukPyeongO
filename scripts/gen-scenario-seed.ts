// mock 시나리오 → 시드 SQL 생성 (#74).
// 사용: npx tsx scripts/gen-scenario-seed.ts
// mock을 고친 뒤 다시 돌려서 supabase/scenarios_seed.local.sql 을 갱신한다.
import { writeFileSync } from "node:fs";

import { SCENARIO_SEEDS } from "../app/lib/scenario-registry";

const q = (v: string) => `'${v.replace(/'/g, "''")}'`;
const json = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;
const int = (v: number | undefined) => (v === undefined ? "null" : String(v));

// 지문은 slug로 upsert하고, 문항은 (scenario_id, step_key)로 upsert한다.
// 시드를 다시 돌려도 통계(attempts/correct_count)는 건드리지 않는다.
const blocks = SCENARIO_SEEDS.map((s) => {
  const steps = s.steps
    .map((step, i) => {
      // 공용 칸에 없는 유형별 필드는 extra 로 간다(메신저의 대화·반응).
      const { id, type, prompt, choices, answerIndex, difficulty, timeLimitSec, showUpTo, ...extra } =
        step;
      void id, type, prompt, choices, answerIndex, difficulty, timeLimitSec, showUpTo;
      return (
        `  (${q(s.slug)}, ${q(step.id)}, ${q(step.type)}, ${q(step.prompt)}, ` +
        `${json(step.choices)}, ${step.answerIndex}, ${step.difficulty}, ` +
        `${step.timeLimitSec}, ${int(step.showUpTo)}, ${json(extra)}, ${i + 1})`
      );
    })
    .join(",\n");

  return `-- ${s.slug}
insert into public.scenarios (slug, kind, source_label, payload, status, sort_order) values
  (${q(s.slug)}, ${q(s.kind)}, ${q(s.sourceLabel)}, ${json(s.payload)}, 'published', ${s.sortOrder})
on conflict (slug) do update set
  kind = excluded.kind,
  source_label = excluded.source_label,
  payload = excluded.payload,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.scenario_steps
  (scenario_id, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
-- values 리터럴은 타입 추론이 text로 붙으므로 컬럼 타입을 명시한다.
select s.id, v.step_key, v.type, v.prompt, v.choices::jsonb, v.answer_index::int,
       v.difficulty::int, v.time_limit_sec::int, v.show_up_to::int, v.extra::jsonb, v.sort_order::int
from (values
${steps}
) as v(slug, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
join public.scenarios s on s.slug = v.slug
on conflict (scenario_id, step_key) do update set
  type = excluded.type,
  prompt = excluded.prompt,
  choices = excluded.choices,
  answer_index = excluded.answer_index,
  difficulty = excluded.difficulty,
  time_limit_sec = excluded.time_limit_sec,
  show_up_to = excluded.show_up_to,
  extra = excluded.extra,
  sort_order = excluded.sort_order;
`;
}).join("\n");

const sql = `-- 국평오 테스트: 시나리오 mock → DB 시드 (#74)
-- 자동 생성 파일 — 직접 고치지 말고 scripts/gen-scenario-seed.ts 를 다시 실행하세요.
-- 실행 전제: supabase/scenarios.sql 을 먼저 실행해 테이블이 있어야 합니다.

${blocks}`;

writeFileSync("supabase/scenarios_seed.local.sql", sql);
console.log(
  `시드 ${SCENARIO_SEEDS.length}개(문항 ${SCENARIO_SEEDS.reduce((n, s) => n + s.steps.length, 0)}개) → supabase/scenarios_seed.local.sql`
);
