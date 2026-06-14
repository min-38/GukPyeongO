import { redirect } from "next/navigation";

import { isAdmin } from "@/app/lib/admin-session.server";

import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
  return <AdminDashboard />;
}
