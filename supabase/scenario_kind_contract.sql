-- 국평오 테스트: 계약서 유형 추가 (#99)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: scenarios.sql → scenario_kind_split.sql 을 먼저 실행해야 합니다.

-- 계약서·약관은 읽기를 못해 돈으로 손해 보는 자리다. 공지와 재는 근육이 다르다 —
-- 공지는 "내가 무엇을 해야 하나"를, 계약서는 "내가 무엇에 묶이나"를 묻는다.
-- 화면은 문서형(공지·신문)과 같은 카드를 쓰지만 유형 이름이 유저에게 보이므로 따로 둔다.
alter table public.scenarios drop constraint if exists scenarios_kind_check;

alter table public.scenarios
  add constraint scenarios_kind_check
  check (
    kind in ('notice', 'news', 'community', 'chat', 'email', 'story', 'contract')
  );
