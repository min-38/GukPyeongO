-- 국평오 테스트: 문서형 유형 분리 (#92)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: supabase/scenarios.sql 을 먼저 실행해 테이블이 있어야 합니다.
-- 새로 만드는 DB는 scenarios.sql 에 이미 새 목록이 들어 있어 이 파일이 필요 없습니다.
-- 이 파일은 'doc' 으로 이미 돌고 있던 DB를 옮기기 위한 것입니다.

-- 공지와 신문은 화면(표면)이 같아 'doc' 하나로 묶어 뒀는데, 유형별로 튜토리얼과 안내가
-- 갈라지는 순간 이 묶음이 걸림돌이 된다. 포맷이 같아도 유형은 나눠 둔다.
-- 제약을 새로 걸기 전에 기존 데이터를 먼저 옮긴다(옮기지 않으면 제약 추가가 거부된다).
-- 공지/신문은 각각 slug가 notice/news다.
alter table public.scenarios drop constraint if exists scenarios_kind_check;
update public.scenarios set kind = slug where kind = 'doc' and slug in ('notice', 'news');

alter table public.scenarios
  add constraint scenarios_kind_check
  check (kind in ('notice', 'news', 'community', 'chat', 'email', 'story'));
