import { type DocScenario } from "@/app/lib/doc-scenario";
import { getScenario } from "@/app/lib/scenarios.server";

import ScenarioUnavailable from "../play/ScenarioUnavailable";
import ContractPlay from "./Play";

// 계약서 유형 맛보기 (#99). 콘텐츠는 DB에서 읽는다.
export const revalidate = 60;

export default async function Page() {
  const scenario = await getScenario<DocScenario>("contract-oneroom");
  if (!scenario) return <ScenarioUnavailable label="계약서" />;
  return <ContractPlay scenario={scenario} />;
}
