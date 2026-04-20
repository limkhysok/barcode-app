export const dynamic = "force-dynamic";

import { serverFetch } from "@/src/lib/server-fetch";
import { getDashboardStats } from "@/src/services/dashboard.service";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const stats = await getDashboardStats(serverFetch, { range: "week" });
  return <DashboardClient initialStats={stats} initialRange="week" />;
}
