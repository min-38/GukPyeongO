import { createHmac, timingSafeEqual } from "node:crypto";

// 채점 결과의 등급을 위변조 불가능한 토큰으로 서명한다.
// /api/score가 발급하고 /api/comments(작성)가 검증해, 댓글에 붙는 등급이
// 실제 서버 채점 결과임을 보장한다. (server-only 데이터를 import하지 않아 단위 테스트 가능)
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1시간

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createGradeToken(
  grade: number,
  secret: string,
  now = Date.now()
): string {
  const exp = now + TOKEN_TTL_MS;
  const payload = `${grade}.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

// 유효하면 등급(1~9)을 반환, 아니면 null.
export function verifyGradeToken(
  token: string,
  secret: string,
  now = Date.now()
): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [gradeStr, expStr, sig] = parts;

  const expected = sign(`${gradeStr}.${expStr}`, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < now) return null;

  const grade = Number(gradeStr);
  if (!Number.isInteger(grade) || grade < 1 || grade > 9) return null;
  return grade;
}

export function getSigningSecret(): string {
  const secret = process.env.SCORE_SIGNING_SECRET;
  if (!secret) throw new Error("SCORE_SIGNING_SECRET is not set");
  return secret;
}
