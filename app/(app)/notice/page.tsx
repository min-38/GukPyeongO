import { MOCK_NOTICE } from "@/app/lib/mock-notice";
import { getScenario } from "@/app/lib/scenarios.server";

import NoticePlay from "./Play";

// 콘텐츠는 DB(scenarios)에서, 없으면 mock으로 (#85).
export const revalidate = 60;

export default async function NoticePage() {
  const scenario = await getScenario("notice", MOCK_NOTICE);
  return <NoticePlay scenario={scenario} />;
}
