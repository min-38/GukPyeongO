-- 국평오 테스트: 패치노트 (#41)
-- Supabase SQL Editor에 붙여넣어 1회 실행하세요.
-- anon 정책 없음 → RLS로 직접 접근 차단. 작성/조회는 서버의 service-role로만 수행.
-- (공개 /patch 페이지도 service-role 서버 조회로 노출하므로 anon 정책이 필요 없다.)

create table if not exists public.patch_notes (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  type text not null check (type in ('new', 'fix', 'improve')),
  content text not null,
  patched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists patch_notes_patched_at_idx
  on public.patch_notes (patched_at desc);

alter table public.patch_notes enable row level security;
-- anon 정책 없음 → 모든 anon 접근 차단. service-role만 우회 가능.
