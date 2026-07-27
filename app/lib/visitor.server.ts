import "server-only";

import { cookies } from "next/headers";

// 익명 방문자 식별자 (#91).
// 로그인이 없고 개인을 특정할 이유도 없어서, 브라우저에 무작위 값 하나만 심는다.
// 지우면 새 사람으로 잡히지만 운영 지표(오늘 몇 명이 풀었나) 용도라 그걸로 충분하다.
export const VISITOR_COOKIE = "gukpyeongo_vid";
const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

// 기존 식별자를 읽고, 없으면 만들어 심는다. 라우트 핸들러에서만 쓴다(쿠키를 쓰므로).
export async function getOrCreateVisitorId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  jar.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: ONE_YEAR_SEC,
    path: "/",
  });
  return id;
}

// 이미 심긴 식별자만 읽는다(없으면 null). 서버 컴포넌트에서도 안전하다.
export async function readVisitorId(): Promise<string | null> {
  return (await cookies()).get(VISITOR_COOKIE)?.value ?? null;
}
