import { getCurrentRound, getRoundScenarios } from "@/app/lib/schedule.server";

import ScenarioUnavailable from "../play/ScenarioUnavailable";
import TodayPlay from "./TodayPlay";

// 이번 회차 문제 (#87, #100). slug로 직접 들어오는 경로가 아니라 여기가 실제 입구다.
// 회차가 바뀌므로 캐시하지 않는다.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "이 주의 문제",
  description: "일주일마다 새로 올라오는 실생활 문해력 문제를 풀어보세요.",
  alternates: { canonical: "/today" },
};

export default async function TodayPage() {
  const round = await getCurrentRound();
  const scenarios = round ? await getRoundScenarios(round.id) : [];
  if (!round || scenarios.length === 0)
    return <ScenarioUnavailable label="이 주의 문제" />;
  return <TodayPlay scenarios={scenarios} roundId={round.id} />;
}
