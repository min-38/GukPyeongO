import { NextResponse } from "next/server";

import { checkAnswer } from "@/app/lib/problems";
import { getCurrentUserId, listSubmissions, submitAnswer } from "@/app/lib/problems.server";

// 답안 제출과 채점(POST), 내 제출 이력(GET). 정답은 어느 응답에도 담지 않는다(P-03).

function problemId(raw: string) {
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = problemId((await params).id);
  if (!id) return NextResponse.json({ error: "찾을 수 없는 문제입니다." }, { status: 404 });
  const userId = getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "다시 로그인해 주세요." }, { status: 401 });

  try {
    return NextResponse.json({ submissions: await listSubmissions(userId, id) });
  } catch {
    return NextResponse.json({ error: "이력을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = problemId((await params).id);
  if (!id) return NextResponse.json({ error: "찾을 수 없는 문제입니다." }, { status: 404 });
  const userId = getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "다시 로그인해 주세요." }, { status: 401 });

  let body: { answer?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const checked = checkAnswer(body.answer);
  if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });

  try {
    const outcome = await submitAnswer(userId, id, checked.answer);
    if (outcome.status !== "ok") {
      return outcome.status === "too_fast"
        ? NextResponse.json({ error: "잠시 후 다시 제출해 주세요." }, { status: 429 })
        : NextResponse.json({ error: "찾을 수 없는 문제입니다." }, { status: 404 });
    }
    return NextResponse.json(outcome.result);
  } catch {
    return NextResponse.json({ error: "제출하지 못했습니다. 다시 시도해 주세요." }, { status: 500 });
  }
}
