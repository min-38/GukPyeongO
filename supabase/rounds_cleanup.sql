-- 국평오 테스트: 회차 전환 잔여물 정리 (#106)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: rounds_backfill.sql + rounds_cutover.sql 이 끝나 있어야 합니다.
--
-- 전환을 마치고 롤백 여지로 남겨 둔 것들을 지운다.
--  · answer_scenario_step(text, text, int) — 인자 3개짜리 구버전. 지금 코드는 4개짜리만 부른다
--  · scenario_sessions.publish_date        — 회차로 옮기기 전의 날짜 편성 흔적
--  · scenario_schedule                     — 날짜 편성 테이블. round_scenarios 로 옮겨졌다
--
-- 확인과 삭제를 한 블록에 넣는다. 문장이 하나라 실행기가 트랜잭션으로 감싸든 아니든,
-- 또 오류에서 멈추든 계속 가든, 확인에 걸리면 아무것도 지워지지 않는다.
-- (확인을 앞에 따로 두면 "오류에도 계속 가는" 실행기에서 그대로 지워진다 — 실제로 그랬다.)
do $$
declare
  v_orphans int;
  v_left int;
begin
  -- 회차를 못 찾은 시작 기록이 남아 있으면 publish_date 를 지울 수 없다. 그 줄의 소속을 잃는다.
  select count(*) into v_orphans
  from public.scenario_sessions
  where round_id is null;

  if v_orphans > 0 then
    raise exception
      '회차가 비어 있는 시작 기록이 % 줄 남아 있다. publish_date 를 지우면 그 줄이 어느 날 것인지 알 수 없게 된다. rounds_backfill.sql 을 먼저 다시 돌려라.',
      v_orphans;
  end if;

  -- 옮겨지지 않은 편성이 있으면 scenario_schedule 을 지울 수 없다.
  if to_regclass('public.scenario_schedule') is not null then
    execute $q$
      select count(*)
      from public.scenario_schedule s
      where not exists (
        select 1
        from public.round_scenarios rs
        join public.rounds r on r.id = rs.round_id
        where rs.scenario_id = s.scenario_id
          and r.starts_at = (s.publish_date::timestamp at time zone 'Asia/Seoul')
      )
    $q$ into v_left;

    if v_left > 0 then
      raise exception
        'round_scenarios 로 옮겨지지 않은 편성이 % 줄 있다. rounds_backfill.sql 을 먼저 다시 돌려라.',
        v_left;
    end if;
  end if;

  -- 여기까지 왔으면 지워도 된다.
  execute 'drop function if exists public.answer_scenario_step(text, text, int)';
  -- 컬럼을 지우면 거기 걸린 옛 유니크 제약(publish_date, visitor_id)도 함께 사라진다.
  execute 'alter table public.scenario_sessions drop column if exists publish_date';
  execute 'drop table if exists public.scenario_schedule';
end $$;
