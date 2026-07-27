-- 국평오 테스트: 날짜별 시나리오 편성 (#66)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: supabase/scenarios.sql 을 먼저 실행해 테이블이 있어야 합니다.

-- 유저는 slug로 시나리오에 직접 접근하지 않는다(/news, /email-reply 등은 만들면서 쓰던 테스트 경로다).
-- 실제로는 "그날 편성된 문제들"을 순서대로 푼다. 그 편성을 여기 담는다.
--   (publish_date, scenario_id) 가 키 — 같은 날 같은 시나리오를 두 번 넣을 수 없다.
--   sort_order 는 그날 안에서의 순서.
create table if not exists public.scenario_schedule (
  publish_date date not null,
  scenario_id uuid not null references public.scenarios(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  primary key (publish_date, scenario_id)
);

create index if not exists scenario_schedule_date_idx
  on public.scenario_schedule (publish_date, sort_order);

alter table public.scenario_schedule enable row level security;
-- anon 정책 없음 → RLS로 모든 anon 접근 차단. service-role(서버)만 우회 가능.
