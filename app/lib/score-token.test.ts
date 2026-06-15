import { describe, expect, it } from "vitest";

import {
  createGradeToken,
  createQuizToken,
  verifyGradeToken,
  verifyQuizToken,
} from "./score-token";

const SECRET = "test-secret";

describe("grade token", () => {
  it("발급한 토큰은 같은 시크릿으로 검증되어 등급을 돌려준다", () => {
    const token = createGradeToken(3, SECRET);
    expect(verifyGradeToken(token, SECRET)).toBe(3);
  });

  it("다른 시크릿으로는 검증 실패", () => {
    const token = createGradeToken(3, SECRET);
    expect(verifyGradeToken(token, "other-secret")).toBeNull();
  });

  it("페이로드 위변조(등급 조작) 시 검증 실패", () => {
    const token = createGradeToken(9, SECRET);
    const [, exp, sig] = token.split(".");
    const forged = `1.${exp}.${sig}`; // 9등급을 1등급으로 바꿔치기
    expect(verifyGradeToken(forged, SECRET)).toBeNull();
  });

  it("만료된 토큰은 검증 실패", () => {
    const past = Date.now() - 2 * 60 * 60 * 1000; // 2시간 전 발급
    const token = createGradeToken(5, SECRET, past);
    expect(verifyGradeToken(token, SECRET)).toBeNull();
  });

  it("형식이 깨진 토큰은 null", () => {
    expect(verifyGradeToken("garbage", SECRET)).toBeNull();
    expect(verifyGradeToken("1.2", SECRET)).toBeNull();
  });
});

describe("quiz token (출제 세트)", () => {
  const ids = [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
  ];

  it("발급한 토큰은 출제된 id 목록을 그대로 돌려준다", () => {
    const token = createQuizToken(ids, SECRET);
    expect(verifyQuizToken(token, SECRET)).toEqual(ids);
  });

  it("다른 시크릿으로는 검증 실패", () => {
    const token = createQuizToken(ids, SECRET);
    expect(verifyQuizToken(token, "other")).toBeNull();
  });

  it("출제 세트 위변조(id 추가) 시 검증 실패", () => {
    const token = createQuizToken(ids, SECRET);
    const [list, exp, sig] = token.split(".");
    const forged = `${list},33333333-3333-4333-8333-333333333333.${exp}.${sig}`;
    expect(verifyQuizToken(forged, SECRET)).toBeNull();
  });

  it("만료된 토큰은 검증 실패", () => {
    const past = Date.now() - 2 * 60 * 60 * 1000;
    const token = createQuizToken(ids, SECRET, past);
    expect(verifyQuizToken(token, SECRET)).toBeNull();
  });
});
