import { createServerClient } from "@supabase/ssr";
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
  // v2 문제 풀이(GUK-3)와 로그인/회원가입(GUK-12). 운영 DB에 v2 문제가 없어 아직 공개하지 않는다.
  "/problems",
  "/api/problems",
  "/login",
  "/signup",
  "/auth",
  "/api/me",
  "/api/nicknames",
  "/api/auth",
];

// 로그인 세션을 쓰는 경로. 만료된 토큰을 여기서 갱신해 쿠키에 다시 쓴다(서버 컴포넌트는 쿠키를 쓸 수 없다).
const SESSION_ROUTES = DEV_ONLY_ROUTES.slice(DEV_ONLY_ROUTES.indexOf("/problems"));

// v1 테스트. 구글이 이미 색인해 둔 주소라 404로 지우면 그동안 쌓인 검색 유입이 통째로 끊긴다.
// 없애는 대신 이 주의 문제로 넘겨 색인 가치와 방문자를 그대로 옮긴다.
const RETIRED_ROUTES: Record<string, string> = {
  "/test": "/today",
};

const under = (pathname: string, routes: string[]) =>
  routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

export function proxy(request: NextRequest): NextResponse | Promise<NextResponse> {
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
  if (under(pathname, DEV_ONLY_ROUTES)) {
    if (process.env.NODE_ENV !== "development") return notFound();
    if (under(pathname, SESSION_ROUTES)) return refreshSession(request);
  }

  return NextResponse.next();
}

async function refreshSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  // 검증하면서 만료된 토큰을 갱신한다. 결과는 각 화면과 API가 다시 확인한다.
  await supabase.auth.getClaims();
  return response;
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
    "/problems/:path*",
    "/api/problems/:path*",
    "/login",
    "/signup",
    "/auth/:path*",
    "/api/me",
    "/api/nicknames/:path*",
    "/api/auth/:path*",
    "/test",
  ],
};
