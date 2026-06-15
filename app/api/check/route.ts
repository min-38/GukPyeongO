import { NextResponse } from "next/server";

import { getAnswerKeyForIds } from "@/app/lib/questions.server";
import type { ScoreRequestItem } from "@/app/lib/quiz";
import { getSigningSecret, verifyQuizToken } from "@/app/lib/score-token";
import { scoreSubmission } from "@/app/lib/scoring";

// 풀이 중 즉시 정답/오답 확인. 정답 내용은 절대 반환하지 않고 맞음/틀림(1비트)만 반환.
// 출제 토큰으로 "출제된 문항"만 확인 가능하게 제한.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { questionId, choiceIndex, text, quizToken } = (body ?? {}) as {
    questionId?: unknown;
    choiceIndex?: unknown;
    text?: unknown;
    quizToken?: unknown;
  };

  if (typeof questionId !== "string") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (choiceIndex !== null && choiceIndex !== undefined && typeof choiceIndex !== "number") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (text !== null && text !== undefined && typeof text !== "string") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const servedIds =
    typeof quizToken === "string"
      ? verifyQuizToken(quizToken, getSigningSecret())
      : null;
  if (!servedIds || !servedIds.includes(questionId)) {
    return NextResponse.json(
      { error: "출제 정보가 유효하지 않습니다." },
      { status: 400 }
    );
  }

  const answerKey = await getAnswerKeyForIds([questionId]);
  if (!answerKey[questionId]) {
    return NextResponse.json({ error: "문제를 찾을 수 없습니다." }, { status: 404 });
  }

  const item: ScoreRequestItem = {
    questionId,
    choiceIndex: typeof choiceIndex === "number" ? choiceIndex : null,
    text: typeof text === "string" ? text : null,
    reactionMs: 0,
  };
  const correct = scoreSubmission(answerKey, [item]).correctCount === 1;
  return NextResponse.json({ correct });
}
