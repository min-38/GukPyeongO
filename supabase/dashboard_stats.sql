-- 국평오 테스트: 운영 대시보드 집계 뷰 (#103)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: rounds.sql 까지 실행되어 있어야 합니다.
--
-- 지금까지 대시보드는 행을 전부 끌어와 JS에서 셌다. 응시자가 늘면 그대로 무너진다.
-- 세는 일은 DB에 맡기고 화면은 뷰를 그대로 읽는다.
-- 뷰에는 개인을 특정할 값(visitor_id)을 내보내지 않는다 — 숫자만 나간다.

-- 회차별 응시 지표. 완주 소요는 완주한 사람만 센다(이탈자를 섞으면 뜻이 없다).
create or replace view public.dashboard_round_stats as
select
  r.id                                as round_id,
  r.starts_at,
  r.ends_at,
  count(s.id)                         as started,
  count(s.finished_at)                as finished,
  round(avg(s.score) filter (where s.finished_at is not null))::int as avg_score,
  round(avg(extract(epoch from (s.finished_at - s.started_at)))
        filter (where s.finished_at is not null))::int              as avg_seconds
from public.rounds r
left join public.scenario_sessions s on s.round_id = r.id
group by r.id, r.starts_at, r.ends_at;

-- 회차별 등급 분포.
create or replace view public.dashboard_grade_stats as
select round_id, grade, count(*)::int as count
from public.scenario_sessions
where round_id is not null and grade is not null
group by round_id, grade;

-- 시작 시각의 시간대(KST) 분포. 언제 사람이 몰리는지 본다.
create or replace view public.dashboard_hour_stats as
select
  extract(hour from (started_at at time zone 'Asia/Seoul'))::int as hour,
  count(*)::int as started
from public.scenario_sessions
group by 1;

-- 다시 온 사람. 한 방문자가 회차를 몇 번 풀었는지로 센다.
create or replace view public.dashboard_visitor_stats as
select
  count(*)::int                                  as visitors,
  count(*) filter (where rounds_played > 1)::int  as repeat_visitors
from (
  select visitor_id, count(distinct round_id) as rounds_played
  from public.scenario_sessions
  where round_id is not null
  group by visitor_id
) v;

-- 분류(문항 유형)별 정답률. 어느 근육이 약한지 본다.
create or replace view public.dashboard_type_stats as
select type, sum(attempts)::int as attempts, sum(correct_count)::int as correct
from public.scenario_steps
where attempts > 0
group by type;

-- 난이도 눈금이 실제와 맞는지(캘리브레이션). 3난이도가 정말 더 어려운가.
create or replace view public.dashboard_difficulty_stats as
select difficulty, sum(attempts)::int as attempts, sum(correct_count)::int as correct
from public.scenario_steps
where attempts > 0
group by difficulty;

-- 문항 품질 한 줄 — 정답률에 별점과 미처리 항의를 나란히 붙인다.
-- 이게 있어야 "어려운 문항"과 "잘못된 문항"을 가를 수 있다.
create or replace view public.dashboard_step_quality as
select
  st.id            as step_id,
  sc.title         as scenario_title,
  st.prompt,
  st.type,
  st.difficulty,
  st.attempts,
  st.correct_count,
  round(st.correct_count * 100.0 / nullif(st.attempts, 0))::int as correct_rate,
  (select round(avg(stars), 1) from public.step_ratings ra where ra.step_id = st.id) as avg_stars,
  (select count(*)::int from public.step_ratings ra where ra.step_id = st.id)        as rating_count,
  (select count(*)::int from public.step_reports rp
     where rp.step_id = st.id and rp.status = 'open')                                as open_reports
from public.scenario_steps st
join public.scenarios sc on sc.id = st.scenario_id;

-- 운영 준비도. 앞으로 열릴 회차가 얼마나 남았는지, 아직 안 쓴 문제가 몇 개인지.
create or replace view public.dashboard_readiness as
select
  (select count(*)::int from public.rounds where starts_at > now())            as upcoming_rounds,
  (select max(ends_at) from public.rounds)                                     as last_ends_at,
  (select count(*)::int from public.scenarios
     where status = 'published'
       and id not in (select scenario_id from public.round_scenarios))         as unscheduled_published,
  (select count(*)::int from public.step_reports where status = 'open')        as open_reports;
