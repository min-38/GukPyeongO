import { NextResponse } from "next/server";

import { createSupabaseServer } from "@/app/lib/account.server";

// 로그아웃(A-09). 이 브라우저의 세션만 끝내고 쿠키를 지운다. 화면은 보던 곳에 비로그인으로 남는다.
export async function POST() {
  await (await createSupabaseServer()).auth.signOut({ scope: "local" });
  return new NextResponse(null, { status: 204 });
}
