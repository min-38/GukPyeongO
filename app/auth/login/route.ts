import type { Provider } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { PROVIDERS, safeNext } from "@/app/lib/account";
import { createSupabaseServer } from "@/app/lib/account.server";

// 소셜 로그인 시작. 로그인 화면의 버튼이 같은 탭에서 여기로 온다.
// 공급자가 설정되지 않았거나 Supabase Auth가 오류를 내면 그 오류 화면(JSON)을 사용자에게 보이지 않고
// 로그인 화면에 '서버 오류' 문구만 띄운다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const serverError = NextResponse.redirect(new URL(`/login?error=server&next=${encodeURIComponent(next)}`, origin));

  const provider = PROVIDERS.find((p) => p.id === searchParams.get("provider"))?.id;
  if (!provider) return serverError;

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`, skipBrowserRedirect: true },
  });
  if (error || !data.url) return serverError;

  // Supabase Auth가 공급자 로그인 페이지로 넘기는지(3xx) 먼저 확인한다. 아니면 설정 오류다.
  const res = await fetch(data.url, { redirect: "manual" }).catch(() => null);
  const location = res && res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
  if (!location) return serverError;

  // 콜백에서 쓸 PKCE 쿠키는 createSupabaseServer가 cookies()로 심어 이 응답에 같이 실린다.
  return NextResponse.redirect(location);
}
