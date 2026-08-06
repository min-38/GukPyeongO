-- 국평오 테스트: 항의에 회차를 남긴다 (#103)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: step_feedback.sql + step_reports_visitor.sql + scenario_step_answers_round_key.sql (#102)
--
-- 왜 필요한가.
--  · 어드민 항의 목록은 항의한 사람이 그 문항에서 무엇을 골랐는지 함께 보여준다.
--    그 선택을 (방문자, 문항) 두 값으로 찾는데, #102 로 답안에 회차가 들어가면서
--    같은 사람의 같은 문항에 줄이 여럿 생길 수 있게 됐다 — 어느 회차의 선택이 잡힐지 알 수 없다.
--  · 중복 방지 키도 같은 문제다. (step_id, visitor_id) 라서 새 회차에서 같은 문항에
--    항의하면 지난 회차의 항의를 덮어쓴다.

alter table public.step_reports
  add column if not exists round_id uuid references public.rounds(id) on delete set null;

-- 기존 항의 채우기 — 그 방문자가 그 문항에 남긴 답안의 회차를 그대로 쓴다.
-- 답안이 없으면(옛 항의는 visitor_id 가 비어 있다) null 로 둔다.
update public.step_reports r
set round_id = a.round_id
from public.scenario_step_answers a
where r.round_id is null
  and r.visitor_id is not null
  and a.visitor_id = r.visitor_id
  and a.step_id = r.step_id;

-- 중복 방지를 회차 단위로. NULLS NOT DISTINCT 라 회차 밖 항의는 예전처럼 한 줄로 묶인다.
drop index if exists public.step_reports_step_visitor_idx;
create unique index if not exists step_reports_step_visitor_round_idx
  on public.step_reports (step_id, visitor_id, round_id) nulls not distinct;
