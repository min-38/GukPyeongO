-- 국평오 테스트: 분류·난이도 정답률을 답안에서 회차별로 낸다 (#108)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: scenario_step_answers_round.sql (#99) — 답안에 round_id 가 있어야 합니다.
--
-- 지금까지 이 두 뷰는 scenario_steps 의 누적 카운터를 더했다. 카운터는 회차를 구분하지 못해서
-- 회차가 쌓일수록 지난 회차가 수치를 지배한다 — "이번 회차에 어느 분류가 약했나"를 못 본다.
-- 다음 회차에 낼 문제를 정하려면 이번 회차만 떼어 봐야 한다.
--
-- 답안에는 회차가 적혀 있으니 거기서 직접 센다. 같은 사실을 두 곳에 적지 않게 되는 건 덤이다.
--
-- 새 열(round_id)은 맨 뒤에 붙인다 — create or replace view 는 중간 삽입을 거부한다.

create or replace view public.dashboard_type_stats as
select
  st.type,
  count(*)::int                              as attempts,
  count(*) filter (where a.is_correct)::int  as correct,
  a.round_id
from public.scenario_step_answers a
join public.scenario_steps st on st.id = a.step_id
group by st.type, a.round_id;

create or replace view public.dashboard_difficulty_stats as
select
  st.difficulty,
  count(*)::int                              as attempts,
  count(*) filter (where a.is_correct)::int  as correct,
  a.round_id
from public.scenario_step_answers a
join public.scenario_steps st on st.id = a.step_id
group by st.difficulty, a.round_id;
