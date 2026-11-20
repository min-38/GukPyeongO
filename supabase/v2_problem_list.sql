-- 국평오 v2 문제 목록 (GUK-9, 문제 리스트 명세서)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: supabase/v2_problems.sql
begin;

create index if not exists problems_published_at_idx
  on gukpyeongo.problems (published_at desc) where status = 'published';

-- 목록 한 페이지. total 은 조건에 맞는 전체 문제 수(페이지와 상관없음).
-- 상태(L-06): 맞힘 done / 제출했거나 답안을 저장했지만 못 맞힘 doing / 손대지 않음 todo. 비로그인은 모두 todo(L-10).
-- 정답률(L-05): 제출한 사람 중 첫 제출에 맞힌 사람의 비율. 제출한 사람이 없으면 null.
-- shortcut: 부를 때마다 제출 기록 전체에서 첫 제출을 다시 센다. 제출이 수십만 건이 되면 문제별 집계 칸으로 옮긴다.
create or replace function gukpyeongo.list_problems(
  p_user uuid,
  p_q text,
  p_kind text,
  p_level smallint,
  p_unsolved boolean,
  p_sort text,
  p_limit int,
  p_offset int
)
 returns table(id bigint, title text, kind text, level smallint, rate int, status text, total bigint)
 language sql
 stable
 set search_path to 'gukpyeongo'
as $function$
  with firsts as (
    select distinct on (s.user_id, s.problem_id) s.problem_id, s.is_correct
    from submissions s
    order by s.user_id, s.problem_id, s.created_at, s.id
  ),
  rates as (
    select f.problem_id, count(*) as people, count(*) filter (where f.is_correct) as first_ok
    from firsts f
    group by f.problem_id
  ),
  solvers as (
    select sv.problem_id, count(*) as n from solves sv group by sv.problem_id
  ),
  base as (
    select p.id, p.title, pa.kind, p.level, p.published_at, r.people, r.first_ok,
      coalesce(sc.n, 0) as solvers,
      case
        when p_user is null then 'todo'
        when exists (select 1 from solves x where x.user_id = p_user and x.problem_id = p.id) then 'done'
        when exists (select 1 from submissions x where x.user_id = p_user and x.problem_id = p.id)
          or exists (select 1 from answer_drafts d where d.user_id = p_user and d.problem_id = p.id and d.answer <> '')
          then 'doing'
        else 'todo'
      end as status
    from problems p
    join passages pa on pa.id = p.passage_id
    left join rates r on r.problem_id = p.id
    left join solvers sc on sc.problem_id = p.id
    where p.status = 'published'
      and (p_kind is null or pa.kind = p_kind)
      and (p_level is null or p.level = p_level)
      -- 제목에 검색어가 들어 있는지(L-12). %, _ 는 글자 그대로 찾는다.
      and (p_q is null or p.title ilike '%' || replace(replace(replace(p_q, '\', '\\'), '%', '\%'), '_', '\_') || '%')
  )
  select b.id, b.title, b.kind, b.level,
    case when b.people > 0 then round(100.0 * b.first_ok / b.people)::int end,
    b.status,
    count(*) over ()
  from base b
  where not (p_unsolved and b.status = 'done')
  order by
    case when p_sort = 'popular' then b.solvers end desc nulls last,
    case when p_sort = 'rate' then b.first_ok::numeric / nullif(b.people, 0) end desc nulls last,
    b.published_at desc nulls last,
    b.id desc
  limit p_limit offset p_offset;
$function$;

-- 유형 탭의 문제 수(L-11). 로그인했으면 아직 맞히지 않은 문제 수, 비로그인이면 공개 문제 수.
create or replace function gukpyeongo.problem_kind_counts(p_user uuid)
 returns table(kind text, n bigint)
 language sql
 stable
 set search_path to 'gukpyeongo'
as $function$
  select pa.kind, count(*)
  from problems p
  join passages pa on pa.id = p.passage_id
  where p.status = 'published'
    and (p_user is null or not exists (
      select 1 from solves s where s.user_id = p_user and s.problem_id = p.id
    ))
  group by pa.kind;
$function$;

revoke all on function gukpyeongo.list_problems(uuid, text, text, smallint, boolean, text, int, int) from anon, authenticated, public;
grant execute on function gukpyeongo.list_problems(uuid, text, text, smallint, boolean, text, int, int) to service_role;
revoke all on function gukpyeongo.problem_kind_counts(uuid) from anon, authenticated, public;
grant execute on function gukpyeongo.problem_kind_counts(uuid) to service_role;

commit;

notify pgrst, 'reload schema';
