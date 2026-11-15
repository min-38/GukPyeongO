-- 국평오 v2 문제 풀이 테이블 (GUK-3, ERD v2)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: supabase/schema_gukpyeongo.sql (gukpyeongo 스키마와 service_role 기본 권한)
--
-- v1(회차·선택지)과 섞이지 않게 테이블을 따로 둔다. 이름이 v1과 겹치지 않는다.
-- 사용자는 Supabase Auth 의 auth.users 를 그대로 가리킨다. 로그인 전에는 개발용 사용자 한 명을 쓴다.
begin;

-- 지문. v1 scenarios 를 옮겨 올 자리(v1_scenario_id)를 남겨 둔다.
create table if not exists gukpyeongo.passages (
  id bigint generated always as identity primary key,
  kind text not null,
  title text not null,
  payload jsonb not null,
  v1_scenario_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gukpyeongo.problems (
  id bigint generated always as identity primary key,
  passage_id bigint not null references gukpyeongo.passages(id) on delete restrict,
  title text not null,
  level smallint not null check (level between 1 and 3),
  -- 획득 가능 점수는 Level 로만 정한다(P-06). 화면과 채점이 같은 값을 읽게 한 곳에 둔다.
  points smallint generated always as (case level when 1 then 1 when 2 then 3 else 8 end) stored,
  prompt text not null,
  -- 형식별 정보. 공지·신문은 {"blank": "지문 속 빈칸으로 바꿀 글자"}.
  extra jsonb not null default '{}'::jsonb,
  notes text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'held')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists problems_status_level_idx on gukpyeongo.problems (status, level);
create index if not exists problems_passage_idx on gukpyeongo.problems (passage_id);

-- 인정하는 답. 앞뒤 공백 없이 저장하고, 띄어쓰기까지 같아야 정답이다(P-04).
create table if not exists gukpyeongo.problem_answers (
  problem_id bigint not null references gukpyeongo.problems(id) on delete cascade,
  answer text not null check (answer = btrim(answer) and answer <> ''),
  primary key (problem_id, answer)
);

create table if not exists gukpyeongo.submissions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id bigint not null references gukpyeongo.problems(id) on delete cascade,
  answer text not null check (char_length(answer) between 1 and 50),
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

-- 히스토리(최신순)와 제출 간격 확인.
create index if not exists submissions_user_problem_created_idx
  on gukpyeongo.submissions (user_id, problem_id, created_at desc);
create index if not exists submissions_user_created_idx
  on gukpyeongo.submissions (user_id, created_at desc);
create index if not exists submissions_problem_idx on gukpyeongo.submissions (problem_id);

-- 처음 맞힌 기록. 키가 (사용자, 문제)라 점수는 한 번만 들어간다(P-05).
create table if not exists gukpyeongo.solves (
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id bigint not null references gukpyeongo.problems(id) on delete cascade,
  points smallint not null,
  solved_at timestamptz not null default now(),
  primary key (user_id, problem_id)
);

create index if not exists solves_problem_idx on gukpyeongo.solves (problem_id);
create index if not exists solves_solved_at_idx on gukpyeongo.solves (solved_at);

-- 쓰는 중인 답안(P-07). 정답을 맞히면 지운다(P-08).
create table if not exists gukpyeongo.answer_drafts (
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id bigint not null references gukpyeongo.problems(id) on delete cascade,
  answer text not null check (char_length(answer) <= 50),
  updated_at timestamptz not null default now(),
  primary key (user_id, problem_id)
);

create index if not exists answer_drafts_problem_idx on gukpyeongo.answer_drafts (problem_id);

alter table gukpyeongo.passages enable row level security;
alter table gukpyeongo.problems enable row level security;
alter table gukpyeongo.problem_answers enable row level security;
alter table gukpyeongo.submissions enable row level security;
alter table gukpyeongo.solves enable row level security;
alter table gukpyeongo.answer_drafts enable row level security;
-- 정책 없음 → service-role(서버)만 읽고 쓴다. 인정 답이 브라우저로 갈 길이 없다(P-03).

-- 제출과 채점을 한 트랜잭션으로 한다.
-- 결과 status: 'ok' | 'not_found'(없거나 공개 안 된 문제) | 'too_fast'(1초 안에 다시 제출, P-12)
create or replace function gukpyeongo.submit_answer(p_user uuid, p_problem bigint, p_answer text)
 returns table(status text, is_correct boolean, points_awarded int, total_score int, submitted_at timestamptz)
 language plpgsql
 security definer
 set search_path to 'gukpyeongo'
as $function$
declare
  v_points smallint;
  v_correct boolean;
  v_awarded int := 0;
  v_at timestamptz;
begin
  -- 같은 사용자의 제출을 줄 세운다. 동시에 두 번 눌러도 간격 확인과 첫 정답 판정이 겹치지 않는다.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));

  select p.points into v_points
  from gukpyeongo.problems p
  where p.id = p_problem and p.status = 'published';

  if v_points is null then
    return query select 'not_found'::text, null::boolean, null::int, null::int, null::timestamptz;
    return;
  end if;

  if exists (
    select 1 from gukpyeongo.submissions s
    where s.user_id = p_user and s.created_at > now() - interval '1 second'
  ) then
    return query select 'too_fast'::text, null::boolean, null::int, null::int, null::timestamptz;
    return;
  end if;

  v_correct := exists (
    select 1 from gukpyeongo.problem_answers a
    where a.problem_id = p_problem and a.answer = btrim(p_answer)
  );

  insert into gukpyeongo.submissions (user_id, problem_id, answer, is_correct)
  values (p_user, p_problem, btrim(p_answer), v_correct)
  returning created_at into v_at;

  if v_correct then
    insert into gukpyeongo.solves (user_id, problem_id, points)
    values (p_user, p_problem, v_points)
    on conflict do nothing;
    if found then
      v_awarded := v_points;
    end if;
    delete from gukpyeongo.answer_drafts d where d.user_id = p_user and d.problem_id = p_problem;
  end if;

  return query
  select 'ok'::text, v_correct, v_awarded,
         coalesce((select sum(sv.points)::int from gukpyeongo.solves sv where sv.user_id = p_user), 0),
         v_at;
end;
$function$;

revoke all on function gukpyeongo.submit_answer(uuid, bigint, text) from anon, authenticated, public;
grant execute on function gukpyeongo.submit_answer(uuid, bigint, text) to service_role;

grant all on all tables in schema gukpyeongo to service_role;
grant all on all sequences in schema gukpyeongo to service_role;

commit;

notify pgrst, 'reload schema';
