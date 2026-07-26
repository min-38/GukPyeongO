import { MOCK_COMMUNITY } from "@/app/lib/mock-community";
import { getScenario } from "@/app/lib/scenarios.server";

import CommunityPlay from "./Play";

// 콘텐츠는 DB(scenarios)에서, 없으면 mock으로 (#85).
export const revalidate = 60;

export default async function CommunityPage() {
  const scenario = await getScenario("community", MOCK_COMMUNITY);
  return <CommunityPlay scenario={scenario} />;
}
