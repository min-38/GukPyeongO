import { type EmailScenario } from "@/app/lib/email-scenario";
import { getScenario } from "@/app/lib/scenarios.server";

import ScenarioUnavailable from "../play/ScenarioUnavailable";
import EmailPlay from "./Play";

// 콘텐츠는 DB(scenarios)에서 읽는다. mock 폴백은 없앴다(#86).
export const revalidate = 60;

export default async function Page() {
  const scenario = await getScenario<EmailScenario>("email");
  if (!scenario) return <ScenarioUnavailable label="메일" />;
  return <EmailPlay scenario={scenario} />;
}
