import { describe, expect, it } from "vitest";

import { SCENARIO_SEEDS } from "./scenario-registry";
import { checkScenarioRules } from "./scenario-rules";

// 출제 규칙(#76). mock 테스트가 시드에만 걸리는 것과 달리, 이건 어드민 입력에도 걸린다.
describe("scenario-rules", () => {
  it("기존 시드 6종은 규칙을 통과한다", () => {
    for (const seed of SCENARIO_SEEDS) {
      const { errors } = checkScenarioRules(seed.kind, seed.payload, seed.steps);
      expect({ slug: seed.slug, errors }).toEqual({
        slug: seed.slug,
        errors: [],
      });
    }
  });

  it("본문이 비면 거부한다", () => {
    const { errors } = checkScenarioRules("doc", { doc: { body: [] } }, []);
    expect(errors.join()).toContain("본문이 비어");
  });

  it("본문 길이 초과는 경고로 남기고 저장은 막지 않는다", () => {
    const long = "가".repeat(700);
    const { errors, warnings } = checkScenarioRules(
      "doc",
      { doc: { body: [long] } },
      []
    );
    expect(errors).toEqual([]);
    expect(warnings.join()).toContain("650");
  });

  describe("서사", () => {
    const body = ["나".repeat(600)];

    it("읽기 시간이 모자라면 거부하고 권장값을 알려준다", () => {
      const { errors } = checkScenarioRules("story", { body, readSec: 30 }, []);
      // 600자 ÷ 400자/분 = 1.5분 = 90초
      expect(errors.join()).toContain("90초");
    });

    it("읽기 시간이 넉넉하면 통과한다", () => {
      const { errors } = checkScenarioRules("story", { body, readSec: 120 }, []);
      expect(errors).toEqual([]);
    });

    it("감상 어휘는 경고한다 — 선택지에 있어도", () => {
      const { warnings } = checkScenarioRules(
        "story",
        { body, readSec: 120 },
        [{ prompt: "아버지가 한 일은?", choices: ["방을 데웠다", "기분이 나빴다"] }]
      );
      expect(warnings.join()).toContain("기분");
    });
  });

  describe("이메일", () => {
    const payload = { messages: [{ body: ["ㄱ"] }, { body: ["ㄴ"] }] };

    it("공개 범위가 줄어들면 거부한다", () => {
      const { errors } = checkScenarioRules("email", payload, [
        { prompt: "a", choices: ["1", "2"], showUpTo: 2 },
        { prompt: "b", choices: ["1", "2"], showUpTo: 1 },
      ]);
      expect(errors.join()).toContain("줄었습니다");
    });

    it("공개 범위가 메일 수를 넘으면 거부한다", () => {
      const { errors } = checkScenarioRules("email", payload, [
        { prompt: "a", choices: ["1", "2"], showUpTo: 5 },
      ]);
      expect(errors.join()).toContain("메일 수");
    });

    it("오름차순이면 통과한다", () => {
      const { errors } = checkScenarioRules("email", payload, [
        { prompt: "a", choices: ["1", "2"], showUpTo: 1 },
        { prompt: "b", choices: ["1", "2"], showUpTo: 2 },
      ]);
      expect(errors).toEqual([]);
    });
  });
});
