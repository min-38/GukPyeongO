import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";

import { config, middleware } from "./middleware";

const ORIGIN = "https://gukpyeongo.test";

function get(pathname: string) {
  return middleware(new NextRequest(new URL(pathname, ORIGIN)));
}

// 막혔는지는 not-found로 다시 쓰였는지로 본다(NextResponse.rewrite).
function blocked(pathname: string) {
  return get(pathname).headers.get("x-middleware-rewrite")?.endsWith("/not-found") ?? false;
}

// matcher에 없는 경로는 미들웨어가 아예 돌지 않는다 — 규칙이 있어도 소용없다.
function matched(pathname: string) {
  return config.matcher.some((m) => {
    const pattern = new RegExp(
      `^${m.replace(/\/:path\*/, "(?:/.*)?").replace(/\//g, "\\/")}$`,
    );
    return pattern.test(pathname);
  });
}

const ADMIN_ENABLED = process.env.ADMIN_ENABLED;
afterEach(() => {
  if (ADMIN_ENABLED === undefined) delete process.env.ADMIN_ENABLED;
  else process.env.ADMIN_ENABLED = ADMIN_ENABLED;
});

describe("개발용 경로 차단", () => {
  // 유형 맛보기 경로를 열어두면 회차 밖에서 답이 확정돼 버린다.
  const SLUGS = [
    "/play", "/news", "/notice", "/community",
    "/story", "/email", "/contract", "/manual",
  ];

  it("모든 유형 경로가 미들웨어가 보는 목록에 있다", () => {
    for (const s of SLUGS) expect(matched(s)).toBe(true);
  });

  it("프로덕션에서는 전부 404", () => {
    for (const s of SLUGS) expect(blocked(s)).toBe(true);
  });

  it("실제 입구는 막지 않는다", () => {
    expect(blocked("/today")).toBe(false);
    expect(blocked("/result")).toBe(false);
    expect(blocked("/share/1")).toBe(false);
  });
});

describe("내려간 v1 경로", () => {
  it("/test 는 404가 아니라 /today 로 넘긴다", () => {
    // 구글이 색인해 둔 주소라 지우면 검색 유입이 끊긴다.
    const res = get("/test");
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe(`${ORIGIN}/today`);
  });

  it("matcher 에 들어 있다", () => {
    expect(matched("/test")).toBe(true);
  });
});

describe("어드민 차단", () => {
  it("어드민 API도 미들웨어가 보는 경로에 들어 있다", () => {
    // 화면만 막고 API를 두면 어드민 보안이 비밀번호 하나에만 걸린다.
    expect(matched("/api/admin/scenarios")).toBe(true);
    expect(matched("/api/admin/login")).toBe(true);
    expect(matched("/admin")).toBe(true);
    expect(matched("/admin/scenarios/1")).toBe(true);
  });

  it("ADMIN_ENABLED가 없으면 화면과 API를 함께 404로 막는다", () => {
    delete process.env.ADMIN_ENABLED;
    expect(blocked("/admin")).toBe(true);
    expect(blocked("/admin/scenarios")).toBe(true);
    expect(blocked("/api/admin/scenarios")).toBe(true);
    expect(blocked("/api/admin/login")).toBe(true);
  });

  it("ADMIN_ENABLED가 있으면 그대로 통과시킨다", () => {
    process.env.ADMIN_ENABLED = "1";
    expect(blocked("/admin")).toBe(false);
    expect(blocked("/api/admin/scenarios")).toBe(false);
  });

  it("사용자 API는 어드민 규칙에 걸리지 않는다", () => {
    delete process.env.ADMIN_ENABLED;
    expect(blocked("/api/today-grade")).toBe(false);
    expect(blocked("/api/comments")).toBe(false);
  });
});
