import { NextResponse } from "next/server";

import { getPublicQuestions } from "@/app/lib/questions.server";

export function GET() {
  return NextResponse.json({ questions: getPublicQuestions() });
}
