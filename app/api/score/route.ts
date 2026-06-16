import { NextResponse } from "next/server";

import {
  bumpQuestionStats,
  getAnswerKeyForIds,
  getTypeLabelMap,
} from "@/app/lib/questions.server";
import type { ScoreRequestItem } from "@/app/lib/quiz";
import {
  createGradeToken,
  getSigningSecret,
  verifyQuizToken,
} from "@/app/lib/score-token";
import { perQuestionResults, scoreSubmission } from "@/app/lib/scoring";

function isValidItem(value: unknown): value is ScoreRequestItem {
  if (typeof value !== "object" || value === null) return false;
  const it = value as Record<string, unknown>;
  return (
    typeof it.questionId === "string" &&
    (it.choiceIndex === null || typeof it.choiceIndex === "number") &&
    (it.text === null ||
      it.text === undefined ||
      typeof it.text === "string") &&
    typeof it.reactionMs === "number"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items) || !items.every(isValidItem)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // 출제 세트 토큰 검증 — 채점은 실제 출제된 문제 세트 기준으로만 수행한다.
  const quizToken = (body as { quizToken?: unknown }).quizToken;
  const servedIds =
    typeof quizToken === "string"
      ? verifyQuizToken(quizToken, getSigningSecret())
      : null;
  if (!servedIds) {
    return NextResponse.json(
      { error: "출제 정보가 유효하지 않습니다. 테스트를 다시 시작해주세요." },
      { status: 400 }
    );
  }

  const answerKey = await getAnswerKeyForIds(servedIds);
  const result = scoreSubmission(answerKey, items);
  const perQ = perQuestionResults(answerKey, items);

  // 문항별 통계 집계 (실패해도 채점 결과 반환에는 영향 주지 않음)
  try {
    await bumpQuestionStats(perQ);
  } catch {
    // 통계 갱신 실패는 무시
  }

  const gradeToken = createGradeToken(result.grade, getSigningSecret());
  const perQuestion = perQ.map((p) => ({
    questionId: p.questionId,
    correct: p.correct,
  }));
  const typeLabels = await getTypeLabelMap();
  return NextResponse.json({ ...result, gradeToken, perQuestion, typeLabels });
}
