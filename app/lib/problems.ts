// v2 문제 풀이 (GUK-3). 서버와 화면이 같이 쓰는 형태와 규칙.
// 정답과 빈칸 글자는 여기 오지 않는다 — 서버(problems.server.ts)만 안다.

export const MAX_ANSWER_LENGTH = 50; // P-11

// 지문 속 빈칸 자리. 서버가 빈칸 글자를 이 표시로 바꿔 내려보낸다.
export const BLANK = "\u0000BLANK\u0000";

export type Level = 1 | 2 | 3;
export type LastResult = "correct" | "wrong" | null;

export interface ProblemPassage {
  kind: string;
  source: string;
  title: string;
  body: string[];
}

export interface ProblemMine {
  solved: boolean;
  lastResult: LastResult;
  draft: string;
  submissionCount: number;
}

export interface ProblemView {
  id: number;
  title: string;
  level: Level;
  points: number;
  prompt: string;
  notes: string[];
  passage: ProblemPassage;
  me: ProblemMine | null; // null = 비로그인
}

export interface SubmitResult {
  isCorrect: boolean;
  pointsAwarded: number;
  totalScore: number;
}

export interface SubmissionRow {
  answer: string;
  isCorrect: boolean;
  createdAt: string;
}

// 제출 전 답안 확인. 앞뒤 공백은 지우고 본다(P-04).
export function checkAnswer(raw: unknown): { answer: string } | { error: string } {
  if (typeof raw !== "string") return { error: "답안을 입력해 주세요" };
  const answer = raw.trim();
  if (!answer) return { error: "답안을 입력해 주세요" };
  if (answer.length > MAX_ANSWER_LENGTH) {
    return { error: `답안은 ${MAX_ANSWER_LENGTH}자까지 쓸 수 있어요` };
  }
  return { answer };
}

// 지문 속 빈칸 글자를 BLANK 표시로 바꾼다. 처음 나온 한 곳만 바꾼다.
// 빈칸 글자를 못 찾으면 출제 실수다 — 빈칸 없는 문제를 몰래 내보내지 않고 멈춘다.
export function fillBlank(body: string[], blank: string | undefined): string[] {
  if (!blank) return body;
  const i = body.findIndex((line) => line.includes(blank));
  if (i < 0) throw new Error(`지문에 빈칸 글자 "${blank}"가 없습니다`);
  return body.map((line, j) => (j === i ? line.replace(blank, BLANK) : line));
}
