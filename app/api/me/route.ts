import { NextResponse } from "next/server";

import { BIRTH_YEAR_MIN, NICKNAME_TAKEN_ERROR, nicknameError } from "@/app/lib/account";
import { createProfile, getAuthUserId } from "@/app/lib/account.server";

// 가입 마치기(A-03~A-05, A-13): 닉네임, 만 14세 이상 확인, 출생 연도(선택 동의)를 저장한다.
export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "다시 로그인해 주세요." }, { status: 401 });

  let body: { nickname?: unknown; ageConfirmed?: unknown; birthYear?: unknown; birthYearAgreed?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const formatError = nicknameError(body.nickname);
  if (formatError) return NextResponse.json({ error: formatError }, { status: 400 });
  if (body.ageConfirmed !== true) {
    return NextResponse.json({ error: "만 14세 이상인지 확인해 주세요." }, { status: 400 });
  }
  // 출생 연도는 수집에 동의했을 때만 받는다.
  const birthYear = body.birthYear ?? null;
  if (
    birthYear !== null &&
    (body.birthYearAgreed !== true ||
      !Number.isInteger(birthYear) ||
      (birthYear as number) < BIRTH_YEAR_MIN ||
      (birthYear as number) > new Date().getFullYear())
  ) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  try {
    const result = await createProfile(userId, body.nickname as string, birthYear as number | null);
    if (result === "taken") return NextResponse.json({ error: NICKNAME_TAKEN_ERROR }, { status: 409 });
    // 이미 가입했으면(두 번 누름 등) 그대로 둔다.
    return NextResponse.json({ ok: true }, { status: result === "created" ? 201 : 200 });
  } catch {
    return NextResponse.json({ error: "가입하지 못했습니다. 다시 시도해 주세요." }, { status: 500 });
  }
}
