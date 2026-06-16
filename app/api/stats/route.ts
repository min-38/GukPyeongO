import { NextResponse } from "next/server";

import {
  getQuestionStats,
  getTypeLabelMap,
} from "@/app/lib/questions.server";

// 문항별 통계(맞춘 사람 수·정답률) 공개 조회. 정답은 포함하지 않는다.
export async function GET() {
  try {
    const [stats, typeLabels] = await Promise.all([
      getQuestionStats(),
      getTypeLabelMap(),
    ]);
    return NextResponse.json({ stats, typeLabels });
  } catch {
    return NextResponse.json(
      { error: "통계를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
