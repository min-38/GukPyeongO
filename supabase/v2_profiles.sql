-- 국평오 v2 가입 정보 (GUK-12, ERD v2 profiles)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: supabase/v2_problems.sql
--
-- 행이 있으면 가입을 마친 사용자다(로그인/회원가입 명세서 A-05, A-06).
-- 다른 v2 테이블은 auth.users id를 그대로 쓰고, 닉네임과 동의 기록만 여기에 둔다.
begin;

create table if not exists gukpyeongo.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- 2~12자, 한글·영문·숫자만(A-04). 화면과 API도 같은 규칙으로 막는다.
  nickname text not null check (nickname ~ '^[가-힣A-Za-z0-9]{2,12}$'),
  age_confirmed_at timestamptz not null,
  birth_year smallint check (birth_year between 1900 and 2100),
  birth_year_agreed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 출생 연도는 수집에 동의했을 때만 둔다(A-13).
  constraint profiles_birth_year_agreed check (birth_year is null or birth_year_agreed_at is not null)
);

-- 영문 대소문자만 다른 닉네임도 같은 닉네임으로 본다(A-04).
create unique index if not exists profiles_nickname_lower_key
  on gukpyeongo.profiles (lower(nickname));

alter table gukpyeongo.profiles enable row level security;

grant all on gukpyeongo.profiles to service_role;

commit;

notify pgrst, 'reload schema';
