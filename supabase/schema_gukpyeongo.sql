-- 국평오 DB를 public 에서 gukpyeongo 스키마로 옮긴다 (#119)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 후: 대시보드 Project Settings → Data API → Exposed schemas 에 gukpyeongo 를 추가.
--          추가하기 전까지, 그리고 db.schema 를 지정한 앱이 배포되기 전까지 앱은 DB를 못 찾는다.
--
-- 무료 티어는 프로젝트가 두 개뿐이라 다른 서비스를 같은 프로젝트에 올린다.
-- 서비스마다 스키마를 나눠야 이름이 겹치지 않고 누구 것인지 구분된다.
--
-- SET SCHEMA 는 인덱스·제약·RLS 정책·권한·소유 시퀀스를 같이 옮긴다.
-- 뷰는 테이블을 OID로 물고 있어 그대로 동작한다.
-- 함수 본문은 텍스트라 public.* 참조가 남는다 — 아래에서 다시 쓴다.
begin;

create schema if not exists gukpyeongo;

grant usage on schema gukpyeongo to anon, authenticated, service_role;

-- public 에 Supabase 가 기본으로 걸어 두는 것과 같은 기본 권한. 새로 만드는 테이블에 GRANT 를 빠뜨리지 않게.
alter default privileges in schema gukpyeongo grant all on tables to anon, authenticated, service_role;
alter default privileges in schema gukpyeongo grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema gukpyeongo grant all on functions to anon, authenticated, service_role;

-- public 에는 국평오 것만 있다. 남김없이 옮긴다.
do $$
declare
  r record;
begin
  for r in
    select c.relname,
           case c.relkind when 'v' then 'view' when 'm' then 'materialized view' else 'table' end as kind
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
  loop
    execute format('alter %s public.%I set schema gukpyeongo', r.kind, r.relname);
  end loop;

  -- 테이블이 소유한 시퀀스는 이미 따라왔다. 남은 건 소유자 없는 시퀀스뿐이다.
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'S'
  loop
    execute format('alter sequence public.%I set schema gukpyeongo', r.relname);
  end loop;

  -- 함수를 옮기면 GRANT 와 소유자가 그대로 따라온다. 본문은 아래 create or replace 가 바꾼다.
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('alter function %s set schema gukpyeongo', r.sig);
  end loop;
end $$;

create or replace function gukpyeongo.answer_scenario_step(p_slug text, p_step_key text, p_choice integer, p_visitor text)
 returns table(answer_index integer, is_correct boolean)
 language plpgsql
 security definer
 set search_path to 'gukpyeongo'
as $function$
declare
  v_step_id uuid;
  v_scenario_id uuid;
  v_answer int;
  v_correct boolean;
  v_round uuid;
  v_inserted int;
begin
  select st.id, st.scenario_id, st.answer_index
    into v_step_id, v_scenario_id, v_answer
  from gukpyeongo.scenario_steps st
  join gukpyeongo.scenarios s on s.id = st.scenario_id
  where s.slug = p_slug
    and s.status = 'published'
    and st.step_key = p_step_key;

  if v_step_id is null then
    return; -- 없는 문항 — 호출 측이 빈 결과를 보고 판단한다
  end if;

  v_correct := (p_choice is not null and p_choice = v_answer);

  -- 이 사람이 지금 풀고 있는 회차. 시작 기록이 곧 그 답이다.
  select s.round_id into v_round
  from gukpyeongo.scenario_sessions s
  where s.visitor_id = p_visitor
    and s.round_id is not null
  order by s.started_at desc
  limit 1;

  -- 시작 기록이 실패했으면 지금 열려 있는 회차로 본다.
  if v_round is null then
    select r.id into v_round
    from gukpyeongo.rounds r
    join gukpyeongo.round_scenarios rs on rs.round_id = r.id
    where rs.scenario_id = v_scenario_id
      and now() >= r.starts_at
      and now() < r.ends_at
    limit 1;
  end if;

  insert into gukpyeongo.scenario_step_answers (visitor_id, step_id, choice_index, is_correct, round_id)
  values (p_visitor, v_step_id, p_choice, v_correct, v_round)
  on conflict (round_id, visitor_id, step_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    -- 처음 답한 경우에만 집계에 반영한다.
    update gukpyeongo.scenario_steps st
    set attempts = st.attempts + 1,
        correct_count = st.correct_count + case when v_correct then 1 else 0 end
    where st.id = v_step_id;
  else
    -- 이미 답한 문항이다. 저장된 첫 선택이 진실이므로 그 판정을 돌려준다(#104).
    -- 회차 밖 답안은 round_id 가 null 이라 is not distinct from 으로 견준다.
    select a.is_correct into v_correct
    from gukpyeongo.scenario_step_answers a
    where a.visitor_id = p_visitor
      and a.step_id = v_step_id
      and a.round_id is not distinct from v_round;
  end if;

  answer_index := v_answer;
  is_correct := v_correct;
  return next;
end;
$function$;

create or replace function gukpyeongo.bump_question_stats(updates jsonb)
 returns void
 language sql
as $function$
  update gukpyeongo.questions q
  set attempts = q.attempts + 1,
      correct_count = q.correct_count + ((u.correct)::int)
  from (
    select (x->>'id')::uuid as id,
           (x->>'correct')::boolean as correct
    from jsonb_array_elements(updates) as x
  ) u
  where q.id = u.id;
$function$;

create or replace function gukpyeongo.set_round_scenarios(p_round uuid, p_ids uuid[])
 returns void
 language plpgsql
 security definer
 set search_path to 'gukpyeongo'
as $function$
begin
  delete from gukpyeongo.round_scenarios where round_id = p_round;

  -- 빈 편성(편성 해제)도 뜻이 있는 저장이라 그대로 둔다.
  if array_length(p_ids, 1) is not null then
    -- with ordinality 로 넘어온 차례가 그대로 푸는 차례가 된다.
    insert into gukpyeongo.round_scenarios (round_id, scenario_id, sort_order)
    select p_round, t.id, t.ord
    from unnest(p_ids) with ordinality as t(id, ord);
  end if;
end;
$function$;

commit;

-- PostgREST 가 옮긴 테이블을 바로 보도록 스키마 캐시를 다시 읽힌다.
notify pgrst, 'reload schema';
