-- 국평오 테스트: 문의함
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
--
-- 여태 푸터의 문의는 mailto 링크였다. 메일함으로 흩어져서 무엇이 들어왔는지,
-- 처리했는지 남지 않는다. 신고(reports)·항의(step_reports)와 같은 자리에서 보려고 표로 받는다.
--
-- 로그인이 없으므로 답장할 주소는 본인이 적어 넣는다. 안 적어도 접수는 된다 —
-- 답장을 못 할 뿐이고, 무엇이 불편했는지는 그래도 남는다.
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'etc'
    check (kind in ('bug', 'question', 'suggestion', 'etc')),
  message text not null,
  -- 답장받을 곳. 비워둘 수 있다.
  contact text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  -- 재현에 필요한 최소한만 남긴다. 어느 화면에서 썼는지.
  path text,
  ip_masked text,
  created_at timestamptz not null default now()
);

-- 어드민이 미처리부터 최신순으로 본다.
create index if not exists inquiries_status_idx
  on public.inquiries (status, created_at desc);

alter table public.inquiries enable row level security;
-- anon 정책 없음 → service-role(서버)만 쓰고 읽는다.
-- 문의 내용에는 개인 사정이 적힐 수 있어 공개 조회를 열지 않는다(댓글과 다른 점).

-- 보관 방침: 답장에 필요한 연락처가 들어올 수 있어 아무나 못 읽게 막아 두었다.
-- 처리가 끝나고 오래된 것은 status='resolved' 기준으로 잘라내면 된다.
