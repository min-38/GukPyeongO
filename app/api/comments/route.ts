import { NextResponse } from "next/server";

import { type Comment, MAX_COMMENT_LENGTH } from "@/app/lib/quiz";
import { getSigningSecret, verifyGradeToken } from "@/app/lib/score-token";
import { getSupabase } from "@/app/lib/supabase.server";

const LIST_LIMIT = 50;
const POST_COOLDOWN_MS = 10_000;

// 비로그인 구조의 간단한 작성 빈도 제한 (IP별 쿨다운).
// 서버리스 인스턴스 단위 메모리라 완벽하진 않지만 MVP 수준의 남용 억제.
const lastPostByIp = new Map<string, number>();

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function toComment(row: {
  id: string;
  content: string;
  grade: number;
  created_at: string;
}): Comment {
  return {
    id: row.id,
    content: row.content,
    grade: row.grade,
    createdAt: row.created_at,
  };
}

// 댓글 조회: ?grade=all (전체) | 1~9 (같은 등급 댓글방)
export async function GET(request: Request) {
  const gradeParam = new URL(request.url).searchParams.get("grade") ?? "all";

  const supabase = getSupabase();
  let query = supabase
    .from("comments")
    .select("id, content, grade, created_at")
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

  const { content, gradeToken } = (body ?? {}) as {
    content?: unknown;
    gradeToken?: unknown;
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

  const ip = clientIp(request);
  const now = Date.now();
  const last = lastPostByIp.get(ip);
  if (last && now - last < POST_COOLDOWN_MS) {
    return NextResponse.json(
      { error: "잠시 후 다시 작성해주세요." },
      { status: 429 }
    );
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("comments")
    .insert({ content: trimmed, grade })
    .select("id, content, grade, created_at")
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
