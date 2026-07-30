-- 국평오 테스트: 회차 전환 마무리 (#100)
-- 실행 전제: rounds.sql + rounds_backfill.sql 을 먼저 실행.
-- **코드 배포 직전**에 실행한다. 구버전 코드가 돌고 있는 동안에도 안전하다 —
-- 옛 unique (publish_date, visitor_id) 는 그대로 있고, 새 코드가 쓰는 행은
-- publish_date 가 NULL 이라 그 제약에 걸리지 않는다(NULL 은 서로 충돌하지 않는다).

alter table public.scenario_sessions alter column publish_date drop not null;

alter table public.scenario_sessions
  drop constraint if exists scenario_sessions_round_visitor_key;
alter table public.scenario_sessions
  add constraint scenario_sessions_round_visitor_key unique (round_id, visitor_id);

-- 옛 컬럼(publish_date)과 scenario_schedule 테이블은 여기서 지우지 않는다.
-- 며칠 지켜본 뒤 별도로 정리한다 — 롤백 여지를 남겨 둔다.
