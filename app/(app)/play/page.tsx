import { MOCK_SCENARIO } from "@/app/lib/mock-questions";
import { getScenario } from "@/app/lib/scenarios.server";

import ChatPlay from "./Play";

// 콘텐츠는 DB(scenarios)에서, 없으면 mock으로 (#83).
export const revalidate = 60;

export default async function PlayPage() {
  const scenario = await getScenario("chat", MOCK_SCENARIO);
  return <ChatPlay scenario={scenario} />;
}
