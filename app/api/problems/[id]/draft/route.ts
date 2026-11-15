import { NextResponse } from "next/server";

import { MAX_ANSWER_LENGTH } from "@/app/lib/problems";
import { getCurrentUserId, saveDraft } from "@/app/lib/problems.server";

// 쓰는 중인 답안 저장(P-07). 화면이 입력이 멈추고 1초 뒤에 부른다.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "찾을 수 없는 문제예요" }, { status: 404 });
  }
  const userId = getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "다시 로그인해 주세요" }, { status: 401 });

  let body: { answer?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  // 쓰는 중이라 빈 답안도 저장한다(다 지운 것도 남겨야 다시 들어왔을 때 맞다).
  if (typeof body.answer !== "string" || body.answer.length > MAX_ANSWER_LENGTH) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  try {
    await saveDraft(userId, id, body.answer);
    return new NextResponse(null, { status: 204 });
  } catch {
    // 없는 문제(FK 위반)도 여기로 온다. 임시 저장 실패는 화면이 조용히 넘긴다.
    return NextResponse.json({ error: "저장하지 못했어요" }, { status: 500 });
  }
}
