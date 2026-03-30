import api from "./api";
import type { InventoryRecord, InventoryPayload, ScanResult } from "@/src/types/inventory.types";
import type { PaginatedInventory } from "@/src/types/api.types";


export async function getInventory(params?: {
  product_id?: number;
  site?: string;
  search?: string;
  page?: number;
  page_size?: number | string;
}, fetcher?: <T>(path: string) => Promise<T>): Promise<PaginatedInventory> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.product_id) query.set("product_id", String(params.product_id));
  if (params?.site) query.set("site", params.site);
  if (params?.search) query.set("search", params.search);

  const path = `/api/v1/inventory/?${query.toString()}`;
  if (fetcher) return await fetcher(path);

  const { data } = await api.get<PaginatedInventory>(path);
  return data;
}

export async function getInventoryStats(fetcher?: <T>(path: string) => Promise<T>): Promise<any> {
  const path = "/api/v1/inventory/stats";
  try {
    if (fetcher) {
      return await fetcher(path);
    }
    const { data } = await api.get<any>(path);
    return data;
  } catch (error) {
    console.error("Failed to fetch inventory stats:", error);
    return null;
  }
}


export async function scanBarcode(barcode: string): Promise<ScanResult> {
  const { data } = await api.get<ScanResult>("/api/v1/inventory/scan/", { params: { barcode } });
  return data;
}


export async function createInventory(payload: InventoryPayload): Promise<InventoryRecord> {
  // Only send allowed fields per API_DOCS.md
  const { product, site, location, quantity_on_hand } = payload;
  const cleanPayload = { product, site, location, quantity_on_hand };
  const { data } = await api.post<InventoryRecord>("/api/v1/inventory/", cleanPayload);
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
  const { data } = await api.patch<InventoryRecord>(`/api/v1/inventory/${id}/`, cleanPayload);
  return data;
}


export async function deleteInventory(id: number): Promise<void> {
  await api.delete(`/api/v1/inventory/${id}/`);
}
