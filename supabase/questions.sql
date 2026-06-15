-- 국평오 테스트: 문제 테이블 (#9, #12)
-- Supabase SQL Editor에 붙여넣어 실행하세요.
-- 정답(answer_index/answers)이 포함되므로 anon에는 어떤 정책도 부여하지 않습니다(RLS 차단).
-- 서버의 service-role 키로만 접근하며, 클라이언트에는 정답을 제거한 형태로만 전달됩니다.
--
-- ⚠️ id를 uuid로 전환하며 테이블을 재생성합니다. 기존 questions 데이터는 삭제 후 재시드됩니다.
--    (댓글/점수는 question id를 FK로 참조하지 않아 영향 없음)

drop table if exists public.questions cascade;

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('notice', 'hanja', 'time', 'confusable')),
  format text not null default 'multiple_choice'
    check (format in ('multiple_choice', 'short_answer')),
  prompt text not null,
  choices jsonb not null,
  answer_index smallint not null check (answer_index >= 0),
  answers jsonb not null default '[]'::jsonb,
  time_limit_sec smallint not null default 20,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;
-- anon 정책 없음 → RLS로 모든 anon 접근 차단. service-role만 우회 가능.

-- 기본 문제 시드 (id는 uuid로 자동 생성)
insert into public.questions (type, prompt, choices, answer_index, time_limit_sec, sort_order) values
  ('time', '친구가 ''사흘 뒤에 보자''고 했다. 사흘 뒤는 언제인가?', '["3일 뒤","4일 뒤","일주일 뒤","오늘"]', 0, 20, 1),
  ('hanja', '공지에 적힌 ''금일(今日)''은 언제를 뜻하는가?', '["오늘","금요일","이번 주","다음 날"]', 0, 20, 2),
  ('confusable', '''심심(甚深)한 사과 말씀드립니다''에서 ''심심한''의 뜻은?', '["지루한","매우 깊은","간이 싱거운","별것 아닌"]', 1, 20, 3),
  ('notice', '공지: ''모집 인원 0명''. 이 공고의 의미로 알맞은 것은?', '["더 이상 뽑지 않는다","새로 0명을 선발한다","누구나 지원 가능하다","무료로 모집한다"]', 0, 20, 4),
  ('hanja', '''무운(武運)을 빈다''는 무슨 뜻인가?', '["운이 없기를 빈다","싸움에서의 행운을 빈다","아무 일 없기를 빈다","운을 시험한다"]', 1, 20, 5),
  ('time', '''모레''는 오늘로부터 며칠 뒤인가?', '["1일 뒤","2일 뒤","3일 뒤","4일 뒤"]', 1, 20, 6),
  ('confusable', '''물건값을 치러 거래를 끝냄''을 뜻하는 말은?', '["결재","결제","결정","결산"]', 1, 20, 7),
  ('notice', '공지: ''우천 시 행사는 익일로 순연됩니다.'' 익일은 언제인가?', '["당일","다음 날","전날","주말"]', 1, 20, 8),
  ('hanja', '''고지식하다''의 뜻으로 알맞은 것은?', '["아는 것이 많다","성질이 곧아 융통성이 없다","지위가 높다","교양이 풍부하다"]', 1, 20, 9),
  ('confusable', '''사과의 색은 바나나와 ___.'' 빈칸에 알맞은 말은?', '["틀리다","다르다","맞다","같다고 틀리다"]', 1, 20, 10);
