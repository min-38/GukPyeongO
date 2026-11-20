// v2 문제 풀이 (GUK-3)와 문제 목록 (GUK-9). 서버와 화면이 같이 쓰는 형태와 규칙.
// 정답과 빈칸 글자는 여기 오지 않는다 — 서버(problems.server.ts)만 안다.

import { SCENARIO_KIND_LABELS, type ScenarioKind } from "./scenario-admin";

export const MAX_ANSWER_LENGTH = 50; // P-11

// 지문 속 빈칸 자리. 서버가 빈칸 글자를 이 표시로 바꿔 내려보낸다.
export const BLANK = "\u0000BLANK\u0000";

export type Level = 1 | 2 | 3;

// Level 마다 글자색이 다르다. 흰 바탕에서 4.5:1 이상.
export const LEVEL_CLASS = {
  1: "text-blue-600 dark:text-blue-400",
  2: "text-violet-700 dark:text-violet-400",
  3: "text-orange-700 dark:text-orange-400",
} as const;
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
  if (typeof raw !== "string") return { error: "답안을 입력해 주세요." };
  const answer = raw.trim();
  if (!answer) return { error: "답안을 입력해 주세요." };
  if (answer.length > MAX_ANSWER_LENGTH) {
    return { error: `답안은 ${MAX_ANSWER_LENGTH}자까지 쓸 수 있습니다.` };
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

// ── 문제 목록 (GUK-9, 문제 리스트 명세서) ──

export const LIST_PAGE_SIZE = 20; // L-08
export const MAX_QUERY_LENGTH = 50; // L-12
// 정렬과 필터를 이 브라우저에 저장하는 쿠키(L-09). 서버가 읽어야 해서 localStorage가 아니라 쿠키다.
export const LIST_FILTER_COOKIE = "problem_list";
// 목록에서 누른 문제 id. 풀이 화면의 뒤로 가기가 목록에서 왔는지 이걸로 안다.
export const FROM_LIST_KEY = "problems:fromList";

export const LIST_SORTS = { latest: "최신순", popular: "많이 푼 순", rate: "정답률 높은 순" } as const;
export type ListSort = keyof typeof LIST_SORTS;
export type ListStatus = "done" | "doing" | "todo";

export interface ListQuery {
  q: string;
  kind: ScenarioKind | null;
  level: Level | null;
  unsolved: boolean;
  sort: ListSort;
  page: number;
}

export interface ListRow {
  id: number;
  title: string;
  kind: string;
  level: Level;
  rate: number | null; // 제출한 사람이 없으면 null(L-05)
  status: ListStatus;
}

export interface ListResult {
  rows: ListRow[];
  total: number;
  kindCounts: Record<string, number>;
}

export const DEFAULT_LIST_QUERY: ListQuery = { q: "", kind: null, level: null, unsolved: false, sort: "latest", page: 1 };

type Params = Record<string, string | string[] | undefined>;
const LIST_KEYS = ["q", "kind", "level", "unsolved", "sort", "page"] as const;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// 주소의 조건을 읽는다. 잘못된 값은 기본값으로 바꾸고 invalid 로 알린다(예외 처리: 잘못된 주소 값).
export function parseListQuery(params: Params): { query: ListQuery; invalid: boolean } {
  const raw = Object.fromEntries(LIST_KEYS.map((k) => [k, first(params[k])]));
  const kind = raw.kind !== undefined && Object.hasOwn(SCENARIO_KIND_LABELS, raw.kind) ? (raw.kind as ScenarioKind) : null;
  const level = raw.level === "1" || raw.level === "2" || raw.level === "3" ? (Number(raw.level) as Level) : null;
  const unsolved = raw.unsolved === "1";
  const sort = raw.sort !== undefined && Object.hasOwn(LIST_SORTS, raw.sort) ? (raw.sort as ListSort) : "latest";
  const page = raw.page !== undefined && /^[1-9]\d{0,5}$/.test(raw.page) ? Number(raw.page) : 1;
  const invalid =
    (raw.kind !== undefined && !kind) ||
    (raw.level !== undefined && !level) ||
    (raw.unsolved !== undefined && !unsolved) ||
    (raw.sort !== undefined && sort !== raw.sort) ||
    (raw.page !== undefined && String(page) !== raw.page);
  const q = (raw.q ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  return { query: { q, kind, level, unsolved, sort, page }, invalid };
}

// 기본값은 주소에 쓰지 않는다.
export function listQueryToSearch(query: ListQuery): string {
  const s = new URLSearchParams();
  if (query.q) s.set("q", query.q);
  if (query.kind) s.set("kind", query.kind);
  if (query.level) s.set("level", String(query.level));
  if (query.unsolved) s.set("unsolved", "1");
  if (query.sort !== "latest") s.set("sort", query.sort);
  if (query.page > 1) s.set("page", String(query.page));
  return s.toString();
}

export function listHref(query: ListQuery): string {
  const s = listQueryToSearch(query);
  return s ? `/problems?${s}` : "/problems";
}

// 브라우저에 저장하는 것은 정렬과 필터뿐. 검색어와 페이지는 저장하지 않는다(L-09).
export function savedFilters(query: ListQuery): string {
  const { kind, level, unsolved, sort } = query;
  return listQueryToSearch({ ...DEFAULT_LIST_QUERY, kind, level, unsolved, sort });
}

export function hasListParams(params: Params): boolean {
  return LIST_KEYS.some((k) => params[k] !== undefined);
}

// 페이지 번호: 처음, 끝, 지금 페이지 앞뒤만 보이고 나머지는 '…'(gap). 한 칸만 빠지면 그 번호를 그대로 보인다.
export function pageItems(page: number, pages: number): (number | "gap")[] {
  const keep = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3].forEach((n) => keep.add(n));
  if (page >= pages - 2) [pages - 2, pages - 1].forEach((n) => keep.add(n));
  const nums = [...keep].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  nums.forEach((n, i) => {
    const gap = i > 0 ? n - nums[i - 1] : 1;
    if (gap === 2) out.push(n - 1);
    else if (gap > 2) out.push("gap");
    out.push(n);
  });
  return out;
}
