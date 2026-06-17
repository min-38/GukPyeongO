import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // ADMIN_ENABLED 환경변수가 없으면 /admin 전체를 404로 막는다.
  // 로컬: .env.local에 ADMIN_ENABLED=1 → 접근 허용
  // 프로덕션: Vercel 환경변수 미설정 → 404
  if (!process.env.ADMIN_ENABLED) {
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
