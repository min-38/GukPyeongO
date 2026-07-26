import { MOCK_NEWS } from "@/app/lib/mock-news";
import { getScenario } from "@/app/lib/scenarios.server";

import NewsPlay from "./Play";

// 콘텐츠는 DB(scenarios)에서, 없으면 mock으로 (#85).
export const revalidate = 60;

export default async function NewsPage() {
  const scenario = await getScenario("news", MOCK_NEWS);
  return <NewsPlay scenario={scenario} />;
}
