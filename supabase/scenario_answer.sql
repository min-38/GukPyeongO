-- 국평오 테스트: 시나리오 문항 채점 (#83)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: supabase/scenarios.sql 을 먼저 실행해 테이블이 있어야 합니다.

-- 정답을 클라이언트로 내려보내지 않기 위해 채점을 서버가 한다.
-- 같은 자리에서 문항별 시도/정답 수도 올린다 — 채점과 집계가 갈라지면 수가 어긋난다.
-- p_choice 가 null 이면 무응답(시간 초과)이다. 시도로는 세되 정답으로는 세지 않는다.
create or replace function public.answer_scenario_step(
  p_slug text,
  p_step_key text,
  p_choice int
)
returns table (answer_index int, is_correct boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_answer int;
begin
  select st.answer_index into v_answer
  from public.scenario_steps st
  join public.scenarios s on s.id = st.scenario_id
  where s.slug = p_slug
    and s.status = 'published'
    and st.step_key = p_step_key;

  if v_answer is null then
    return; -- 없는 문항 — 호출 측이 빈 결과를 보고 판단한다
  end if;

  update public.scenario_steps st
  set attempts = st.attempts + 1,
      correct_count = st.correct_count + case when p_choice = v_answer then 1 else 0 end
  from public.scenarios s
  where s.id = st.scenario_id
    and s.slug = p_slug
    and st.step_key = p_step_key;

  answer_index := v_answer;
  is_correct := (p_choice is not null and p_choice = v_answer);
  return next;
end;
$$;

revoke all on function public.answer_scenario_step(text, text, int) from public;
revoke all on function public.answer_scenario_step(text, text, int) from anon;
revoke all on function public.answer_scenario_step(text, text, int) from authenticated;
