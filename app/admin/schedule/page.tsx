import { redirect } from "next/navigation";

import { isAdmin } from "@/app/lib/admin-session.server";

import Pane from "./Pane";

export default async function Page() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <Pane />;
}
