-- 국평오 테스트: 문제 변경 로그 (#16)
-- 문제 생성/수정/삭제 이력. Supabase SQL Editor에 붙여넣어 1회 실행하세요.
-- question_id는 FK로 묶지 않는다(문제 삭제 후에도 로그/스냅샷을 보존하기 위함).

create table if not exists public.question_audit (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('create', 'update', 'delete')),
  question_id uuid,
  snapshot jsonb,
  created_at timestamptz not null default now()
);

create index if not exists question_audit_created_idx
  on public.question_audit (created_at desc);

alter table public.question_audit enable row level security;
-- anon 정책 없음 → service-role만 기록/조회.
