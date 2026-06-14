import { NextResponse } from "next/server";

import { getAnswerKey } from "@/app/lib/questions.server";
import type { ScoreRequestItem } from "@/app/lib/quiz";
import { scoreSubmission } from "@/app/lib/scoring";

function isValidItem(value: unknown): value is ScoreRequestItem {
  if (typeof value !== "object" || value === null) return false;
  const it = value as Record<string, unknown>;
  return (
    typeof it.questionId === "string" &&
    (it.choiceIndex === null || typeof it.choiceIndex === "number") &&
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

  const result = scoreSubmission(getAnswerKey(), items);
  return NextResponse.json(result);
}
