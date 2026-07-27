-- 국평오 테스트: 회차 응시 기록 (#91)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)

-- 지금은 문항별 누적 정답률만 쌓여서 "오늘 몇 명이 들어왔는지"를 알 수 없다.
-- 시작과 완료를 따로 남겨야 시작만 하고 이탈한 사람이 보인다.
--
-- visitor_id 는 브라우저에 심는 익명 값이다. 로그인이 없고 개인을 특정할 이유도 없다.
-- (publish_date, visitor_id) 유니크 — 같은 사람이 같은 날 여러 번 눌러도 한 줄이다.
create table if not exists public.scenario_sessions (
  id uuid primary key default gen_random_uuid(),
  publish_date date not null,
  visitor_id text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score int,
  max_score int,
  grade int,
  unique (publish_date, visitor_id)
);

create index if not exists scenario_sessions_date_idx
  on public.scenario_sessions (publish_date);

alter table public.scenario_sessions enable row level security;
-- anon 정책 없음 → service-role(서버)만 기록·조회한다.

-- 보관 방침(#91): 개인을 특정할 값이 없고 한 줄이 작아 무기한 보관한다.
-- 지울 이유가 생기면 publish_date 기준으로 잘라내면 된다.
