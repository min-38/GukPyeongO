import { NextRequest, NextResponse } from "next/server";

// 개발 중에만 열어두는 경로 (#87).
//  · slug 경로 — 유형을 하나씩 확인하려고 낸 길이다. 실제 입구는 /today(그날 편성).
//  · /test — v1 문해력 테스트. v2로 넘어가면서 서비스에서 내린다(거취는 #84).
// 주의: 홈의 시작 버튼이 아직 /test 를 가리킨다. 배포 전에 #90(진입 동선)을 끝내야
//       프로덕션에서 문제로 들어갈 길이 남는다.
const DEV_ONLY_ROUTES = [
  "/play",
  "/news",
  "/notice",
  "/community",
  "/story",
  "/email",
  "/test",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const notFound = () =>
    NextResponse.rewrite(new URL("/not-found", request.url));

  // ADMIN_ENABLED 환경변수가 없으면 /admin 전체를 404로 막는다.
  // 로컬: .env.local에 ADMIN_ENABLED=1 → 접근 허용
  // 프로덕션: Vercel 환경변수 미설정 → 404
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return process.env.ADMIN_ENABLED ? NextResponse.next() : notFound();
  }

  // slug 경로는 개발 중에만 열어둔다. 배포에서는 /admin 과 마찬가지로 404.
  if (
    DEV_ONLY_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    )
  ) {
    return process.env.NODE_ENV === "development"
      ? NextResponse.next()
      : notFound();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/play",
    "/play/:path*",
    "/news",
    "/notice",
    "/community",
    "/story",
    "/email",
    "/email/:path*",
    "/test",
  ],
};
