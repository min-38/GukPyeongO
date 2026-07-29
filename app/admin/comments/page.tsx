import { redirect } from "next/navigation";

import { isAdmin } from "@/app/lib/admin-session.server";

import CommentsTab from "../CommentsTab";

export default async function Page() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <CommentsTab />;
}
