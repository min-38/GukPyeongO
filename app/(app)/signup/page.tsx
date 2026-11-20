import { redirect } from "next/navigation";

import { birthYears, loginHref, safeNext } from "@/app/lib/account";
import { getAuthUserId, getProfile, suggestNickname } from "@/app/lib/account.server";

import AuthShell from "../login/AuthShell";
import SignupScreen from "./SignupScreen";

// 가입 화면 (GUK-12). 처음 로그인한 사용자가 닉네임을 정하고 가입을 마친다. 개발 중에만 열린다(proxy.ts).
export const dynamic = "force-dynamic";

export const metadata = { title: "가입", robots: { index: false } };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = safeNext((await searchParams).next);

  const userId = await getAuthUserId();
  if (!userId) redirect(loginHref(next));
  // 이미 가입했으면 가입 화면을 다시 보여 주지 않는다.
  if (await getProfile(userId)) redirect(next);

  return (
    <AuthShell>
      <SignupScreen next={next} initialNickname={await suggestNickname()} years={birthYears()} />
    </AuthShell>
  );
}
