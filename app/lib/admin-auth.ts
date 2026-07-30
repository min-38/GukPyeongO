import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// 관리자 세션: 비밀번호(ADMIN_PASSWORD) 확인 후 HMAC 서명된 토큰을 쿠키로 발급한다.
// 서명에는 서버 시크릿(SCORE_SIGNING_SECRET)을 재사용한다.
// (server-only 데이터를 import하지 않아 단위 테스트 가능)
//
// 같은 시크릿을 점수 토큰(score-token.ts)도 쓴다. 시크릿을 나누는 게 정석이지만
// 환경변수를 새로 심어야 해서, 대신 서명 대상 앞에 용도를 박아 둔다 —
// 이러면 점수 토큰 쪽에서 무엇을 서명하든 어드민 토큰과 같은 문자열이 될 수 없다.
const DOMAIN = "v1:admin";
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
  const payload = `${DOMAIN}.${exp}`;
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
  if (role !== DOMAIN) return false;
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
  // 길이가 다르면 safeEqual 이 timingSafeEqual 전에 빠져나가 비밀번호 길이가 새어 나간다.
  // 먼저 해시해서 길이를 같게 만든 뒤 견준다.
  const digest = (v: string) => createHash("sha256").update(v).digest("hex");
  return safeEqual(digest(input), digest(password));
}
