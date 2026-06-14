-- 국평오 테스트: 댓글 테이블 (#8)
-- Supabase SQL Editor에 붙여넣어 1회 실행하세요.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) between 1 and 300),
  grade smallint not null check (grade between 1 and 9),
  created_at timestamptz not null default now()
);

-- 같은 등급 댓글방 조회 최적화
create index if not exists comments_grade_created_at_idx
  on public.comments (grade, created_at desc);

alter table public.comments enable row level security;

-- 비로그인 서비스: anon 키로 조회/작성. 작성 검증(등급 토큰·길이·빈도)은 라우트에서 수행.
-- NOTE: anon 키는 공개 키이므로 RLS의 CHECK는 최소 방어선이다. 완전한 강제는
--       service-role 키 + anon insert 차단(추후) 으로 가능.
drop policy if exists "comments_select" on public.comments;
create policy "comments_select"
  on public.comments for select
  to anon
  using (true);

drop policy if exists "comments_insert" on public.comments;
create policy "comments_insert"
  on public.comments for insert
  to anon
  with check (char_length(content) between 1 and 300 and grade between 1 and 9);
