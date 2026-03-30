import api from "./api";
import type { Product, ProductPayload } from "@/src/types/product.types";

export async function getProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>("/api/products/");
  return data;
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const body: Partial<ProductPayload> = { ...payload };
  if (!body.barcode) delete body.barcode;
  const { data } = await api.post<Product>("/api/products/", body);
  return data;
}

export async function updateProduct(id: number, payload: Partial<ProductPayload>): Promise<Product> {
  const { data } = await api.put<Product>(`/api/products/${id}/`, payload);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/api/products/${id}/`);
}
