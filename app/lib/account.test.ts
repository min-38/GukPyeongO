import { describe, expect, it } from "vitest";

import { birthYears, DEFAULT_NEXT, nicknameError, safeNext } from "./account";
import { randomNickname } from "./quiz";

describe("닉네임 형식 (A-04)", () => {
  it("2~12자 한글, 영문, 숫자는 통과", () => {
    for (const n of ["행인", "문해력고수", "Abc12", "가나다라마바사아자차카타"]) expect(nicknameError(n)).toBeNull();
  });

  it("길이, 공백, 특수문자, 자모만 쓴 글자는 막는다", () => {
    for (const n of ["행", "가나다라마바사아자차카타파", "행 인", "행인!", "ㅋㅋ", "", null, 12]) {
      expect(nicknameError(n)).not.toBeNull();
    }
  });

  it("가입 화면에 미리 채우는 무작위 닉네임은 늘 형식을 통과한다", () => {
    for (let i = 0; i < 200; i++) expect(nicknameError(randomNickname())).toBeNull();
  });
});

describe("돌아갈 주소 (A-07)", () => {
  it("이 사이트 안의 주소는 그대로", () => {
    expect(safeNext("/problems/12")).toBe("/problems/12");
    expect(safeNext("/problems?sort=new&page=2")).toBe("/problems?sort=new&page=2");
  });

  it("사이트 밖이나 잘못된 값은 문제 목록", () => {
    for (const n of ["https://evil.test", "//evil.test", "/\\evil.test", "problems", "", null, undefined]) {
      expect(safeNext(n)).toBe(DEFAULT_NEXT);
    }
  });

  it("로그인, 가입 화면으로는 돌려보내지 않는다 (돌고 돎)", () => {
    for (const n of ["/login", "/login?next=/x", "/signup", "/auth/callback"]) expect(safeNext(n)).toBe(DEFAULT_NEXT);
    expect(safeNext("/loginx")).toBe("/loginx");
  });
});

describe("출생 연도 목록 (A-13)", () => {
  it("올해부터 1920년까지 내림차순", () => {
    const years = birthYears(new Date("2026-11-20T00:00:00Z"));
    expect(years[0]).toBe(2026);
    expect(years.at(-1)).toBe(1920);
  });
});
