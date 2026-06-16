-- 국평오 테스트: 문제 난이도 컬럼 추가 (층화 출제용)
-- Supabase SQL Editor에 붙여넣어 실행하세요.
--
-- difficulty: 1=쉬움, 2=보통, 3=어려움.
-- 출제 시 난이도별 목표 분포(DIFFICULTY_MIX)에 맞춰 층화 샘플링하므로,
-- 한 응시에 쉬운 문제만/같은 유형만 몰려 나오지 않도록 보장한다.
-- 기존 문제는 일괄 '보통(2)'으로 설정되며, 관리자 화면에서 개별 조정한다.

alter table public.questions
  add column if not exists difficulty smallint not null default 2
    check (difficulty between 1 and 3);
