-- 국평오 테스트: 문제 유형/형식 확장 (#35)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (기존 데이터를 보존하는 비파괴 마이그레이션)
-- type에 사자성어(idiom)/문학(literary), format에 띄어쓰기(spacing)를 허용한다.
-- ⚠️ 정답은 포함하지 않습니다(스키마 변경만).

alter table public.questions drop constraint if exists questions_type_check;
alter table public.questions
  add constraint questions_type_check
  check (type in ('notice', 'hanja', 'time', 'confusable', 'idiom', 'literary'));

alter table public.questions drop constraint if exists questions_format_check;
alter table public.questions
  add constraint questions_format_check
  check (format in ('multiple_choice', 'short_answer', 'spacing'));
