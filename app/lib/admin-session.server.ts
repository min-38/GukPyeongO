import "server-only";

import { cookies } from "next/headers";

import {
  ADMIN_COOKIE,
  getAdminSecret,
  verifyAdminToken,
} from "./admin-auth";

// 현재 요청이 인증된 관리자 세션인지 확인한다. (서버 컴포넌트/라우트 핸들러 전용)
export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!token && verifyAdminToken(token, getAdminSecret());
}
