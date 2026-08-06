-- 국평오 테스트: 답안에 회차를 적는다
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: scenario_step_answers.sql + rounds.sql 이 실행되어 있어야 합니다.
--
-- 왜 필요한가.
--  · "이번 회차 3번 문항에서 몇 명이 남았나"를 낼 방법이 없다. 답안에 회차가 없어서다.
--    지금 이탈 곡선은 scenario_steps.attempts(회차 무관 누적)를 역산해 겨우 봤다.
--    회차가 둘이 되는 순간 그 역산은 죽는다.
--
-- 이 스크립트는 컬럼을 더하기만 한다. 키(visitor_id, step_id)는 그대로 둔다 —
-- 키를 바꾸면 채점(/api/today-grade)이 회차로 걸러야 해서 코드 배포가 따라붙는다.
-- 회차가 열려 있는 동안에는 스키마와 코드를 같이 갈지 않는다.
-- 키 교체는 회차 마감 뒤 조용한 때에 별도 스크립트로 한다.

-- 기본값 없는 nullable 컬럼 — 테이블을 다시 쓰지 않아 즉시 끝난다.
alter table public.scenario_step_answers
  add column if not exists round_id uuid references public.rounds(id) on delete set null;

-- 이탈 곡선이 읽을 축.
create index if not exists scenario_step_answers_round_idx
  on public.scenario_step_answers (round_id, step_id);

-- ── 기존 행 채우기 ────────────────────────────────────────────────────
-- 1) 그 방문자가 답하기 전에 시작한 회차 중 가장 최근 것. 이게 정석이다.
update public.scenario_step_answers a
set round_id = (
  select s.round_id
  from public.scenario_sessions s
  where s.visitor_id = a.visitor_id
    and s.round_id is not null
    and s.started_at <= a.answered_at
  order by s.started_at desc
  limit 1
)
where a.round_id is null;

-- 2) 시작 기록이 없는 행. 시작 기록은 fire-and-forget이라 실패했을 수 있다.
--    답한 시각이 어느 회차 기간 안이었는지로 되짚는다.
update public.scenario_step_answers a
set round_id = r.id
from public.scenario_steps st
join public.round_scenarios rs on rs.scenario_id = st.scenario_id
join public.rounds r on r.id = rs.round_id
where a.round_id is null
  and st.id = a.step_id
  and a.answered_at >= r.starts_at
  and a.answered_at < r.ends_at;

-- ── 채점 함수: 새 행에 회차를 적는다 ──────────────────────────────────
-- 인자는 그대로 4개다. 이미 떠 있는 코드가 그대로 호출한다 — 배포가 필요 없다.
-- 회차를 못 찾으면 null 로 넣고 답은 그대로 받는다. 지표 하나 때문에 문제 풀이를 막지 않는다.
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
  v_scenario_id uuid;
  v_answer int;
  v_correct boolean;
  v_round uuid;
  v_inserted int;
begin
  select st.id, st.scenario_id, st.answer_index
    into v_step_id, v_scenario_id, v_answer
  from public.scenario_steps st
  join public.scenarios s on s.id = st.scenario_id
  where s.slug = p_slug
    and s.status = 'published'
    and st.step_key = p_step_key;

  if v_step_id is null then
    return; -- 없는 문항 — 호출 측이 빈 결과를 보고 판단한다
  end if;

  v_correct := (p_choice is not null and p_choice = v_answer);

  -- 이 사람이 지금 풀고 있는 회차. 시작 기록이 곧 그 답이다.
  select s.round_id into v_round
  from public.scenario_sessions s
  where s.visitor_id = p_visitor
    and s.round_id is not null
  order by s.started_at desc
  limit 1;

  -- 시작 기록이 실패했으면 지금 열려 있는 회차로 본다.
  if v_round is null then
    select r.id into v_round
    from public.rounds r
    join public.round_scenarios rs on rs.round_id = r.id
    where rs.scenario_id = v_scenario_id
      and now() >= r.starts_at
      and now() < r.ends_at
    limit 1;
  end if;

  insert into public.scenario_step_answers (visitor_id, step_id, choice_index, is_correct, round_id)
  values (p_visitor, v_step_id, p_choice, v_correct, v_round)
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
