-- 국평오 테스트: 시작과 첫 문항 사이를 계측한다 (#105)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: scenario_sessions.sql + rounds.sql
--
-- 첫 회차에서 시작 101명 중 첫 문항에 답한 사람이 80명이었다. 21명이 문제를 하나도
-- 풀지 않고 나갔는데, 어디서 나갔는지 알 방법이 없다 — 시작과 완주 두 점밖에 없어서다.
--
-- 시작하기를 누른 뒤 첫 답까지 거치는 화면은 둘이다: 유형별 튜토리얼, 그리고 지문 전문.
-- 지문 화면에 들어간 시각을 한 번만 남기면 두 구간이 갈린다.
--  · 유형 튜토리얼에서 나갔다 → 시작 누르고 또 설명이 나오는 게 문제
--  · 지문 읽다 나갔다 → 첫 지문이 무거운 게 문제
-- 할 일이 정반대라 이 하나를 가르는 것만으로 값이 있다.
alter table public.scenario_sessions
  add column if not exists first_reading_at timestamptz;

-- 회차별 지표에 지문 진입을 더한다. 시작 → 지문 진입 → 완주 세 점이 나란히 선다.
create or replace view public.dashboard_round_stats as
select
  r.id                                as round_id,
  r.starts_at,
  r.ends_at,
  count(s.id)                         as started,
  count(s.finished_at)                as finished,
  round(avg(s.score) filter (where s.finished_at is not null))::int as avg_score,
  round(avg(extract(epoch from (s.finished_at - s.started_at)))
        filter (where s.finished_at is not null))::int              as avg_seconds,
  -- 새 열은 맨 뒤에 붙인다 — create or replace view 는 중간 삽입을 거부한다.
  count(s.first_reading_at)           as reading
from public.rounds r
left join public.scenario_sessions s on s.round_id = r.id
group by r.id, r.starts_at, r.ends_at;
