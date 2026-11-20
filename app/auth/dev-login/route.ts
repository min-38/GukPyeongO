import { NextResponse, type NextRequest } from "next/server";

import { safeNext } from "@/app/lib/account";
import { createSupabaseServer, pathAfterLogin } from "@/app/lib/account.server";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

// 로컬 확인용 로그인. 소셜 로그인 키 없이 테스트 사용자(tester1, tester2)로 세션을 만든다.
// 개발 중에만 연다(proxy.ts도 /auth를 운영에서 404로 막는다).
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") return new NextResponse(null, { status: 404 });

  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const email = `tester${searchParams.get("user") === "2" ? 2 : 1}@gukpyeongo.local`;

  const admin = getSupabaseAdmin().auth.admin;
  await admin.createUser({ email, email_confirm: true }); // 이미 있으면 오류를 돌려줄 뿐이다.
  const { data: link, error: linkError } = await admin.generateLink({ type: "magiclink", email });
  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (error || !data.user) return NextResponse.json({ error: error?.message ?? "로그인 실패" }, { status: 500 });

  return NextResponse.redirect(new URL(await pathAfterLogin(data.user.id, next), origin));
}
