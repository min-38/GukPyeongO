import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { type NicknameCheck, nicknameError, signupHref } from "@/app/lib/account";
import { randomNickname } from "@/app/lib/quiz";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

// 로그인 세션을 쿠키로 다루는 서버 클라이언트. 토큰을 만들거나 서명하지 않고 Supabase Auth가 준 것을 쓴다.
// 서버 컴포넌트에서는 쿠키를 쓸 수 없어 setAll이 실패한다 — 만료 토큰 갱신은 proxy.ts가 맡는다.
export async function createSupabaseServer() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            for (const { name, value, options } of list) store.set(name, value, options);
          } catch {
            // 서버 컴포넌트에서 부르면 쓸 수 없다. proxy.ts가 갱신한다.
          }
        },
      },
    },
  );
}

// 소셜 로그인을 마친 사용자 id. 쿠키를 그대로 믿지 않고 토큰을 검증한다(getClaims).
export async function getAuthUserId(): Promise<string | null> {
  const { data } = await (await createSupabaseServer()).auth.getClaims();
  return data?.claims?.sub ?? null;
}

export async function getProfile(userId: string): Promise<{ nickname: string } | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("nickname")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// 가입까지 마친 사용자. 가입 전이면 비로그인과 같다(A-06).
export async function getCurrentProfile(): Promise<{ userId: string; nickname: string } | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;
  const profile = await getProfile(userId);
  return profile ? { userId, nickname: profile.nickname } : null;
}

// 로그인한 뒤 갈 곳. 가입을 마치지 않았으면 가입 화면을 거친다(A-03, A-07).
export async function pathAfterLogin(userId: string, next: string): Promise<string> {
  return (await getProfile(userId)) ? next : signupHref(next);
}

// 영문 대소문자만 다른 닉네임도 같은 닉네임이다. 형식을 통과한 글자에는 ilike 특수 문자가 없다.
export async function isNicknameTaken(nickname: string): Promise<boolean> {
  const { count, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("user_id", { count: "exact", head: true })
    .ilike("nickname", nickname);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function checkNickname(nickname: unknown): Promise<NicknameCheck> {
  if (nicknameError(nickname)) return { available: false, reason: "format" };
  return (await isNicknameTaken(nickname as string)) ? { available: false, reason: "taken" } : { available: true };
}

// 가입 화면에 미리 채울 닉네임(A-03). 이미 쓰이면 다시 뽑는다.
export async function suggestNickname(): Promise<string> {
  let nickname = randomNickname();
  for (let i = 0; i < 5 && (await isNicknameTaken(nickname)); i++) nickname = randomNickname();
  return nickname;
}

export type CreateProfileResult = "created" | "exists" | "taken";

export async function createProfile(
  userId: string,
  nickname: string,
  birthYear: number | null,
): Promise<CreateProfileResult> {
  const now = new Date().toISOString();
  const { error } = await getSupabaseAdmin().from("profiles").insert({
    user_id: userId,
    nickname,
    age_confirmed_at: now,
    birth_year: birthYear,
    birth_year_agreed_at: birthYear === null ? null : now,
  });
  if (!error) return "created";
  if (error.code === "23505") return error.message.includes("profiles_pkey") ? "exists" : "taken";
  throw error;
}
