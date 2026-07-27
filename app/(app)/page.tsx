import { getScheduledScenarios, todayKst } from "@/app/lib/schedule.server";

import HomeView from "./HomeView";

// 홈 (#90). 시작 버튼이 오늘 편성으로 들어간다.
// 편성이 날짜마다 바뀌므로 캐시하지 않는다.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const date = todayKst();
  const scenarios = await getScheduledScenarios(date);
  return (
    <HomeView
      date={date}
      todayCount={scenarios.reduce(
        (n, s) => n + (s.content.steps as unknown[]).length,
        0,
      )}
    />
  );
}
