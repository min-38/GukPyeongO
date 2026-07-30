-- 국평오 테스트: 어드민 로그인 실패 기록 (운영 전 점검)
-- Supabase SQL Editor에 붙여넣어 실행하세요. (여러 번 실행해도 안전한 멱등 스크립트)
--
-- 실패 카운터가 여태 람다 인스턴스 메모리(Map)에 있었다.
--  · 인스턴스가 여러 개면 허용 시도가 그 수만큼 늘고, 콜드스타트마다 0으로 돌아간다.
--  · 키가 요청 헤더(x-real-ip)라 헤더를 갈아 보내면 카운터를 통째로 우회한다.
-- 어드민 방어가 비밀번호 하나뿐이라 이 구멍이 그대로 남으면 안 된다.
--
-- 인스턴스가 공유하는 곳에 남긴다. 헤더를 바꿔 가며 두드리는 경우는
-- IP별 한도로는 못 막으므로, 호출 측에서 전체 한도도 함께 본다.
create table if not exists public.admin_login_failures (
  id bigserial primary key,
  ip text not null,
  at timestamptz not null default now()
);

-- 조회도 정리도 시간으로 자른다.
create index if not exists admin_login_failures_at_idx
  on public.admin_login_failures (at);

alter table public.admin_login_failures enable row level security;
-- anon 정책 없음 → service-role(서버)만 기록·조회한다.

-- 보관 방침: 로그인 시도 IP는 공격 탐지용이라 짧게만 둔다.
-- 호출 측이 창(15분) 밖의 줄을 지우므로 따로 정리 작업을 걸지 않아도 쌓이지 않는다.
