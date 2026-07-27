import { notFound, redirect } from "next/navigation";

import { isAdmin } from "@/app/lib/admin-session.server";
import { fetchScenario } from "@/app/lib/scenarios-admin.server";

import ScenarioForm from "../../ScenarioForm";
import ScenarioFormShell from "../ScenarioFormShell";

// 시나리오 수정 페이지 (#66).
export default async function EditScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const scenario = await fetchScenario(id);
  if (!scenario) notFound();
  return (
    <ScenarioFormShell title={`문제 수정 · ${scenario.title || scenario.slug}`}>
      <ScenarioForm initial={scenario} />
    </ScenarioFormShell>
  );
}
