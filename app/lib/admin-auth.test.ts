import { describe, expect, it } from "vitest";

import { createAdminToken, verifyAdminToken } from "./admin-auth";
import { createGradeToken } from "./score-token";

const SECRET = "admin-test-secret";

describe("admin token", () => {
  it("발급한 토큰은 같은 시크릿으로 검증된다", () => {
    expect(verifyAdminToken(createAdminToken(SECRET), SECRET)).toBe(true);
  });

  it("다른 시크릿으로는 실패", () => {
    expect(verifyAdminToken(createAdminToken(SECRET), "nope")).toBe(false);
  });

  it("만료된 토큰은 실패", () => {
    const past = Date.now() - 24 * 60 * 60 * 1000;
    expect(verifyAdminToken(createAdminToken(SECRET, past), SECRET)).toBe(false);
  });

  it("형식이 깨진 토큰은 실패", () => {
    expect(verifyAdminToken("garbage", SECRET)).toBe(false);
    expect(verifyAdminToken("user.123.sig", SECRET)).toBe(false);
  });

  // 어드민 세션과 점수 토큰이 같은 시크릿을 쓴다. 서명 대상 앞에 용도를 박아
  // 한쪽에서 만든 서명이 다른 쪽에서 통하지 않게 해 둔 것을 확인한다.
  it("점수 토큰 시크릿으로는 어드민 토큰을 위조할 수 없다", () => {
    // 등급 토큰이 어쩌다 어드민 토큰과 같은 모양이 되어도 통과하면 안 된다.
    const graded = createGradeToken(1, null, SECRET);
    expect(verifyAdminToken(graded, SECRET)).toBe(false);

    // 옛 형식("admin.<exp>")으로 서명한 토큰도 이제는 거부된다.
    const exp = Date.now() + 60_000;
    const legacy = `admin.${exp}`;
    expect(verifyAdminToken(`${legacy}.whatever`, SECRET)).toBe(false);
  });
});
