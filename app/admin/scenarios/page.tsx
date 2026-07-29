import { redirect } from "next/navigation";

import { isAdmin } from "@/app/lib/admin-session.server";

import ScenarioListPane from "./ScenarioListPane";

export default async function ScenarioListPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <ScenarioListPane />;
}

