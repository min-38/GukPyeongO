-- 국평오 테스트: 문항 항의 중복 방지 (#96)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: step_feedback.sql 을 먼저 실행해 테이블이 있어야 합니다.

-- 시트를 접었다 다시 펴면 같은 문항에 항의를 몇 번이고 넣을 수 있었다.
-- 화면 상태로 막으면 새로고침 한 번에 뚫리므로 저장 쪽에서 한 사람 한 줄로 묶는다.
-- 별점(step_ratings)은 처음부터 (step_id, visitor_id) 유니크였다.
alter table public.step_reports
  add column if not exists visitor_id text;

-- 조건을 붙인 인덱스는 upsert(ON CONFLICT)의 기준으로 쓸 수 없어 그냥 유니크로 둔다.
-- 이미 쌓인 줄은 visitor_id 가 비어 있는데, 널끼리는 서로 다른 값으로 쳐서 부딪히지 않는다.
create unique index if not exists step_reports_step_visitor_idx
  on public.step_reports (step_id, visitor_id);
