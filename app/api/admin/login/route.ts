import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE,
  checkAdminPassword,
  createAdminToken,
  getAdminSecret,
} from "@/app/lib/admin-auth";

const RATE_WINDOW_MS = 15 * 60 * 1000; // 15분
const MAX_FAILURES = 5;

const failuresByIp = new Map<string, { count: number; since: number }>();

function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",").at(-1)!.trim();
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
  const now = Date.now();

  // Prune expired failure records
  for (const [key, rec] of failuresByIp) {
    if (now - rec.since > RATE_WINDOW_MS) failuresByIp.delete(key);
  }

  const rec = failuresByIp.get(ip);
  if (rec && rec.count >= MAX_FAILURES) {
    return NextResponse.json(
      { error: "잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const password = (body as { password?: unknown }).password;
  if (typeof password !== "string" || !checkAdminPassword(password)) {
    const updated = { count: (rec?.count ?? 0) + 1, since: rec?.since ?? now };
    failuresByIp.set(ip, updated);
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  failuresByIp.delete(ip);
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
