import "server-only";

import { createClient } from "@supabase/supabase-js";

// service-role 키를 쓰는 서버 전용 클라이언트. RLS를 우회하므로
// 반드시 서버(라우트/서버 컴포넌트)에서만 사용한다. 정답이 담긴 questions
// 조회와 댓글 작성/삭제 등 신뢰가 필요한 작업에 사용한다.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service-role 환경 변수가 설정되지 않았습니다.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
