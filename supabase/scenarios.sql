-- 국평오 테스트: 시나리오 저장 모델 (#74)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 지금까지 app/lib/mock-*.ts 에 하드코딩돼 있던 시나리오(메신저·커뮤니티·공지·신문·메일·서사)를
-- 어드민에서 출제/수정할 수 있게 하기 위한 선행 작업입니다.
-- 기존 questions 테이블은 건드리지 않습니다. v1 자산과 공존합니다.

-- 채택안: "지문 1개 + 문항 N개" 2테이블 (#74 안 A)
-- steps를 jsonb로 넣지 않는 이유는 문항별 정답률(attempts/correct_count) 집계를 살리기 위함.
-- ("전국 82%가 여기서 낚였습니다" 소셜 리빌이 문항 단위 통계를 전제로 한다)

-- ── 지문 ──────────────────────────────────────────────────────────────
-- slug    : 라우트 키(news, notice, community, email, email-reply, story).
--           #74 컬럼안에는 없지만, 라우트가 특정 시나리오를 집어올 키가 필요해 추가했다.
-- kind    : 렌더링 표면 종류. 어떤 컴포넌트로 그릴지 결정한다.
-- payload : 유형별 지문 구조(문항 제외). 정본은 아래 TS 타입이다.
--   doc       → app/lib/doc-scenario.ts      DocScenario   { sourceLabel, doc{source,title,body[]} }
--   community → app/lib/mock-community.ts    CommunityScenario { boardName, post{...}, comments[] }
--   email     → app/lib/email-scenario.ts    EmailScenario { sourceLabel, subject, layout?, messages[] }
--   story     → app/lib/story-scenario.ts    StoryScenario { sourceLabel, source, title, readSec, body[] }
--   chat      → app/lib/mock-questions.ts    (회사 메신저 — 분기 구조라 어드민 편집은 후순위)
-- source_label : 목록·필터에서 쓰는 표시용 사본(정본은 payload 안의 라벨).
create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null check (kind in ('doc', 'community', 'chat', 'email', 'story')),
  source_label text not null default '',
  payload jsonb not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'held')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.scenarios enable row level security;
-- anon 정책 없음 → RLS로 모든 anon 접근 차단. service-role(서버)만 우회.
-- 앱은 서버 컴포넌트에서 service-role로 읽어 클라이언트에 내려준다.

create index if not exists scenarios_status_idx
  on public.scenarios (status, sort_order);

-- ── 문항 ──────────────────────────────────────────────────────────────
-- step_key    : 기존 mock의 step.id(gist, irony …). 사람이 읽는 식별자라 그대로 보존한다.
-- show_up_to  : 이메일 전용. 이 문항 시점에 몇 번째 메일까지 보이는가(순차 공개).
-- attempts/correct_count : 문항별 정답률 집계용. questions.bump_question_stats 와 같은 결.
create table if not exists public.scenario_steps (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.scenarios(id) on delete cascade,
  step_key text not null,
  type text not null,
  prompt text not null,
  choices jsonb not null,
  answer_index int not null,
  difficulty int not null default 2 check (difficulty between 1 and 3),
  time_limit_sec int not null default 30,
  show_up_to int,
  sort_order int not null default 0,
  attempts int not null default 0,
  correct_count int not null default 0,
  created_at timestamptz not null default now(),
  unique (scenario_id, step_key)
);

alter table public.scenario_steps enable row level security;
-- anon 정책 없음 → service-role만.

create index if not exists scenario_steps_scenario_idx
  on public.scenario_steps (scenario_id, sort_order);

-- ── 변경 로그 ─────────────────────────────────────────────────────────
-- question_audit 재사용을 검토했으나 컬럼이 question_id 고정이고 엔티티 구분자가 없어,
-- 두 이력이 한 테이블에 섞이면 어드민 감사 탭이 뒤엉킨다. 같은 모양의 별도 테이블로 둔다.
-- scenario_id는 FK로 묶지 않는다(시나리오 삭제 후에도 로그/스냅샷을 보존하기 위함).
create table if not exists public.scenario_audit (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('create', 'update', 'delete')),
  scenario_id uuid,
  snapshot jsonb,
  created_at timestamptz not null default now()
);

create index if not exists scenario_audit_created_idx
  on public.scenario_audit (created_at desc);

alter table public.scenario_audit enable row level security;
-- anon 정책 없음 → service-role만 기록/조회.
