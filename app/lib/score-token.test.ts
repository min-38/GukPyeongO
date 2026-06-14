import { describe, expect, it } from "vitest";

import { createGradeToken, verifyGradeToken } from "./score-token";

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
