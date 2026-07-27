import { getScheduledScenarios, todayKst } from "@/app/lib/schedule.server";

import ScenarioUnavailable from "../play/ScenarioUnavailable";
import TodayPlay from "./TodayPlay";

// 오늘 편성된 문제 (#87). slug로 직접 들어오는 경로가 아니라 여기가 실제 입구다.
// 편성은 날짜마다 바뀌므로 캐시하지 않는다.
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const scenarios = await getScheduledScenarios(todayKst());
  if (scenarios.length === 0) return <ScenarioUnavailable label="오늘 문제" />;
  return <TodayPlay scenarios={scenarios} />;
}
