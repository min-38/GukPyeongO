import { NextResponse, type NextRequest } from "next/server";

import { checkNickname, getAuthUserId } from "@/app/lib/account.server";

// 가입 화면이 입력이 멈추고 0.5초 뒤 부른다(A-04). 시작하기를 누를 때 POST /api/me가 한 번 더 확인한다.
export async function GET(request: NextRequest) {
  if (!(await getAuthUserId())) return NextResponse.json({ error: "다시 로그인해 주세요." }, { status: 401 });
  try {
    return NextResponse.json(await checkNickname(request.nextUrl.searchParams.get("nickname")));
  } catch {
    return NextResponse.json({ error: "확인하지 못했습니다." }, { status: 500 });
  }
}
