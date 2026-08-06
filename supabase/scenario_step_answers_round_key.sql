-- 국평오 테스트: 답안 키에 회차를 넣는다 (#102)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: scenario_step_answers_round.sql (#99) 이 먼저 실행되어 round_id 가 채워져 있어야 합니다.
--
-- **운영 회차가 마감된 뒤에 실행한다.** 이 스크립트와 코드(/api/today-grade 회차 필터)가
-- 같이 나가야 한다. 회차가 도는 중에 한쪽만 나가면 그 사이 답이 점수에서 빠진다.
--
-- 왜 필요한가.
--  · 키가 (visitor_id, step_id) 라 같은 지문을 다른 회차에 다시 편성하면 지난 회차의 선택이
--    그대로 남는다. insert 가 on conflict do nothing 이라 새 답이 저장되지 않고,
--    시도/정답 집계도 오르지 않는다. 에러 없이 조용히 틀린다.
--  · 게시 문제 11편 중 9편을 첫 회차에 썼다. 재편성은 곧 필연이다.
--
-- round_id 는 계속 NULL 을 허용한다 — /contract·/news 같은 단일 지문 경로는 회차 밖에서 돌고
-- (배포에서는 404, 개발에서만 열림), 회차를 못 찾았다고 문제 풀이를 막을 수는 없다.
-- NULLS NOT DISTINCT 라서 회차 밖 답안은 예전처럼 방문자·문항당 한 줄로 유지된다.
--
-- 주의: NULLS NOT DISTINCT 는 PostgreSQL 15+ 문법이다. 실행 전에 확인한다.
--   select version();
-- 14 이하라면 아래 인덱스를 다음으로 바꾼다.
--   create unique index ... on public.scenario_step_answers
--     (coalesce(round_id, '00000000-0000-0000-0000-000000000000'::uuid), visitor_id, step_id);

-- 기본키는 NOT NULL 을 요구해서 nullable 인 round_id 를 담을 수 없다. 유니크 인덱스로 대신한다.
-- 이 테이블은 서버가 insert/select 만 하고 PostgREST upsert 대상이 아니라 문제되지 않는다.
alter table public.scenario_step_answers
  drop constraint if exists scenario_step_answers_pkey;

create unique index if not exists scenario_step_answers_round_visitor_step_key
  on public.scenario_step_answers (round_id, visitor_id, step_id) nulls not distinct;

-- ── 채점 함수: 충돌 판정을 새 키로 ────────────────────────────────────
-- 달라진 곳은 on conflict 한 줄뿐이다. 인자는 그대로 4개다.
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
  on conflict (round_id, visitor_id, step_id) do nothing;

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
