-- 국평오 테스트: 문항 카운터를 답안에서 다시 계산한다 (#108)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
--
-- scenario_steps.attempts / correct_count 는 답을 받을 때마다 함께 올리는 카운터다.
-- 같은 사실을 답안(scenario_step_answers)과 두 곳에 적는 셈이라 어긋날 수 있고, 실제로 어긋났다 —
-- 첫 회차에서 두 지문이 각각 1씩 모자랐다.
--
-- 진실은 답안 줄이다. 카운터를 거기서 다시 계산해 맞춘다.
-- 필요할 때 손으로 돌린다. 자동으로 돌릴 자리를 만들 만큼 자주 어긋나지 않는다.

-- 먼저 얼마나 어긋났는지 본다(지우지 않는 조회).
select
  st.id,
  st.attempts       as 카운터_시도,
  coalesce(c.n, 0)  as 실제_시도,
  st.correct_count  as 카운터_정답,
  coalesce(c.k, 0)  as 실제_정답
from public.scenario_steps st
left join (
  select step_id, count(*) as n, count(*) filter (where is_correct) as k
  from public.scenario_step_answers
  group by step_id
) c on c.step_id = st.id
where st.attempts <> coalesce(c.n, 0)
   or st.correct_count <> coalesce(c.k, 0);

-- 맞춘다.
update public.scenario_steps st
set attempts      = coalesce(c.n, 0),
    correct_count = coalesce(c.k, 0)
from (
  select step_id, count(*) as n, count(*) filter (where is_correct) as k
  from public.scenario_step_answers
  group by step_id
) c
where c.step_id = st.id
  and (st.attempts <> c.n or st.correct_count <> c.k);

-- 답안이 하나도 없는데 카운터만 남은 문항(문항을 지웠다 되살린 경우 등).
update public.scenario_steps st
set attempts = 0, correct_count = 0
where not exists (
    select 1 from public.scenario_step_answers a where a.step_id = st.id
  )
  and (st.attempts <> 0 or st.correct_count <> 0);
