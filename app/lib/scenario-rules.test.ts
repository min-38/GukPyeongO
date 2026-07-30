import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { type ScenarioKind } from "./scenario-admin";
import { checkScenarioRules } from "./scenario-rules";

// 새 DB를 채우는 원본(#86). mock이 사라진 뒤로 이 파일이 시드 정본이라 여기서 검사한다.
const SEED_SQL = readFileSync("supabase/scenarios_seed.sql", "utf8");

// 시드 SQL에서 지문(payload)과 문항을 되읽는다.
// 두 insert 모두 첫 칸이 slug라 그걸로 묶는다(블록 단위로 자르면 중간 주석에 걸려 끊긴다).
const Q = "((?:[^']|'')*)"; // 작은따옴표를 '' 로 escape 한 SQL 문자열
const unq = (v: string) => v.replace(/''/g, "'");

interface SeedScenario {
  slug: string;
  kind: ScenarioKind;
  title: string;
  payload: Record<string, unknown>;
  steps: { prompt: string; choices: string[]; showUpTo?: number | null }[];
}

function seedScenarios(): SeedScenario[] {
  const bySlug = new Map<string, SeedScenario>();

  // 지문: (slug, kind, title, source_label, payload::jsonb, status, sort_order)
  const docRe = new RegExp(
    `^ {2}\\('${Q}', '${Q}', '${Q}', '${Q}', '${Q}'::jsonb, '[a-z]+', \\d+\\)`,
    "gm",
  );
  for (const m of SEED_SQL.matchAll(docRe)) {
    bySlug.set(m[1], {
      slug: m[1],
      kind: m[2] as ScenarioKind,
      title: unq(m[3]),
      payload: JSON.parse(unq(m[5])) as Record<string, unknown>,
      steps: [],
    });
  }

  // 문항: (slug, step_key, type, prompt, choices::jsonb, 정답, 난이도, 제한시간, 공개범위, extra::jsonb, 순서)
  const stepRe = new RegExp(
    `^ {2}\\('${Q}', '${Q}', '${Q}', '${Q}', '${Q}'::jsonb, \\d+, \\d+, \\d+, (null|\\d+),`,
    "gm",
  );
  for (const m of SEED_SQL.matchAll(stepRe)) {
    bySlug.get(m[1])?.steps.push({
      prompt: unq(m[4]),
      choices: JSON.parse(unq(m[5])) as string[],
      showUpTo: m[6] === "null" ? null : Number(m[6]),
    });
  }

  return [...bySlug.values()];
}

describe("scenario-rules", () => {
  it("시드 SQL의 시나리오가 모두 규칙을 통과한다", () => {
    const seeds = seedScenarios();
    expect(seeds.length).toBe(7);
    // 파싱이 헛돌면 문항 0개로도 통과해버린다 — 실제로 읽혔는지 먼저 본다.
    expect(seeds.reduce((n, s) => n + s.steps.length, 0)).toBe(32);
    // 편성 화면에서 문제를 알아보려면 제목이 있어야 한다(#92).
    for (const seed of seeds) expect(seed.title.length).toBeGreaterThan(0);
    for (const seed of seeds) {
      const { errors } = checkScenarioRules(
        seed.kind,
        seed.payload,
        seed.steps,
      );
      expect({ slug: seed.slug, errors }).toEqual({
        slug: seed.slug,
        errors: [],
      });
    }
  });

  it("본문이 비면 거부한다", () => {
    const { errors } = checkScenarioRules("notice", { doc: { body: [] } }, []);
    expect(errors.join()).toContain("본문이 비어");
  });

  // 어휘는 낱말 하나를 묻는 유형이라 지문이 없다(#101). 메신저와 같은 예외.
  it("어휘는 지문이 없어도 통과한다", () => {
    const { errors } = checkScenarioRules("word", {}, [
      { prompt: "사흘은 며칠?", choices: ["3일", "4일"] },
    ]);
    expect(errors).toEqual([]);
  });

  it("본문 길이 초과는 경고로 남기고 저장은 막지 않는다", () => {
    const long = "가".repeat(700);
    const { errors, warnings } = checkScenarioRules(
      "news",
      { doc: { body: [long] } },
      [],
    );
    expect(errors).toEqual([]);
    expect(warnings.join()).toContain("650");
  });

  describe("서사", () => {
    const body = ["나".repeat(600)];

    // 읽기 시간은 만드는 사람이 정한다(#99) — 짧게 줬다고 저장을 막지 않는다.
    it("읽기 시간이 짧아도 막지 않는다", () => {
      const { errors } = checkScenarioRules("story", { body, readSec: 30 }, []);
      expect(errors).toEqual([]);
    });

    it("감상 어휘는 경고한다 — 선택지에 있어도", () => {
      const { warnings } = checkScenarioRules("story", { body, readSec: 120 }, [
        {
          prompt: "아버지가 한 일은?",
          choices: ["방을 데웠다", "기분이 나빴다"],
        },
      ]);
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
