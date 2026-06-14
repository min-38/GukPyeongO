import "server-only";

import { createClient } from "@supabase/supabase-js";

// 댓글 조회/작성을 위한 Supabase 클라이언트. 비로그인 서비스이므로 세션을 두지 않는다.
// 현재는 공개(anon) 키만 사용하며, 작성 검증은 라우트 핸들러에서 수행한다.
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
