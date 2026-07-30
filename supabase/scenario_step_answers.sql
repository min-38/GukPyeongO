-- 국평오 테스트: 방문자별 문항 답안 기록 (운영 전 보안 점검)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: supabase/scenarios.sql + supabase/scenario_answer.sql 을 먼저 실행.
--
-- 왜 만드는가.
--  · 지금까지 회차 채점(/api/today-grade)은 클라이언트가 보낸 답을 그대로 믿었다.
--    그래서 /api/scenario-answer 로 정답만 먼저 긁어낸 뒤 그 답을 제출하면 1등급이 나왔다.
--  · 시도/정답 집계도 호출 횟수만큼 올라가서, 같은 문항을 반복 호출하면
--    "전국 N%가 여기서 낚였습니다" 수치를 임의로 만들 수 있었다.
--
-- 두 구멍의 뿌리는 같다 — "누가 무엇을 골랐는지"를 서버가 남기지 않았다.
-- 방문자별로 문항당 한 줄만 남기고, 그 줄을 채점과 집계의 유일한 근거로 삼는다.
-- 정답을 미리 긁어도 그 순간 첫 선택이 확정되므로 나중에 답을 바꿔 낼 수 없다.
create table if not exists public.scenario_step_answers (
  visitor_id text not null,
  step_id uuid not null references public.scenario_steps(id) on delete cascade,
  choice_index int,  -- null = 무응답(시간 초과)
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (visitor_id, step_id)
);

-- 채점이 회차에 편성된 문항들을 방문자 기준으로 한 번에 읽는다.
create index if not exists scenario_step_answers_visitor_idx
  on public.scenario_step_answers (visitor_id);

alter table public.scenario_step_answers enable row level security;
-- anon 정책 없음 → service-role(서버)만 기록·조회한다.

-- 보관 방침: visitor_id 는 개인을 특정하지 않는 익명 쿠키값이다(scenario_sessions 와 같은 결).
-- 지울 이유가 생기면 answered_at 기준으로 잘라낸다.

-- ── 채점 함수 교체 ────────────────────────────────────────────────────
-- 달라진 점.
--  1) p_visitor 를 받아 답안을 한 줄 남긴다.
--  2) 시도/정답 집계는 그 줄이 "새로 생겼을 때만" 올린다 → 반복 호출로 수치를 부풀릴 수 없다.
--  3) 정답 공개(answer_index)는 반복 호출에도 그대로 돌려준다 —
--     연출 도중 새로고침해도 화면이 깨지지 않아야 하고, 어차피 선택은 이미 확정됐다.
--
-- ponytail: 키가 (visitor_id, step_id)라 같은 시나리오를 다른 회차에 다시 편성하면
-- 지난 회차의 선택이 그대로 남는다. 회차마다 새 문항을 올리는 운영이라 지금은 문제가 없다.
-- 재편성을 실제로 쓰게 되면 키에 round_id 를 넣는다.
--
-- **실행 순서**: 이 스크립트를 먼저 돌리고 그 다음에 코드를 배포한다.
-- 인자가 3개인 옛 함수는 여기서 지우지 않는다 — 지우면 아직 돌고 있는 구버전 코드의
-- 문항 채점이 통째로 멈춘다. 새 함수는 인자가 4개라 이름이 겹쳐도 따로 산다.
-- 배포가 끝나고 며칠 지켜본 뒤 아래 한 줄로 정리한다:
--   drop function if exists public.answer_scenario_step(text, text, int);
create or replace function public.answer_scenario_step(
  p_slug text,
  p_step_key text,
  p_choice int,
  p_visitor text
)
returns table (answer_index int, is_correct boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_step_id uuid;
  v_answer int;
  v_correct boolean;
  v_inserted int;
begin
  select st.id, st.answer_index into v_step_id, v_answer
  from public.scenario_steps st
  join public.scenarios s on s.id = st.scenario_id
  where s.slug = p_slug
    and s.status = 'published'
    and st.step_key = p_step_key;

  if v_step_id is null then
    return; -- 없는 문항 — 호출 측이 빈 결과를 보고 판단한다
  end if;

  v_correct := (p_choice is not null and p_choice = v_answer);

  insert into public.scenario_step_answers (visitor_id, step_id, choice_index, is_correct)
  values (p_visitor, v_step_id, p_choice, v_correct)
  on conflict (visitor_id, step_id) do nothing;

  get diagnostics v_inserted = row_count;

  -- 처음 답한 경우에만 집계에 반영한다.
  if v_inserted > 0 then
    update public.scenario_steps st
    set attempts = st.attempts + 1,
        correct_count = st.correct_count + case when v_correct then 1 else 0 end
    where st.id = v_step_id;
  end if;

  answer_index := v_answer;
  is_correct := v_correct;
  return next;
end;
$$;

revoke all on function public.answer_scenario_step(text, text, int, text) from public;
revoke all on function public.answer_scenario_step(text, text, int, text) from anon;
revoke all on function public.answer_scenario_step(text, text, int, text) from authenticated;
