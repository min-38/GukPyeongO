import "server-only";

import { type PatchNote, type PatchType, PATCH_TYPES } from "./quiz";
import { getSupabaseAdmin } from "./supabase-admin.server";

interface Row {
  id: string;
  version: string;
  type: string;
  content: string;
  patched_at: string;
  created_at: string;
}

const COLS = "id, version, type, content, patched_at, created_at";

function toPatchNote(row: Row): PatchNote {
  return {
    id: row.id,
    version: row.version,
    type: PATCH_TYPES.includes(row.type as PatchType)
      ? (row.type as PatchType)
      : "fix",
    content: row.content,
    patchedAt: row.patched_at,
    createdAt: row.created_at,
  };
}

// 공개 패치노트 목록 (최신 패치 순). service-role로 조회하지만 민감 정보가
// 없으므로 공개 노출에 안전하다.
export async function getPatchNotes(): Promise<PatchNote[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("patch_notes")
    .select(COLS)
    .order("patched_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    throw new Error("패치노트를 불러오지 못했습니다.");
  }
  return ((data ?? []) as Row[]).map(toPatchNote);
}
