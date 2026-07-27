-- 국평오 테스트: 문제 제목 (#92)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
-- 실행 전제: supabase/scenarios.sql 을 먼저 실행해 테이블이 있어야 합니다.

-- 편성 화면에서 문제를 알아볼 이름이 없었다. 표시 라벨(source_label)은
-- 푸는 사람이 화면 상단에서 보는 값이라(공지사항·국평오일보) 같은 유형끼리 구분이 안 된다.
-- title 은 만드는 사람이 목록에서 알아보는 이름이다.
alter table public.scenarios
  add column if not exists title text not null default '';

-- 기존 문제에는 표시 라벨을 임시 제목으로 채워 빈칸을 없앤다(어드민에서 고쳐 쓴다).
update public.scenarios set title = source_label where title = '';
