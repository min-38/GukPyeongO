import "server-only";

import type { PublicQuestion, QuestionType } from "./quiz";
import type { AnswerKey } from "./scoring";
import { getSupabaseAdmin } from "./supabase-admin.server";

// 정답을 포함한 서버 전용 문제 형태. service-role로만 조회하므로
// 정답(answerIndex)은 클라이언트 번들/응답에 절대 포함되지 않는다.
export interface Question extends PublicQuestion {
  answerIndex: number;
}

interface QuestionRow {
  id: string;
  type: string;
  prompt: string;
  choices: string[];
  answer_index: number;
  time_limit_sec: number;
}

async function fetchQuestions(): Promise<Question[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("questions")
    .select("id, type, prompt, choices, answer_index, time_limit_sec")
    .order("sort_order", { ascending: true });

  if (error) throw new Error("문제를 불러오지 못했습니다.");

  return (data ?? []).map((row: QuestionRow) => ({
    id: row.id,
    type: row.type as QuestionType,
    prompt: row.prompt,
    choices: row.choices,
    answerIndex: row.answer_index,
    timeLimitSec: row.time_limit_sec,
  }));
}

// 관리자용: 정답 포함 전체 문제 (인증된 관리자에게만 노출)
export function getAdminQuestions(): Promise<Question[]> {
  return fetchQuestions();
}

// 채점용 정답키 (questionId -> 유형/정답). 서버에서만 사용한다.
export async function getAnswerKey(): Promise<AnswerKey> {
  const questions = await fetchQuestions();
  const key: AnswerKey = {};
  for (const q of questions) {
    key[q.id] = { type: q.type, answerIndex: q.answerIndex };
  }
  return key;
}

// 정답(answerIndex)을 제거한 형태로만 반환한다.
export async function getPublicQuestions(): Promise<PublicQuestion[]> {
  const questions = await fetchQuestions();
  return questions.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    choices: q.choices,
    timeLimitSec: q.timeLimitSec,
  }));
}
