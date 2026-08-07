-- 국평오 테스트: 회차 평가 (#112)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: rounds.sql, scenario_sessions.sql
--
-- 문항 평가(step_ratings)와 묻는 것이 다르다.
--  · 문항 평가 — "이 문제가 좋았나"
--  · 회차 평가 — "이번 주 회차가 어땠나". 난이도·분량·재미처럼 회차 전체에 걸린 것
--
-- 자리도 다르다. 문항 평가는 문제 다시 보기 안쪽 시트에 있어서 첫 회차에 0건이었다
-- (같은 시트의 항의는 4건 들어왔다 — 사람이 없어서가 아니라 자리가 없어서다).
-- 회차 평가는 결과 화면 본문, 채점을 막 본 자리에 둔다.
--
-- visitor_id 는 브라우저에 심는 익명 값이다(scenario_sessions 와 같은 값).
-- (round_id, visitor_id) 유니크 — 같은 사람이 다시 매기면 덮어쓴다.
create table if not exists public.round_ratings (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  visitor_id text not null,
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (round_id, visitor_id)
);

create index if not exists round_ratings_round_idx
  on public.round_ratings (round_id, created_at desc);

alter table public.round_ratings enable row level security;
-- anon 정책 없음 → service-role(서버)만 기록·조회한다.

-- 어드민이 회차별로 한 줄씩 본다. 별점 평균과 개수, 남긴 말은 따로 읽는다.
create or replace view public.dashboard_round_ratings as
select
  r.id                                   as round_id,
  r.starts_at,
  r.ends_at,
  count(rr.id)::int                      as count,
  round(avg(rr.stars), 1)                as average,
  count(rr.comment)::int                 as comment_count
from public.rounds r
join public.round_ratings rr on rr.round_id = r.id
group by r.id, r.starts_at, r.ends_at;
