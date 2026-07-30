import { redirect } from "next/navigation";

import { isAdmin } from "@/app/lib/admin-session.server";
import { getDashboardData } from "@/app/lib/dashboard.server";

import DashboardTab from "./DashboardTab";

// 지표는 서버에서 읽는다(#103). 예전에는 화면이 마운트된 뒤 API를 한 번 더 왕복했는데,
// 어드민은 이미 서버 컴포넌트로 인증을 하고 있어 그 왕복이 지탱하는 게 없었다.
export default async function AdminHomePage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const data = await getDashboardData();
  return <DashboardTab data={data} />;
}
