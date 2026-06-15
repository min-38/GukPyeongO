-- 국평오 테스트: 문제 오류 신고 (#13)
-- Supabase SQL Editor에 붙여넣어 1회 실행하세요.
-- anon 정책 없음 → RLS로 직접 접근 차단. 작성/조회는 서버의 service-role로만 수행.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  reason text not null,
  detail text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists reports_status_created_idx
  on public.reports (status, created_at desc);

alter table public.reports enable row level security;
-- anon 정책 없음 → 모든 anon 접근 차단. service-role만 우회 가능.
