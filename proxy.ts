import { NextRequest, NextResponse } from "next/server";

// 개발 중에만 열어두는 slug 경로 (#87).
// 유형을 하나씩 확인하려고 낸 길이라 실제 입구가 아니다 — 입구는 /today(이 주의 편성)다.
// 여기를 열어두면 회차 밖에서 문항에 답할 수 있고, 그 답이 서버에 확정돼
// (scenario_step_answers) 나중에 그 시나리오가 편성됐을 때 다시 답할 수 없게 된다.
const DEV_ONLY_ROUTES = [
  "/play",
  "/news",
  "/notice",
  "/community",
  "/story",
  "/email",
  "/contract",
  "/manual",
];

// v1 테스트. 구글이 이미 색인해 둔 주소라 404로 지우면 그동안 쌓인 검색 유입이 통째로 끊긴다.
// 없애는 대신 이 주의 문제로 넘겨 색인 가치와 방문자를 그대로 옮긴다.
const RETIRED_ROUTES: Record<string, string> = {
  "/test": "/today",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const notFound = () =>
    NextResponse.rewrite(new URL("/not-found", request.url));

  // ADMIN_ENABLED 환경변수가 없으면 /admin 전체를 404로 막는다.
  // 로컬: .env.local에 ADMIN_ENABLED=1 → 접근 허용
  // 프로덕션: Vercel 환경변수 미설정 → 404
  // 화면만 막으면 어드민 API는 그대로 열려 있어, 어드민 전체 보안이 비밀번호 하나에 걸린다.
  // 같은 환경 스위치로 API도 함께 닫는다.
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/")
  ) {
    return process.env.ADMIN_ENABLED ? NextResponse.next() : notFound();
  }

  // 내려간 v1 경로는 프로덕션에서만 새 주소로 넘긴다(개발 중에는 그대로 열어 둔다).
  const movedTo = RETIRED_ROUTES[pathname];
  if (movedTo && process.env.NODE_ENV !== "development") {
    return NextResponse.redirect(new URL(movedTo, request.url), 301);
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
    "/api/admin/:path*",
    "/play",
    "/play/:path*",
    "/news",
    "/notice",
    "/community",
    "/story",
    "/email",
    "/email/:path*",
    "/contract",
    "/manual",
    "/test",
  ],
};
