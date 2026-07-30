import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE,
  checkAdminPassword,
  createAdminToken,
  getAdminSecret,
} from "@/app/lib/admin-auth";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

// 어드민 로그인.
// 실패 기록은 DB에 남긴다(supabase/admin_login_failures.sql) — 인스턴스 메모리에 두면
// 인스턴스 수만큼 시도가 늘고 콜드스타트마다 초기화된다.
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15분
const MAX_FAILURES_PER_IP = 5;
// IP는 요청 헤더에서 온다 — 헤더를 갈아 보내면 IP별 한도는 우회된다.
// 전체 한도는 그렇게 못 피한다. 관리자 한 명이 쓰는 화면이라 넉넉히 잡아도 이 정도면 충분하다.
const MAX_FAILURES_TOTAL = 20;

function clientIp(request: Request): string {
  // 프록시가 붙이는 목록에서 맨 앞이 실제 클라이언트다.
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const ip = clientIp(request);
  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();

  // 창 밖으로 나간 기록은 지운다. 실패해도 로그인은 계속 본다 — 정리는 부수적인 일이다.
  await supabase
    .from("admin_login_failures")
    .delete()
    .lt("at", since)
    .then(undefined, () => undefined);

  const [byIp, total] = await Promise.all([
    supabase
      .from("admin_login_failures")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("at", since),
    supabase
      .from("admin_login_failures")
      .select("id", { count: "exact", head: true })
      .gte("at", since),
  ]);

  // 실패 횟수를 못 세면 통과시키지 않는다. 잠깐 로그인을 못 하는 편이
  // 한도 없이 두드리게 두는 것보다 낫다. (테이블이 아직 없을 때도 여기로 온다)
  if (byIp.error || total.error) {
    return NextResponse.json(
      { error: "로그인을 처리할 수 없습니다. 잠시 후 다시 시도해주세요." },
      { status: 503 },
    );
  }

  if (
    (byIp.count ?? 0) >= MAX_FAILURES_PER_IP ||
    (total.count ?? 0) >= MAX_FAILURES_TOTAL
  ) {
    return NextResponse.json(
      { error: "잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  const password = (body as { password?: unknown }).password;
  if (typeof password !== "string" || !checkAdminPassword(password)) {
    await supabase
      .from("admin_login_failures")
      .insert({ ip })
      .then(undefined, () => undefined);
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }

  // 들어왔으면 이 IP의 실패 기록은 지운다 — 오타 몇 번이 다음 로그인을 막지 않게.
  await supabase
    .from("admin_login_failures")
    .delete()
    .eq("ip", ip)
    .then(undefined, () => undefined);

  const token = createAdminToken(getAdminSecret());
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return res;
}
