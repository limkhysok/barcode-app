import api from "./api";
import type { Product, ProductPayload } from "@/src/types/product.types";

export async function getProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>("/api/v1/products/");
  return data;
}

export async function getProduct(id: number): Promise<Product> {
  const { data } = await api.get<Product>(`/api/v1/products/${id}/`);
  return data;
}


export async function createProduct(payload: ProductPayload): Promise<Product> {
  const body: Partial<ProductPayload> = { ...payload };
  if (!body.barcode) delete body.barcode;
  const { data } = await api.post<Product>("/api/v1/products/", body);
  return data;
}


export async function updateProduct(id: number, payload: Partial<ProductPayload>): Promise<Product> {
  const { data } = await api.put<Product>(`/api/v1/products/${id}/`, payload);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/api/v1/products/${id}/`);
}
