-- 국평오 테스트: 편성을 회차(round)로 (#100)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: supabase/scenarios.sql, scenario_sessions.sql, comments.sql 이 먼저 있어야 합니다.

-- 편성 단위가 "하루"에서 "회차"로 바뀐다.
-- 회차는 시작 시각부터 마감 시각까지 열려 있고, 주로 일주일이다.
-- 시작 시각이 곧 문제를 풀 수 있게 되는 때고, 마감이 지나면 닫힌다.
create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint rounds_window check (ends_at > starts_at)
);

-- 회차는 겹치지 않는다. 앱에서 검사하지 않고 DB가 막는다 —
-- 겹친 회차가 생기면 "지금 진행 중인 회차"가 둘이 되어 화면이 무엇을 고를지 알 수 없다.
-- '[)' 반개구간이라 앞 회차 마감과 다음 회차 시작이 같은 시각인 것은 겹침이 아니다.
alter table public.rounds drop constraint if exists rounds_no_overlap;
alter table public.rounds add constraint rounds_no_overlap
  exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&);

create index if not exists rounds_starts_at_idx on public.rounds (starts_at desc);

-- 회차에 편성된 시나리오. scenario_schedule 과 같은 모양이다 — 키만 날짜에서 회차로 바뀐다.
create table if not exists public.round_scenarios (
  round_id uuid not null references public.rounds(id) on delete cascade,
  scenario_id uuid not null references public.scenarios(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  primary key (round_id, scenario_id)
);

create index if not exists round_scenarios_round_idx
  on public.round_scenarios (round_id, sort_order);

alter table public.rounds enable row level security;
alter table public.round_scenarios enable row level security;
-- anon 정책 없음 → service-role(서버)만. scenario_schedule 과 같은 방침.

-- 응시 기록도 회차로 묶는다. 편성이 없던 날에도 기록이 쌓였을 수 있어 null 을 허용한다.
-- restrict: 응시자가 있는 회차는 지울 수 없다.
alter table public.scenario_sessions
  add column if not exists round_id uuid references public.rounds(id) on delete restrict;

create index if not exists scenario_sessions_round_idx
  on public.scenario_sessions (round_id);

-- 댓글은 회차에 달린다. 공개 목록은 진행 중인 회차의 것만 보여준다.
-- set null: 회차를 지워도 댓글은 남긴다 — 안 보이게 될 뿐이다.
alter table public.comments
  add column if not exists round_id uuid references public.rounds(id) on delete set null;

create index if not exists comments_round_created_at_idx
  on public.comments (round_id, created_at desc);
