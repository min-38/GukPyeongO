import { describe, expect, it } from "vitest";

import { SCENARIO_SEEDS } from "./scenario-registry";

// 레지스트리는 mock→DB 시드의 기준(#74).
// 새 유형을 추가하고 등록을 빠뜨리면 그 유형만 DB로 못 넘어가므로 여기서 잡는다.
describe("scenario-registry", () => {
  it("slug가 중복되지 않는다", () => {
    const slugs = SCENARIO_SEEDS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("라우트가 있는 시나리오를 모두 담고 있다", () => {
    const slugs = SCENARIO_SEEDS.map((s) => s.slug).sort();
    expect(slugs).toEqual(
      [
        "chat",
        "community",
        "email",
        "email-reply",
        "news",
        "notice",
        "story",
      ].sort()
    );
  });

  it("지문(payload)과 문항(steps)이 분리돼 있다", () => {
    for (const seed of SCENARIO_SEEDS) {
      expect(seed.steps.length).toBeGreaterThan(0);
      // steps는 scenario_steps 테이블로 가므로 payload에 남아 있으면 안 된다.
      expect(seed.payload).not.toHaveProperty("steps");
      expect(seed.sourceLabel.length).toBeGreaterThan(0);
    }
  });

  it("모든 문항이 DB 컬럼 제약을 만족한다", () => {
    for (const seed of SCENARIO_SEEDS) {
      const keys = seed.steps.map((s) => s.id);
      // (scenario_id, step_key) unique 제약에 걸리지 않아야 한다.
      expect(new Set(keys).size).toBe(keys.length);

      for (const step of seed.steps) {
        expect(step.choices.length).toBeGreaterThanOrEqual(2);
        expect(step.answerIndex).toBeGreaterThanOrEqual(0);
        expect(step.answerIndex).toBeLessThan(step.choices.length);
        expect(step.difficulty).toBeGreaterThanOrEqual(1);
        expect(step.difficulty).toBeLessThanOrEqual(3);
        expect(step.timeLimitSec).toBeGreaterThan(0);
      }
    }
  });
});
