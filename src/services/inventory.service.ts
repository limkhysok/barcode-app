import api from "./api";
import type { InventoryRecord, InventoryPayload, ScanResult } from "@/src/types/inventory.types";


export async function getInventory(params?: {
  product_id?: number;
  site?: string;
  search?: string;
}): Promise<InventoryRecord[]> {
  const { data } = await api.get<InventoryRecord[]>("/api/inventory/", { params });
  return data;
}


export async function scanBarcode(barcode: string): Promise<ScanResult> {
  const { data } = await api.get<ScanResult>("/api/inventory/scan/", { params: { barcode } });
  return data;
}


export async function createInventory(payload: InventoryPayload): Promise<InventoryRecord> {
  // Only send allowed fields per API_DOCS.md
  const { product, site, location, quantity_on_hand } = payload;
  const cleanPayload = { product, site, location, quantity_on_hand };
  const { data } = await api.post<InventoryRecord>("/api/inventory/", cleanPayload);
  return data;
}


export async function updateInventory(id: number, payload: Partial<InventoryPayload>): Promise<InventoryRecord> {
  // Only send allowed fields per API_DOCS.md
  const { product, site, location, quantity_on_hand } = payload;
  const cleanPayload: Partial<InventoryPayload> = {};
  if (product !== undefined) cleanPayload.product = product;
  if (site !== undefined) cleanPayload.site = site;
  if (location !== undefined) cleanPayload.location = location;
  if (quantity_on_hand !== undefined) cleanPayload.quantity_on_hand = quantity_on_hand;
  const { data } = await api.patch<InventoryRecord>(`/api/inventory/${id}/`, cleanPayload);
  return data;
}


export async function deleteInventory(id: number): Promise<void> {
  await api.delete(`/api/inventory/${id}/`);
}
