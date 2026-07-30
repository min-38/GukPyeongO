-- 국평오 테스트: 회차 편성 저장을 한 트랜잭션으로 (운영 전 점검)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: supabase/rounds.sql 을 먼저 실행.
--
-- 편성 저장은 "이 회차 편성을 통째로 갈아끼운다"는 한 번의 뜻인데,
-- 여태 지우기와 넣기를 따로 두 번 던졌다. 넣기가 실패하면(없는 시나리오 등)
-- 지운 것만 남아 그 회차가 빈 채로 살아 있게 된다 —
-- 진행 중인 회차였다면 그 순간부터 /today 가 "준비 중"이 된다.
--
-- 함수 하나가 곧 트랜잭션 하나다. 중간에 실패하면 지운 것까지 함께 되돌아간다.
create or replace function public.set_round_scenarios(
  p_round uuid,
  p_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.round_scenarios where round_id = p_round;

  -- 빈 편성(편성 해제)도 뜻이 있는 저장이라 그대로 둔다.
  if array_length(p_ids, 1) is not null then
    -- with ordinality 로 넘어온 차례가 그대로 푸는 차례가 된다.
    insert into public.round_scenarios (round_id, scenario_id, sort_order)
    select p_round, t.id, t.ord
    from unnest(p_ids) with ordinality as t(id, ord);
  end if;
end;
$$;

revoke all on function public.set_round_scenarios(uuid, uuid[]) from public;
revoke all on function public.set_round_scenarios(uuid, uuid[]) from anon;
revoke all on function public.set_round_scenarios(uuid, uuid[]) from authenticated;
