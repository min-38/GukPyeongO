import { type ChatScenario } from "@/app/lib/chat-scenario";
import { getScenario } from "@/app/lib/scenarios.server";

import ScenarioUnavailable from "./ScenarioUnavailable";
import ChatPlay from "./Play";

// 콘텐츠는 DB(scenarios)에서 읽는다. mock 폴백은 없앴다(#86).
export const revalidate = 60;

export default async function Page() {
  const scenario = await getScenario<ChatScenario>("chat");
  if (!scenario) return <ScenarioUnavailable label="대화" />;
  return <ChatPlay scenario={scenario} />;
}
