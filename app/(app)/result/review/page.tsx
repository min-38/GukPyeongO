import { getScheduledScenarios, todayKst } from "@/app/lib/schedule.server";

import Review, { type ReviewScenario } from "./Review";

// 문제 다시 보기 (#96).
// 지문과 보기 글은 서버에서 오늘 편성으로 다시 읽고, 내 답과 정답은 화면이
// 결과(sessionStorage)에서 읽어 붙인다 — 정답을 미리 내려보내지 않기 위해서다(#83).
export const revalidate = 60;

export default async function Page() {
  const scenarios = await getScheduledScenarios(todayKst());
  return <Review scenarios={scenarios as ReviewScenario[]} />;
}
