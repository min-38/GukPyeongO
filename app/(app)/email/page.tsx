import { MOCK_EMAIL } from "@/app/lib/mock-email";
import { getScenario } from "@/app/lib/scenarios.server";

import EmailPlay from "./Play";

// 콘텐츠는 DB(scenarios)에서, 없으면 mock으로 (#85).
export const revalidate = 60;

export default async function EmailPage() {
  const scenario = await getScenario("email", MOCK_EMAIL);
  return <EmailPlay scenario={scenario} />;
}
