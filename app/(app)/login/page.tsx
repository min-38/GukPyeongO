import { redirect } from "next/navigation";

import { safeNext, SERVER_ERROR } from "@/app/lib/account";
import { getAuthUserId, pathAfterLogin } from "@/app/lib/account.server";

import AuthShell from "./AuthShell";
import LoginScreen from "./LoginScreen";

// 로그인 화면 (GUK-12). 개발 중에만 열린다(proxy.ts).
export const dynamic = "force-dynamic";

export const metadata = { title: "로그인", robots: { index: false } };

// 소셜 로그인 페이지에서 돌아온 뒤(/auth/callback)의 결과. 그 밖의 오류는 로그인 화면이 직접 띄운다.
const ERRORS = {
  cancel: "로그인을 취소했습니다.",
  server: SERVER_ERROR,
} as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  // 이미 로그인했으면 돌아갈 화면으로, 가입 전이면 가입 화면으로 보낸다(A-06).
  const userId = await getAuthUserId();
  if (userId) redirect(await pathAfterLogin(userId, next));

  const error = typeof params.error === "string" && params.error in ERRORS
    ? ERRORS[params.error as keyof typeof ERRORS]
    : null;

  return (
    <AuthShell>
      <LoginScreen next={next} error={error} />
    </AuthShell>
  );
}
