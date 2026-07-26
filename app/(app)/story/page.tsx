import { type StoryScenario } from "@/app/lib/story-scenario";
import { getScenario } from "@/app/lib/scenarios.server";

import ScenarioUnavailable from "../play/ScenarioUnavailable";
import StoryPlay from "./Play";

// 콘텐츠는 DB(scenarios)에서 읽는다. mock 폴백은 없앴다(#86).
export const revalidate = 60;

export default async function Page() {
  const scenario = await getScenario<StoryScenario>("story");
  if (!scenario) return <ScenarioUnavailable label="이야기" />;
  return <StoryPlay scenario={scenario} />;
}
