-- 국평오 테스트: 문항 배점을 직접 숫자로 (#99)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: scenarios.sql 을 먼저 실행해 테이블이 있어야 합니다.

-- 지금까지는 난이도(1·2·3)를 배점(1·3·8점)으로 바꿔 썼다.
-- 그런데 하루 만점을 100점에 맞추려면 그 세 값만으로는 조합이 안 나오고,
-- "이 문항은 6점" 같은 판단도 못 담는다. 배점을 문항이 직접 갖게 한다.
-- 난이도는 남겨둔다 — 배점과 뜻이 다르다(쉬운데 배점이 큰 문항도 있다).
alter table public.scenario_steps
  add column if not exists points int;

-- 기존 문항은 쓰던 환산표 그대로 채운다.
update public.scenario_steps
set points = case difficulty when 1 then 1 when 3 then 8 else 3 end
where points is null;

alter table public.scenario_steps
  alter column points set default 3;

-- 0점짜리 문항은 낼 이유가 없고, 한 문항이 하루 만점을 넘길 수도 없다.
do $$
begin
  alter table public.scenario_steps
    add constraint scenario_steps_points_range check (points between 1 and 100);
exception
  when duplicate_object then null;
end $$;
