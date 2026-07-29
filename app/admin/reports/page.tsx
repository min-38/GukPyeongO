import { redirect } from "next/navigation";

import { isAdmin } from "@/app/lib/admin-session.server";

import ReportsTab from "../ReportsTab";

export default async function Page() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <ReportsTab />;
}
