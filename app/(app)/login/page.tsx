import { redirect } from "next/navigation";

import { safeNext } from "@/app/lib/account";
import { getAuthUserId, pathAfterLogin } from "@/app/lib/account.server";

import AuthShell from "./AuthShell";
import LoginScreen from "./LoginScreen";

// 로그인 화면 (GUK-12). 개발 중에만 열린다(proxy.ts).
export const dynamic = "force-dynamic";

export const metadata = { title: "로그인", robots: { index: false } };

// 사용자가 취소한 것 말고는 원인(공급자 설정 오류, 코드 교환 실패 등)을 밝히지 않고 서버 오류 하나로 알린다.
const ERRORS = {
  cancel: "로그인을 취소했습니다.",
  server: "서버에 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
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
