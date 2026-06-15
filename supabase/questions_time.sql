-- 국평오 테스트: 형식/유형별 제한시간 일괄 적용 (#34)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (기존 문제의 time_limit_sec를 권장값으로 갱신)
-- 시간 제한의 목적은 치팅 방지가 아니라 게임 같은 긴장감. 너무 짧으면 좌절하므로 균형을 둔다.
-- 개별 문제에 맞춤 시간을 이미 지정했다면, 이 일괄 갱신은 선택적으로만 실행하세요.

-- 짧은 혼동/시간 표현(객관식): 12초
update public.questions set time_limit_sec = 12
  where format = 'multiple_choice' and type in ('time', 'confusable');

-- 한자어/사자성어(객관식): 15초
update public.questions set time_limit_sec = 15
  where format = 'multiple_choice' and type in ('hanja', 'idiom');

-- 공지문 독해(객관식): 20초
update public.questions set time_limit_sec = 20
  where format = 'multiple_choice' and type = 'notice';

-- 단답형/띄어쓰기(직접 입력): 25초
update public.questions set time_limit_sec = 25
  where format in ('short_answer', 'spacing');

-- 문학 긴 지문: 35초
update public.questions set time_limit_sec = 35
  where type = 'literary';
