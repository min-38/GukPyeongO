-- 국평오 테스트: 문학(literary) → 독해(reading) 유형 전환
-- Supabase SQL Editor에 붙여넣어 실행하세요. (멱등 — 여러 번 실행해도 안전)
-- ⚠️ 정답은 포함하지 않습니다(유형 정의 변경만).
--
-- 배경: 문학 유형의 '화자의 감정/태도' 식 문제는 문해력 측정과 거리가 있어,
--       시·고전·설명문을 아우르되 '지문 안에서 답이 나오는' 독해(reading) 유형으로 통합한다.
--
-- 실행 전제: question_types 테이블이 존재해야 한다(supabase/question_types.sql 먼저 실행).
-- questions.type → question_types.key 외래키가 on update cascade 이므로, 기존 literary 문제가
-- 남아 있어도 아래 rename으로 안전하게 따라온다. (문제를 truncate한 경우에도 무방)

-- literary 유형이 있으면 reading 으로 이름/라벨 변경, 없으면 reading 을 새로 추가.
do $$
begin
  if exists (select 1 from public.question_types where key = 'literary') then
    update public.question_types
      set key = 'reading', label = '독해', emoji = '📖', sort_order = 6
      where key = 'literary';
  else
    insert into public.question_types (key, label, emoji, sort_order)
      values ('reading', '독해', '📖', 6)
      on conflict (key) do update
        set label = excluded.label, emoji = excluded.emoji, sort_order = excluded.sort_order;
  end if;
end $$;
