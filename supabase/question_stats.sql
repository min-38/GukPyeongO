-- 국평오 테스트: 문제별 통계 (#14)
-- 문항별 시도 수/정답 수 컬럼 + 원자적 증가 RPC.
-- Supabase SQL Editor에 붙여넣어 1회 실행하세요.

alter table public.questions
  add column if not exists attempts int not null default 0,
  add column if not exists correct_count int not null default 0;

-- 응답한 문항들의 통계를 한 번에 원자적으로 증가시킨다.
-- updates: [{ "id": "<uuid>", "correct": true|false }, ...]
create or replace function public.bump_question_stats(updates jsonb)
returns void
language sql
as $$
  update public.questions q
  set attempts = q.attempts + 1,
      correct_count = q.correct_count + ((u.correct)::int)
  from (
    select (x->>'id')::uuid as id,
           (x->>'correct')::boolean as correct
    from jsonb_array_elements(updates) as x
  ) u
  where q.id = u.id;
$$;

-- anon/authenticated가 직접 호출해 통계를 조작하지 못하도록 실행 권한 회수.
-- 서버의 service-role 키로만 호출한다.
revoke all on function public.bump_question_stats(jsonb) from public;
revoke all on function public.bump_question_stats(jsonb) from anon;
revoke all on function public.bump_question_stats(jsonb) from authenticated;
