import { NextResponse } from "next/server";

import {
  getRandomPublicQuestions,
  getTypeLabelMap,
} from "@/app/lib/questions.server";
import { QUIZ_SIZE } from "@/app/lib/quiz";
import { createQuizToken, getSigningSecret } from "@/app/lib/score-token";

// 문제 풀에서 무작위 QUIZ_SIZE개 출제 + 출제 세트 서명 토큰 발급.
// 채점은 이 토큰의 문제 세트 기준으로만 수행된다(/api/score에서 검증).
export async function GET() {
  const [questions, typeLabels] = await Promise.all([
    getRandomPublicQuestions(QUIZ_SIZE),
    getTypeLabelMap(),
  ]);
  const quizToken = createQuizToken(
    questions.map((q) => q.id),
    getSigningSecret()
  );
  return NextResponse.json({ questions, quizToken, typeLabels });
}
