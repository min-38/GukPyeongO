-- 국평오 테스트: 문항 항의·별점 (#96)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: scenarios.sql → scenario_steps_extra.sql 을 먼저 실행해 문항 테이블이 있어야 합니다.
--
-- v1 신고(reports)는 questions 를 가리킨다. v2 문항은 scenario_steps 라 같은 테이블에 못 담는다.
--
-- 항의와 별점을 나눈 이유:
--   항의 — "이 문제 이상하다"는 제보. 한 사람이 여러 번 낼 수 있고 처리 상태가 붙는다.
--   별점 — "좋은 문제였나"는 평가. 한 사람이 한 문항에 하나, 다시 매기면 덮어쓴다.
-- 한 테이블에 섞으면 처리 상태와 평균 별점이 서로를 오염시킨다.

create table if not exists public.step_reports (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references public.scenario_steps(id) on delete cascade,
  reason text not null,
  detail text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists step_reports_status_created_idx
  on public.step_reports (status, created_at desc);

-- visitor_id 는 브라우저에 심는 익명 값이다(scenario_sessions 와 같은 값).
-- (step_id, visitor_id) 유니크 — 같은 사람이 같은 문항을 여러 번 평가해도 한 줄이다.
create table if not exists public.step_ratings (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references public.scenario_steps(id) on delete cascade,
  visitor_id text not null,
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (step_id, visitor_id)
);

create index if not exists step_ratings_step_idx
  on public.step_ratings (step_id);

alter table public.step_reports enable row level security;
alter table public.step_ratings enable row level security;
-- anon 정책 없음 → service-role(서버)만 기록·조회한다.
