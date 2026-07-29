import { redirect } from "next/navigation";

import { isAdmin } from "@/app/lib/admin-session.server";

import DashboardTab from "./DashboardTab";

export default async function AdminHomePage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <DashboardTab />;
}
