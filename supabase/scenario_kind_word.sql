-- 국평오 테스트: 어휘 유형 추가 (#101)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: scenario_kind_manual.sql 까지 실행되어 있어야 합니다.

-- 어휘는 지문이 없다. 한자어·사자성어·속담처럼 낱말 하나를 묻는 짧은 문항을 모아 낸다.
-- v1(questions 테이블)에 있던 이 유형을 회차 안으로 들여온다 — 메신저처럼 지문 없이 문항만 있다.
alter table public.scenarios drop constraint if exists scenarios_kind_check;

alter table public.scenarios
  add constraint scenarios_kind_check
  check (
    kind in (
      'notice', 'news', 'community', 'chat', 'email', 'story',
      'contract', 'manual', 'word'
    )
  );
