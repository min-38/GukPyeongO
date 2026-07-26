import { MOCK_STORY } from "@/app/lib/mock-story";
import { getScenario } from "@/app/lib/scenarios.server";

import StoryPlay from "./Play";

// 콘텐츠는 DB(scenarios)에서, 없으면 mock으로 (#85).
export const revalidate = 60;

export default async function StoryPage() {
  const scenario = await getScenario("story", MOCK_STORY);
  return <StoryPlay scenario={scenario} />;
}
