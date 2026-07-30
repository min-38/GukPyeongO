-- 국평오 테스트: 기존 날짜 편성을 회차로 옮긴다 (#100)
-- 실행 전제: supabase/rounds.sql 을 먼저 실행. 여러 번 실행해도 안전하다.
--
-- 기존 편성 하루를 KST 자정~자정 회차로 만든다. 그래서 전환 당일 동작이 지금과 똑같다.
-- 첫 실제 일주일 회차는 옮긴 뒤에 어드민에서 새로 만든다.

-- 1) 편성된 날짜 → 회차
--    exclude 제약이 걸린 표에서도 ON CONFLICT DO NOTHING 은 동작한다(DO UPDATE 는 안 된다).
insert into public.rounds (starts_at, ends_at)
select distinct
  (publish_date::timestamp at time zone 'Asia/Seoul'),
  ((publish_date + 1)::timestamp at time zone 'Asia/Seoul')
from public.scenario_schedule
on conflict do nothing;

-- 2) 편성 행
insert into public.round_scenarios (round_id, scenario_id, sort_order)
select r.id, s.scenario_id, s.sort_order
from public.scenario_schedule s
join public.rounds r
  on r.starts_at = (s.publish_date::timestamp at time zone 'Asia/Seoul')
on conflict (round_id, scenario_id) do nothing;

-- 3) 응시 기록. 편성이 없던 날의 기록은 걸릴 회차가 없어 null 로 남는다.
update public.scenario_sessions ss
   set round_id = r.id
  from public.rounds r
 where ss.round_id is null
   and ss.publish_date = (r.starts_at at time zone 'Asia/Seoul')::date;

-- 4) 댓글은 작성 시각이 들어가는 회차로. 어디에도 안 걸리면 null(= 공개 목록에 안 보임).
update public.comments c
   set round_id = r.id
  from public.rounds r
 where c.round_id is null
   and c.created_at >= r.starts_at
   and c.created_at < r.ends_at;

-- 확인용 (실행 후 눈으로 대조)
-- select (select count(*) from public.scenario_schedule) as old_rows,
--        (select count(*) from public.round_scenarios) as new_rows;
-- select count(*) from public.scenario_sessions where round_id is null;
-- select id, starts_at at time zone 'Asia/Seoul', ends_at at time zone 'Asia/Seoul'
--   from public.rounds order by starts_at desc limit 5;
