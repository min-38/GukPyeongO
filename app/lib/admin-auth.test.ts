import { describe, expect, it } from "vitest";

import { createAdminToken, verifyAdminToken } from "./admin-auth";

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
});
