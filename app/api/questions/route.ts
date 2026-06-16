import { NextResponse } from "next/server";

import {
  getRandomPublicQuestions,
  getTypeLabelMap,
} from "@/app/lib/questions.server";
import { DEFAULT_QUIZ_MODE, isQuizMode, QUIZ_MODES } from "@/app/lib/quiz";
import { createQuizToken, getSigningSecret } from "@/app/lib/score-token";

// 문제 풀에서 모드별(빠른/정밀) 문항 수만큼 무작위 출제 + 출제 세트 서명 토큰 발급.
// 채점은 이 토큰의 문제 세트 기준으로만 수행된다(/api/score에서 검증).
export async function GET(request: Request) {
  const modeParam = new URL(request.url).searchParams.get("mode");
  const mode = isQuizMode(modeParam) ? modeParam : DEFAULT_QUIZ_MODE;
  const { size, mix } = QUIZ_MODES[mode];
  const [questions, typeLabels] = await Promise.all([
    getRandomPublicQuestions(size, mix),
    getTypeLabelMap(),
  ]);
  const quizToken = createQuizToken(
    questions.map((q) => q.id),
    getSigningSecret()
  );
  return NextResponse.json({ questions, quizToken, typeLabels });
}
