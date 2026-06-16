-- 국평오 테스트: 문제 유형을 DB 기반으로 관리 (#39)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 기존 questions.type 의 CHECK 제약을 제거하고, question_types 테이블로의 FK로 대체합니다.
-- 관리자 페이지에서 유형을 추가/수정/삭제할 수 있게 하기 위한 기반 작업입니다.

-- 1) 유형 테이블 (key = questions.type 에 저장되는 값)
create table if not exists public.question_types (
  key text primary key,
  label text not null,
  emoji text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.question_types enable row level security;
-- anon 정책 없음 → RLS로 모든 anon 접근 차단. service-role만 우회 가능.

-- 2) 기존 6개 유형 시드 (이미 있으면 라벨/이모지/정렬만 갱신)
insert into public.question_types (key, label, emoji, sort_order) values
  ('notice',     '공지문',    '📢', 1),
  ('hanja',      '한자어',    '🈂️', 2),
  ('time',       '시간 표현', '🗓️', 3),
  ('confusable', '혼동 표현', '🔀', 4),
  ('idiom',      '사자성어',  '📜', 5),
  ('literary',   '문학',      '📖', 6)
on conflict (key) do update
  set label = excluded.label,
      emoji = excluded.emoji,
      sort_order = excluded.sort_order;

-- 3) questions.type 의 CHECK 제약 제거 → question_types 로의 FK 로 대체
--    (FK 추가 전, questions 에 쓰인 모든 type 이 question_types 에 존재해야 함 — 위 시드로 보장)
alter table public.questions drop constraint if exists questions_type_check;

alter table public.questions drop constraint if exists questions_type_fkey;
alter table public.questions
  add constraint questions_type_fkey
  foreign key (type) references public.question_types(key)
  on update cascade;
