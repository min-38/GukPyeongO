import { describe, expect, it } from "vitest";

import {
  BLANK,
  checkAnswer,
  DEFAULT_LIST_QUERY,
  fillBlank,
  hasListParams,
  listHref,
  MAX_ANSWER_LENGTH,
  pageItems,
  parseListQuery,
  savedFilters,
} from "./problems";

describe("checkAnswer", () => {
  it("앞뒤 공백을 지운다", () => {
    expect(checkAnswer("  이용 ")).toEqual({ answer: "이용" });
  });

  it("가운데 띄어쓰기는 그대로 둔다", () => {
    expect(checkAnswer("낮 12시")).toEqual({ answer: "낮 12시" });
  });

  it("비었거나 공백뿐이면 막는다", () => {
    expect(checkAnswer("")).toEqual({ error: "답안을 입력해 주세요." });
    expect(checkAnswer("   ")).toEqual({ error: "답안을 입력해 주세요." });
    expect(checkAnswer(undefined)).toEqual({ error: "답안을 입력해 주세요." });
  });

  it("50자를 넘으면 막는다", () => {
    expect(checkAnswer("가".repeat(MAX_ANSWER_LENGTH))).toEqual({
      answer: "가".repeat(MAX_ANSWER_LENGTH),
    });
    expect("error" in checkAnswer("가".repeat(MAX_ANSWER_LENGTH + 1))).toBe(true);
  });
});

describe("fillBlank", () => {
  const body = ["승강기를 이용할 수 없으니", "계단을 이용해 주세요"];

  it("처음 나온 한 곳만 빈칸으로 바꾼다", () => {
    expect(fillBlank(body, "이용")).toEqual([
      `승강기를 ${BLANK}할 수 없으니`,
      "계단을 이용해 주세요",
    ]);
  });

  it("빈칸 글자가 지문에 남지 않는다 (한 번만 나올 때)", () => {
    const out = fillBlank(["점검 중 운행 중지"], "운행");
    expect(out.join("")).not.toContain("운행");
  });

  it("빈칸이 없는 문제는 지문을 그대로 둔다", () => {
    expect(fillBlank(body, undefined)).toBe(body);
  });

  it("빈칸 글자를 못 찾으면 멈춘다", () => {
    expect(() => fillBlank(body, "운행")).toThrow();
  });
});

describe("parseListQuery", () => {
  it("조건이 없으면 기본값(최신순, 전체, 1페이지)", () => {
    expect(parseListQuery({})).toEqual({ query: DEFAULT_LIST_QUERY, invalid: false });
  });

  it("맞는 값은 그대로 읽는다", () => {
    const { query, invalid } = parseListQuery({ q: " 사과 ", kind: "chat", level: "2", unsolved: "1", sort: "rate", page: "3" });
    expect(invalid).toBe(false);
    expect(query).toEqual({ q: "사과", kind: "chat", level: 2, unsolved: true, sort: "rate", page: 3 });
  });

  it("잘못된 값만 기본값으로 바꾸고 알린다", () => {
    const { query, invalid } = parseListQuery({ kind: "toString", level: "4", sort: "old", page: "0" });
    expect(invalid).toBe(true);
    expect(query).toEqual({ ...DEFAULT_LIST_QUERY });
  });

  it("검색어는 50자까지만 쓴다", () => {
    expect(parseListQuery({ q: "가".repeat(60) }).query.q).toHaveLength(50);
  });
});

describe("listHref", () => {
  it("기본값은 주소에 쓰지 않는다", () => {
    expect(listHref(DEFAULT_LIST_QUERY)).toBe("/problems");
    expect(listHref({ ...DEFAULT_LIST_QUERY, level: 1, page: 2 })).toBe("/problems?level=1&page=2");
  });

  it("읽은 값으로 다시 만들면 같은 주소", () => {
    const href = "/problems?q=%EC%82%AC%EA%B3%BC&kind=word&unsolved=1&sort=popular";
    const params = Object.fromEntries(new URL(href, "http://x").searchParams);
    expect(listHref(parseListQuery(params).query)).toBe(href);
  });
});

describe("savedFilters", () => {
  it("검색어와 페이지는 저장하지 않는다", () => {
    expect(savedFilters({ q: "사과", kind: "news", level: 3, unsolved: true, sort: "rate", page: 4 })).toBe(
      "kind=news&level=3&unsolved=1&sort=rate",
    );
  });

  it("조건이 하나라도 있으면 주소에 조건이 있다고 본다", () => {
    expect(hasListParams({})).toBe(false);
    expect(hasListParams({ page: "2" })).toBe(true);
  });
});

describe("pageItems", () => {
  it("처음에는 1 2 3 … 끝", () => {
    expect(pageItems(1, 32)).toEqual([1, 2, 3, "gap", 32]);
  });

  it("가운데에서는 앞뒤 한 칸씩", () => {
    expect(pageItems(10, 32)).toEqual([1, "gap", 9, 10, 11, "gap", 32]);
  });

  it("끝에서는 끝 세 칸", () => {
    expect(pageItems(32, 32)).toEqual([1, "gap", 30, 31, 32]);
  });

  it("한 칸만 빠지면 번호를 그대로", () => {
    expect(pageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageItems(1, 1)).toEqual([1]);
  });
});
