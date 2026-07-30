import {
  getCurrentRound,
  getRoundFinishedCount,
  getRoundScenarios,
} from "@/app/lib/schedule.server";

import HomeView from "./HomeView";

// 홈 (#90). 시작 버튼이 이번 회차로 들어간다.
// 회차가 바뀌므로 캐시하지 않는다.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const round = await getCurrentRound();
  const [scenarios, finished] = round
    ? await Promise.all([
        getRoundScenarios(round.id),
        getRoundFinishedCount(round.id),
      ])
    : [[], 0];

  return (
    <HomeView
      roundId={round?.id ?? null}
      roundEndsAt={round?.endsAt ?? null}
      finished={finished}
      todayCount={scenarios.reduce(
        (n, s) => n + (s.content.steps as unknown[]).length,
        0,
      )}
    />
  );
}
