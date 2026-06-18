import { NextResponse } from "next/server";

import {
  type Comment,
  MAX_COMMENT_LENGTH,
  MAX_NICKNAME_LENGTH,
  maskIp,
  randomNickname,
} from "@/app/lib/quiz";
import { getSigningSecret, verifyGradeToken } from "@/app/lib/score-token";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin.server";

const LIST_LIMIT = 50;
const POST_COOLDOWN_MS = 10_000;

// 비로그인 구조의 간단한 작성 빈도 제한 (IP별 쿨다운).
// 서버리스 인스턴스 단위 메모리라 완벽하진 않지만 MVP 수준의 남용 억제.
const lastPostByIp = new Map<string, number>();

function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",").at(-1)!.trim();
  return "unknown";
}

function toComment(row: {
  id: string;
  content: string;
  grade: number;
  nickname: string | null;
  ip_masked: string | null;
  created_at: string;
}): Comment {
  return {
    id: row.id,
    content: row.content,
    grade: row.grade,
    nickname: row.nickname ?? "아무개",
    ipMasked: row.ip_masked ?? "비공개",
    createdAt: row.created_at,
  };
}

const COLS = "id, content, grade, nickname, ip_masked, created_at";

// 댓글 조회: ?grade=all (전체) | 1~9 (같은 등급 댓글방)
export async function GET(request: Request) {
  const gradeParam = new URL(request.url).searchParams.get("grade") ?? "all";

  // ip_masked는 이미 마스킹된 값이라 공개 안전. service-role로 조회.
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("comments")
    .select(COLS)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (gradeParam !== "all") {
    const grade = Number(gradeParam);
    if (!Number.isInteger(grade) || grade < 1 || grade > 9) {
      return NextResponse.json({ error: "잘못된 등급입니다." }, { status: 400 });
    }
    query = query.eq("grade", grade);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "댓글을 불러오지 못했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ comments: (data ?? []).map(toComment) });
}

// 댓글 작성: { content, gradeToken } — 등급은 서명 토큰에서만 신뢰
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { content, gradeToken, nickname } = (body ?? {}) as {
    content?: unknown;
    gradeToken?: unknown;
    nickname?: unknown;
  };

  if (typeof gradeToken !== "string") {
    return NextResponse.json({ error: "등급 정보가 없습니다." }, { status: 400 });
  }
  const grade = verifyGradeToken(gradeToken, getSigningSecret());
  if (grade === null) {
    return NextResponse.json(
      { error: "등급 정보가 유효하지 않습니다. 테스트를 다시 진행해주세요." },
      { status: 401 }
    );
  }

  if (typeof content !== "string") {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `댓글은 ${MAX_COMMENT_LENGTH}자까지 작성할 수 있어요.` },
      { status: 400 }
    );
  }

  // 닉네임: 입력값 사용, 비어 있으면 랜덤 폴백, 길이 제한 (중복 허용)
  const rawNick = typeof nickname === "string" ? nickname.trim() : "";
  const nick = (rawNick.length > 0 ? rawNick : randomNickname()).slice(
    0,
    MAX_NICKNAME_LENGTH
  );

  const ip = clientIp(request);
  const now = Date.now();
  for (const [key, ts] of lastPostByIp) {
    if (now - ts > POST_COOLDOWN_MS) lastPostByIp.delete(key);
  }
  const last = lastPostByIp.get(ip);
  if (last && now - last < POST_COOLDOWN_MS) {
    return NextResponse.json(
      { error: "잠시 후 다시 작성해주세요." },
      { status: 429 }
    );
  }

  // 로컬 개발 환경에서는 prod DB 오염 방지를 위해 insert를 건너뛰고
  // 입력값 기반 합성 댓글을 반환한다 (UI 동작은 그대로 확인 가능).
  if (process.env.NODE_ENV === "development") {
    lastPostByIp.set(ip, now);
    return NextResponse.json(
      {
        comment: toComment({
          id: crypto.randomUUID(),
          content: trimmed,
          grade,
          nickname: nick,
          ip_masked: maskIp(ip),
          created_at: new Date().toISOString(),
        }),
      },
      { status: 201 }
    );
  }

  // 작성은 service-role로 수행 (anon 직접 쓰기는 RLS로 차단됨).
  // 닉네임은 서버에서 자동 생성, IP는 원본을 저장하지 않고 마스킹값만 저장한다.
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      content: trimmed,
      grade,
      nickname: nick,
      ip_masked: maskIp(ip),
    })
    .select(COLS)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "댓글 작성에 실패했습니다." },
      { status: 500 }
    );
  }

  lastPostByIp.set(ip, now);
  return NextResponse.json({ comment: toComment(data) }, { status: 201 });
}
