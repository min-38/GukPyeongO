-- 국평오 테스트: 댓글 닉네임/IP (#17)
-- 자동 생성 닉네임 + "마스킹된 IP만" 저장(원본 미보관).
-- Supabase SQL Editor에 붙여넣어 1회 실행하세요.
--
-- ⚠️ 보안: 원본 IP를 컬럼에 저장하면 anon이 테이블 SELECT 정책으로 컬럼까지 읽을 수 있어
--    (테이블 권한이 컬럼 revoke를 무력화) 노출됩니다. 따라서 원본을 저장하지 않고
--    작성 시 서버에서 마스킹한 값(ip_masked)만 보관합니다.

alter table public.comments
  add column if not exists nickname text not null default '아무개',
  add column if not exists ip_masked text;

-- 이전 버전에서 원본 ip 컬럼을 만들었다면 제거 (노출 위험 차단)
alter table public.comments drop column if exists ip;
