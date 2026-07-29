-- 국평오 테스트: 사용설명서 유형 추가 (#99)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: scenario_kind_contract.sql 까지 실행되어 있어야 합니다.

-- 사용설명서는 "순서와 조건"을 읽는 자리다. 공지·계약서와 재는 근육이 또 다르다 —
-- 공지는 해야 할 일, 계약서는 묶이는 의무, 설명서는 절차의 순서와 경고의 범위를 묻는다.
alter table public.scenarios drop constraint if exists scenarios_kind_check;

alter table public.scenarios
  add constraint scenarios_kind_check
  check (
    kind in (
      'notice', 'news', 'community', 'chat', 'email', 'story',
      'contract', 'manual'
    )
  );
