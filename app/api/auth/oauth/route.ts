import type { Provider } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { PROVIDERS, safeNext, SERVER_ERROR } from "@/app/lib/account";
import { createSupabaseServer } from "@/app/lib/account.server";

// 소셜 로그인 시작. 공급자 로그인 페이지 주소를 돌려주고, 화면이 같은 탭에서 그 주소로 넘어간다.
// 공급자가 설정되지 않았거나 Supabase Auth가 오류를 내면 원인은 밝히지 않고 서버 오류 문구만 돌려준다.
export async function POST(request: NextRequest) {
  const serverError = () => NextResponse.json({ error: SERVER_ERROR }, { status: 500 });

  let body: { provider?: unknown; next?: unknown };
  try {
    body = await request.json();
  } catch {
    return serverError();
  }
  const provider = PROVIDERS.find((p) => p.id === body.provider)?.id;
  if (!provider) return serverError();
  const next = safeNext(body.next);

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: `${request.nextUrl.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) return serverError();

  // Supabase Auth가 공급자 로그인 페이지로 넘기는지(3xx) 먼저 확인한다. 아니면 설정 오류다.
  const res = await fetch(data.url, { redirect: "manual" }).catch(() => null);
  const url = res && res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
  if (!url) return serverError();

  // 콜백에서 쓸 PKCE 쿠키는 createSupabaseServer가 cookies()로 심어 이 응답에 같이 실린다.
  return NextResponse.json({ url });
}
