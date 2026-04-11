import api from "./api";
import type { DashboardStats } from "@/src/types/dashboard.types";

export interface DashboardFilters {
  range?: "today" | "week" | "month" | "custom";
  start?: string;
  end?: string;
}

export async function getDashboardStats(
  fetcher?: <T>(path: string) => Promise<T>,
  filters?: DashboardFilters,
): Promise<DashboardStats | null> {
  const params = new URLSearchParams();
  if (filters?.range) params.set("range", filters.range);
  if (filters?.start) params.set("start", filters.start);
  if (filters?.end) params.set("end", filters.end);

  const path = `/api/v1/dashboard/stats/?${params.toString()}`;
  try {
    if (fetcher) return await fetcher<DashboardStats>(path);
    const { data } = await api.get<DashboardStats>(path);
    return data;
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return null;
  }
}
