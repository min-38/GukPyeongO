import { NextResponse, type NextRequest } from "next/server";

import { safeNext } from "@/app/lib/account";
import { createSupabaseServer, pathAfterLogin } from "@/app/lib/account.server";

// 소셜 로그인에서 돌아오는 곳. 받은 코드로 세션을 만들고, 가입 전이면 가입 화면으로 보낸다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  // 취소가 아니면 원인은 밝히지 않고 서버 오류로만 알린다.
  const backToLogin = (reason: "cancel" | "server") =>
    NextResponse.redirect(new URL(`/login?error=${reason}&next=${encodeURIComponent(next)}`, origin));

  // 소셜 로그인 화면에서 취소하거나 동의하지 않으면 access_denied로 돌아온다.
  const providerError = searchParams.get("error");
  if (providerError) return backToLogin(providerError === "access_denied" ? "cancel" : "server");

  const code = searchParams.get("code");
  if (!code) return backToLogin("server");

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return backToLogin("server");

  return NextResponse.redirect(new URL(await pathAfterLogin(data.user.id, next), origin));
}
