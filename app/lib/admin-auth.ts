import { createHmac, timingSafeEqual } from "node:crypto";

// 관리자 세션: 비밀번호(ADMIN_PASSWORD) 확인 후 HMAC 서명된 토큰을 쿠키로 발급한다.
// 서명에는 서버 시크릿(SCORE_SIGNING_SECRET)을 재사용한다.
// (server-only 데이터를 import하지 않아 단위 테스트 가능)
export const ADMIN_COOKIE = "admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12시간

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function createAdminToken(secret: string, now = Date.now()): string {
  const exp = now + SESSION_TTL_MS;
  const payload = `admin.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyAdminToken(
  token: string,
  secret: string,
  now = Date.now()
): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expStr, sig] = parts;
  if (role !== "admin") return false;
  if (!safeEqual(sig, sign(`${role}.${expStr}`, secret))) return false;
  const exp = Number(expStr);
  return Number.isFinite(exp) && exp >= now;
}

export function getAdminSecret(): string {
  const secret = process.env.SCORE_SIGNING_SECRET;
  if (!secret) throw new Error("SCORE_SIGNING_SECRET is not set");
  return secret;
}

export function checkAdminPassword(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is not set");
  return safeEqual(input, password);
}
