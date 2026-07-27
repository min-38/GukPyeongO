import { redirect } from "next/navigation";

import { isAdmin } from "@/app/lib/admin-session.server";

import ScenarioForm from "../../ScenarioForm";
import ScenarioFormShell from "../ScenarioFormShell";

// 시나리오 생성 페이지 (#66). 목록 안에 폼을 펼치지 않는다.
export default async function NewScenarioPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <ScenarioFormShell title="문제 추가">
      <ScenarioForm initial={null} />
    </ScenarioFormShell>
  );
}
