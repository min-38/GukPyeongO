import { NextResponse } from "next/server";

import { getPublicQuestions } from "@/app/lib/questions.server";

export async function GET() {
  return NextResponse.json({ questions: await getPublicQuestions() });
}
