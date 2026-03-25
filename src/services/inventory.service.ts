import api from "./api";
import type { InventoryRecord, InventoryPayload } from "@/src/types/inventory.types";

export async function getInventory(params?: { product_id?: number; site?: string }): Promise<InventoryRecord[]> {
  const { data } = await api.get<InventoryRecord[]>("/api/inventory/", { params });
  return data;
}

export async function createInventory(payload: InventoryPayload): Promise<InventoryRecord> {
  const { data } = await api.post<InventoryRecord>("/api/inventory/", payload);
  return data;
}

export async function updateInventory(id: number, payload: Partial<InventoryPayload>): Promise<InventoryRecord> {
  const { data } = await api.patch<InventoryRecord>(`/api/inventory/${id}/`, payload);
  return data;
}

export async function deleteInventory(id: number): Promise<void> {
  await api.delete(`/api/inventory/${id}/`);
}
