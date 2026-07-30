import { createHmac, timingSafeEqual } from "node:crypto";

// 채점 결과의 등급을 위변조 불가능한 토큰으로 서명한다.
// /api/score가 발급하고 /api/comments(작성)가 검증해, 댓글에 붙는 등급이
// 실제 서버 채점 결과임을 보장한다. (server-only 데이터를 import하지 않아 단위 테스트 가능)
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1시간

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

// 어느 회차를 풀고 받은 등급인지도 함께 서명한다(#100) — 댓글이 그 회차에 달린다.
// uuid는 '.'을 포함하지 않으므로 구분자와 충돌하지 않는다. v1 경로(/api/score)는 회차가 없어 빈 칸이다.
export function createGradeToken(
  grade: number,
  roundId: string | null,
  secret: string,
  now = Date.now()
): string {
  const exp = now + TOKEN_TTL_MS;
  const payload = `${grade}.${roundId ?? ""}.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

// 유효하면 등급(1~9)과 회차를 반환, 아니면 null.
// 회차 칸이 없던 옛 토큰(3조각)은 여기서 걸러진다 — 유효기간이 1시간이라 곧 사라진다.
export function verifyGradeToken(
  token: string,
  secret: string,
  now = Date.now()
): { grade: number; roundId: string | null } | null {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [gradeStr, roundId, expStr, sig] = parts;

  const expected = sign(`${gradeStr}.${roundId}.${expStr}`, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < now) return null;

  const grade = Number(gradeStr);
  if (!Number.isInteger(grade) || grade < 1 || grade > 9) return null;
  return { grade, roundId: roundId === "" ? null : roundId };
}

// 출제 세트 토큰: 무작위 출제된 문제 id 목록을 서명한다.
// /api/questions가 발급하고 /api/score가 검증해, 채점을 "실제 출제된 세트"
// 기준으로만 수행한다(문항 일부만 제출해 등급 부풀리기 등 변조 방지).
// uuid는 '.'을 포함하지 않으므로 '.' 구분자와 충돌하지 않는다.
export function createQuizToken(
  questionIds: string[],
  secret: string,
  now = Date.now()
): string {
  const exp = now + TOKEN_TTL_MS;
  const payload = `${questionIds.join(",")}.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

// 유효하면 출제된 문제 id 배열을 반환, 아니면 null.
export function verifyQuizToken(
  token: string,
  secret: string,
  now = Date.now()
): string[] | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [ids, expStr, sig] = parts;

  const expected = sign(`${ids}.${expStr}`, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < now) return null;

  if (ids.length === 0) return null;
  return ids.split(",");
}

export function getSigningSecret(): string {
  const secret = process.env.SCORE_SIGNING_SECRET;
  if (!secret) throw new Error("SCORE_SIGNING_SECRET is not set");
  return secret;
}
