import { MOCK_EMAIL_REPLY } from "@/app/lib/mock-email-reply";
import { getScenario } from "@/app/lib/scenarios.server";

import EmailReplyPlay from "./Play";

// 콘텐츠는 DB(scenarios)에서, 없으면 mock으로 (#85).
export const revalidate = 60;

export default async function EmailReplyPage() {
  const scenario = await getScenario("email-reply", MOCK_EMAIL_REPLY);
  return <EmailReplyPlay scenario={scenario} />;
}
