import { NextResponse } from "next/server";

import {
  INQUIRY_KINDS,
  type InquiryKind,
  MAX_INQUIRY_CONTACT_LENGTH,
  MAX_INQUIRY_LENGTH,
  maskIp,
} from "@/app/lib/quiz";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

// 문의 접수. 여태 푸터의 mailto 로 받던 것을 어드민으로 직접 받는다.
// 로그인이 없으므로 답장받을 곳은 본인이 적어 넣는다 — 비워 둬도 접수는 된다.

const POST_COOLDOWN_MS = 30_000;

// ponytail: 신고·댓글과 같은 방식의 인스턴스 메모리 쿨다운이다.
// 문의는 빈도가 낮아 이 정도로 충분하다. 남용이 보이면 admin_login_failures 처럼 DB로 옮긴다.
const lastPostByIp = new Map<string, number>();

function clientIp(request: Request): string {
  // 프록시가 붙이는 목록에서 맨 앞이 실제 클라이언트다.
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { kind, message, contact, path } = (body ?? {}) as {
    kind?: unknown;
    message?: unknown;
    contact?: unknown;
    path?: unknown;
  };

  if (!INQUIRY_KINDS.includes(kind as InquiryKind)) {
    return NextResponse.json(
      { error: "문의 종류를 선택해주세요." },
      { status: 400 },
    );
  }
  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "내용을 적어주세요." }, { status: 400 });
  }

  const trimmed = message.trim().slice(0, MAX_INQUIRY_LENGTH);
  const trimmedContact =
    typeof contact === "string" && contact.trim().length > 0
      ? contact.trim().slice(0, MAX_INQUIRY_CONTACT_LENGTH)
      : null;
  // 어느 화면에서 썼는지만 남긴다. 주소를 그대로 믿지 않고 길이를 자른다.
  const fromPath =
    typeof path === "string" && path.startsWith("/") ? path.slice(0, 120) : null;

  const ip = clientIp(request);
  const now = Date.now();
  for (const [key, ts] of lastPostByIp) {
    if (now - ts > POST_COOLDOWN_MS) lastPostByIp.delete(key);
  }
  const last = lastPostByIp.get(ip);
  if (last && now - last < POST_COOLDOWN_MS) {
    return NextResponse.json(
      { error: "잠시 후 다시 보내주세요." },
      { status: 429 },
    );
  }

  const { error } = await getSupabaseAdmin().from("inquiries").insert({
    kind,
    message: trimmed,
    contact: trimmedContact,
    path: fromPath,
    // 원본 IP는 남기지 않는다. 남용을 가려낼 만큼만 둔다(댓글과 같은 방식).
    ip_masked: maskIp(ip),
  });

  if (error) {
    return NextResponse.json(
      { error: "접수하지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }

  lastPostByIp.set(ip, now);
  return NextResponse.json({ ok: true }, { status: 201 });
}
