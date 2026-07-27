-- 국평오 테스트: 회차 응시 기록에 득점률 컬럼 (#95)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: scenario_sessions.sql 을 먼저 실행해 테이블이 있어야 합니다.

-- 결과 화면이 "상위 몇 %"를 보여주려면 응시자끼리 점수를 견줘야 한다.
-- 그런데 하루 만점(max_score)은 편성에 따라 달라지므로 score 를 그대로 비교하면 날짜가 섞일 때 틀린다.
-- 등급컷(GRADE_CUTS)도 득점률 기준이라, 비교 축을 득점률로 맞춘다.
--
-- 저장 컬럼으로 둔 이유: 상위 % 는 "나보다 높은 사람 수 / 전체"라 count 쿼리 두 번이면 끝나는데,
-- 계산식을 쿼리에 넣으면 그 비교를 서버가 못 하고 전 행을 끌어와야 한다.
alter table public.scenario_sessions
  add column if not exists percent numeric
  generated always as (
    case when max_score > 0 then score * 100.0 / max_score end
  ) stored;

create index if not exists scenario_sessions_percent_idx
  on public.scenario_sessions (percent);
