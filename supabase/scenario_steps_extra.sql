-- 국평오 테스트: 문항의 유형별 추가 필드 (#80)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: supabase/scenarios.sql 을 먼저 실행해 테이블이 있어야 합니다.

-- 메신저(chat)는 지문이 문항마다 흩어져 있다 — 그 문제 앞에 이어붙는 대화(context)와
-- 답변 후 상대 반응(reactCorrect/reactWrong/reactTimeout)을 문항이 각자 들고 간다.
-- 유형 하나 때문에 컬럼 네 개를 늘리는 대신, 유형별 추가 필드를 여기 담는다.
--   chat → { context: [{speaker, text}], reactCorrect, reactWrong, reactTimeout }
-- 공용 필드(prompt·choices·난이도 등)는 계속 각자 컬럼에 둔다. 검증·집계가 걸려 있기 때문.
alter table public.scenario_steps
  add column if not exists extra jsonb not null default '{}'::jsonb;
