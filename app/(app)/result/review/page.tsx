import { getRoundScenarios, getStartedRound } from "@/app/lib/schedule.server";

import Review, { type ReviewScenario } from "./Review";

// 문제 다시 보기 (#96, #100).
// 지문과 보기 글은 서버에서 그 회차 편성으로 다시 읽고, 내 답과 정답은 화면이
// 결과(sessionStorage)에서 읽어 붙인다 — 정답을 미리 내려보내지 않기 위해서다(#83).
//
// 회차는 주소로 받는다. 아직 시작하지 않은 회차의 지문이 새 나가지 않게
// getStartedRound로 한 번 거른다.
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>;
}) {
  const { round: roundId } = await searchParams;
  const round = roundId ? await getStartedRound(roundId) : null;
  const scenarios = round ? await getRoundScenarios(round.id) : [];
  return <Review scenarios={scenarios as ReviewScenario[]} />;
}
