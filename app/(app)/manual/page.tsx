import { type DocScenario } from "@/app/lib/doc-scenario";
import { getScenario } from "@/app/lib/scenarios.server";

import ScenarioUnavailable from "../play/ScenarioUnavailable";
import ManualPlay from "./Play";

// 사용설명서 유형 맛보기 (#99).
export const revalidate = 60;

export default async function Page() {
  const scenario = await getScenario<DocScenario>("manual-robot");
  if (!scenario) return <ScenarioUnavailable label="사용설명서" />;
  return <ManualPlay scenario={scenario} />;
}
