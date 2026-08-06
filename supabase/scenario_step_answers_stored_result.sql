-- 국평오 테스트: 이미 답한 문항은 저장된 첫 선택으로 응답한다 (#104)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: scenario_step_answers_round_key.sql (#102)
--
-- 왜 필요한가.
--  · 문항 하나에는 첫 선택만 인정한다(on conflict do nothing). 정답을 미리 긁어낸 뒤
--    답을 바꿔 내는 길을 막는 장치다.
--  · 그런데 돌려주는 is_correct 는 방금 보낸 선택으로 계산했다. 저장은 첫 선택만 되는데
--    응답은 새 선택을 따르니 둘이 어긋난다 —
--    2번(오답)을 낸 뒤 새로고침하고 1번을 내면 화면은 "정답"이라 하고 채점은 0점을 준다.
--  · 점수는 안전했다. 채점은 저장된 첫 선택만 읽는다. 어긋난 것은 화면뿐이다.
--    다만 그 사람에게는 "맞았는데 왜 점수가 없냐"가 되고 그대로 항의로 들어온다.
--
-- 달라진 곳은 else 가지 하나다. 정답 공개(answer_index)는 지금처럼 반복 호출에도 그대로
-- 내보낸다 — 연출 도중 새로고침해도 화면이 깨지지 않아야 한다.
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

  if v_inserted > 0 then
    -- 처음 답한 경우에만 집계에 반영한다.
    update public.scenario_steps st
    set attempts = st.attempts + 1,
        correct_count = st.correct_count + case when v_correct then 1 else 0 end
    where st.id = v_step_id;
  else
    -- 이미 답한 문항이다. 저장된 첫 선택이 진실이므로 그 판정을 돌려준다(#104).
    -- 회차 밖 답안은 round_id 가 null 이라 is not distinct from 으로 견준다.
    select a.is_correct into v_correct
    from public.scenario_step_answers a
    where a.visitor_id = p_visitor
      and a.step_id = v_step_id
      and a.round_id is not distinct from v_round;
  end if;

  answer_index := v_answer;
  is_correct := v_correct;
  return next;
end;
$$;

revoke all on function public.answer_scenario_step(text, text, int, text) from public;
revoke all on function public.answer_scenario_step(text, text, int, text) from anon;
revoke all on function public.answer_scenario_step(text, text, int, text) from authenticated;
