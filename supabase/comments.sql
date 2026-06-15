-- 국평오 테스트: 댓글 테이블 (#8)
-- Supabase SQL Editor에 붙여넣어 1회 실행하세요.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) between 1 and 300),
  grade smallint not null check (grade between 1 and 9),
  nickname text not null default '아무개',
  ip_masked text, -- 마스킹된 IP만 저장(원본 미보관). 작성 시 서버에서 마스킹.
  created_at timestamptz not null default now()
);

-- 같은 등급 댓글방 조회 최적화
create index if not exists comments_grade_created_at_idx
  on public.comments (grade, created_at desc);

alter table public.comments enable row level security;

-- 조회는 anon 공개. 작성/삭제는 서버(service-role)에서만 수행하므로 anon insert/delete 정책은 두지 않는다.
drop policy if exists "comments_select" on public.comments;
create policy "comments_select"
  on public.comments for select
  to anon
  using (true);

-- (구버전에서 만들었다면) anon insert 정책 제거
drop policy if exists "comments_insert" on public.comments;
