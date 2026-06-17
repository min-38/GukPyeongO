import { NextResponse } from "next/server";

import {
  MAX_REPORT_DETAIL_LENGTH,
  REPORT_REASONS,
  type ReportReason,
} from "@/app/lib/quiz";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

const POST_COOLDOWN_MS = 10_000;

// 비로그인 구조의 간단한 작성 빈도 제한 (IP별 쿨다운). 서버리스 인스턴스
// 단위 메모리라 완벽하진 않지만 MVP 수준의 남용 억제.
const lastPostByIp = new Map<string, number>();

function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",").at(-1)!.trim();
  return "unknown";
}

// 문제 오류 신고: { questionId, reason, detail? }
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { questionId, reason, detail } = (body ?? {}) as {
    questionId?: unknown;
    reason?: unknown;
    detail?: unknown;
  };

  if (typeof questionId !== "string" || questionId.trim().length === 0) {
    return NextResponse.json({ error: "문제 정보가 없습니다." }, { status: 400 });
  }
  if (!REPORT_REASONS.includes(reason as ReportReason)) {
    return NextResponse.json({ error: "신고 사유를 선택해주세요." }, { status: 400 });
  }
  if (detail !== undefined && detail !== null && typeof detail !== "string") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const trimmedDetail =
    typeof detail === "string" ? detail.trim().slice(0, MAX_REPORT_DETAIL_LENGTH) : null;

  const ip = clientIp(request);
  const now = Date.now();
  for (const [key, ts] of lastPostByIp) {
    if (now - ts > POST_COOLDOWN_MS) lastPostByIp.delete(key);
  }
  const last = lastPostByIp.get(ip);
  if (last && now - last < POST_COOLDOWN_MS) {
    return NextResponse.json(
      { error: "잠시 후 다시 신고해주세요." },
      { status: 429 }
    );
  }

  // 작성은 service-role로 수행 (anon 직접 쓰기는 RLS로 차단됨).
  // 존재하지 않는 questionId는 FK 제약으로 거부된다.
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("reports").insert({
    question_id: questionId,
    reason,
    detail: trimmedDetail && trimmedDetail.length > 0 ? trimmedDetail : null,
  });

  if (error) {
    return NextResponse.json(
      { error: "신고 접수에 실패했습니다." },
      { status: 400 }
    );
  }

  lastPostByIp.set(ip, now);
  return NextResponse.json({ ok: true }, { status: 201 });
}
