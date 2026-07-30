import { describe, expect, it } from "vitest";

import { isoToKstLocal, kstLocalToIso, plusDaysKstLocal } from "./kst";

// 러너의 TZ와 무관하게 같은 값이 나와야 한다 — 운영자 노트북이 UTC여도 회차 창이 밀리지 않게.
describe("kst", () => {
  it("datetime-local 값을 KST로 읽는다", () => {
    expect(kstLocalToIso("2026-07-30T09:00")).toBe("2026-07-30T00:00:00.000Z");
  });

  it("초가 붙어 와도 같은 값", () => {
    expect(kstLocalToIso("2026-07-30T09:00:00")).toBe(
      "2026-07-30T00:00:00.000Z",
    );
  });

  it("ISO를 KST 벽시계로 되돌린다", () => {
    expect(isoToKstLocal("2026-07-30T00:00:00.000Z")).toBe("2026-07-30T09:00");
  });

  it("왕복해도 값이 유지된다", () => {
    const local = "2026-08-06T18:30";
    expect(isoToKstLocal(kstLocalToIso(local))).toBe(local);
  });

  it("일주일 뒤는 같은 시각의 7일 뒤", () => {
    expect(plusDaysKstLocal("2026-07-30T09:00", 7)).toBe("2026-08-06T09:00");
  });
});
