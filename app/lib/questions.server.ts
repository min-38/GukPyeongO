import "server-only";

import {
  DIFFICULTY_MIX,
  pickStratified,
  type PublicQuestion,
  type QuestionFormat,
  type QuestionStat,
  type QuestionType,
} from "./quiz";
import type { AnswerKey, PerQuestionResult } from "./scoring";
import { getSupabaseAdmin } from "./supabase-admin.server";

// 정답을 포함한 서버 전용 문제 형태. service-role로만 조회하므로
// 정답(answerIndex/answers)은 클라이언트 번들/응답에 절대 포함되지 않는다.
export interface Question extends PublicQuestion {
  answerIndex: number;
  answers: string[];
  difficulty: number; // 1=쉬움, 2=보통, 3=어려움
}

interface QuestionRow {
  id: string;
  type: string;
  format: string | null;
  prompt: string;
  choices: string[];
  answer_index: number;
  answers: string[] | null;
  time_limit_sec: number;
  difficulty: number | null;
}

async function fetchQuestions(): Promise<Question[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, type, format, prompt, choices, answer_index, answers, time_limit_sec, difficulty"
    )
    .order("sort_order", { ascending: true });

  if (error) throw new Error("문제를 불러오지 못했습니다.");

  return (data ?? []).map((row: QuestionRow) => ({
    id: row.id,
    type: row.type as QuestionType,
    format: (row.format ?? "multiple_choice") as QuestionFormat,
    prompt: row.prompt,
    choices: row.choices,
    answerIndex: row.answer_index,
    answers: row.answers ?? [],
    timeLimitSec: row.time_limit_sec,
    difficulty: row.difficulty ?? 2,
  }));
}

// 관리자용: 정답 포함 전체 문제 (인증된 관리자에게만 노출)
export function getAdminQuestions(): Promise<Question[]> {
  return fetchQuestions();
}

// 유형 키 → 라벨 맵 (공개 화면 라벨 표시용). DB의 question_types가 정본.
export async function getTypeLabelMap(): Promise<Record<string, string>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("question_types")
    .select("key, label");
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const row of data as Array<{ key: string; label: string }>) {
    map[row.key] = row.label;
  }
  return map;
}

// 채점용 정답키 (questionId -> 유형/정답). 서버에서만 사용한다.
export async function getAnswerKey(): Promise<AnswerKey> {
  const questions = await fetchQuestions();
  const key: AnswerKey = {};
  for (const q of questions) {
    key[q.id] = {
      type: q.type,
      format: q.format,
      answerIndex: q.answerIndex,
      answers: q.answers,
    };
  }
  return key;
}

// 문항별 통계 (공개용). 정답은 포함하지 않고 prompt/시도/정답수/정답률만 반환.
export async function getQuestionStats(): Promise<QuestionStat[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("questions")
    .select("id, type, prompt, attempts, correct_count")
    .order("sort_order", { ascending: true });

  if (error) throw new Error("통계를 불러오지 못했습니다.");

  return (data ?? []).map((row) => {
    const attempts = row.attempts ?? 0;
    const correctCount = row.correct_count ?? 0;
    return {
      id: row.id as string,
      type: row.type as QuestionType,
      prompt: row.prompt as string,
      attempts,
      correctCount,
      correctRate:
        attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0,
    };
  });
}

// 응답한 문항들의 통계를 원자적으로 증가시킨다 (best-effort).
export async function bumpQuestionStats(
  results: PerQuestionResult[]
): Promise<void> {
  const updates = results
    .filter((r) => r.answered)
    .map((r) => ({ id: r.questionId, correct: r.correct }));
  if (updates.length === 0) return;
  const supabase = getSupabaseAdmin();
  await supabase.rpc("bump_question_stats", { updates });
}

// 정답(answerIndex/answers)을 제거한 형태로만 반환한다.
export async function getPublicQuestions(): Promise<PublicQuestion[]> {
  const questions = await fetchQuestions();
  return questions.map((q) => ({
    id: q.id,
    type: q.type,
    format: q.format,
    prompt: q.prompt,
    choices: q.choices,
    timeLimitSec: q.timeLimitSec,
  }));
}

// 문제 풀에서 n개 출제 (정답 제외). 난이도 분포·유형 분산을 보장하는 층화 샘플링.
// mix는 난이도 목표 분포(모드별로 다름). 풀이 n보다 적으면 있는 만큼.
export async function getRandomPublicQuestions(
  n: number,
  mix: Record<number, number> = DIFFICULTY_MIX
): Promise<PublicQuestion[]> {
  const all = await fetchQuestions();
  return pickStratified(all, n, mix).map((q) => ({
    id: q.id,
    type: q.type,
    format: q.format,
    prompt: q.prompt,
    choices: q.choices,
    timeLimitSec: q.timeLimitSec,
  }));
}

// 특정 문제 id들의 채점용 정답키 (출제 세트 채점에 사용).
export async function getAnswerKeyForIds(ids: string[]): Promise<AnswerKey> {
  if (ids.length === 0) return {};
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("questions")
    .select("id, type, format, answer_index, answers")
    .in("id", ids);
  if (error) throw new Error("문제를 불러오지 못했습니다.");

  const key: AnswerKey = {};
  for (const row of (data ?? []) as Array<{
    id: string;
    type: string;
    format: string | null;
    answer_index: number;
    answers: string[] | null;
  }>) {
    key[row.id] = {
      type: row.type as QuestionType,
      format: (row.format ?? "multiple_choice") as QuestionFormat,
      answerIndex: row.answer_index,
      answers: row.answers ?? [],
    };
  }
  return key;
}
