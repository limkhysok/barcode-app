import api from "./api";
import type { Product, ProductPayload } from "@/src/types/product.types";
import type { PaginatedProducts, ProductStats } from "@/src/types/api.types";

/**
 * Universal product getter. 
 * @param page Optional page number
 * @param fetcher Server-side fetcher
 */
export async function getProducts(page = 1, fetcher?: <T>(path: string) => Promise<T>): Promise<PaginatedProducts> {
  const path = `/api/v1/products/?page=${page}`;
  try {
    if (fetcher) {
      return await fetcher(path);
    }
    const { data } = await api.get<PaginatedProducts>(path);
    return data;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return { count: 0, next: null, previous: null, results: [] };
  }
}

/**
 * Get product analytics/stats. 
 */
export async function getProductStats(fetcher?: <T>(path: string) => Promise<T>): Promise<ProductStats | null> {
  const path = "/api/v1/products/stats";
  try {
    if (fetcher) {
      return await fetcher(path);
    }
    const { data } = await api.get<ProductStats>(path);
    return data;
  } catch (error) {
    console.error("Failed to fetch product stats:", error);
    return null;
  }
}

/**
 * Get a single product. 
 */
export async function getProduct(id: number, fetcher?: <T>(path: string) => Promise<T>): Promise<Product | null> {
  try {
    if (fetcher) {
      return await fetcher<Product>(`/api/v1/products/${id}/`);
    }
    const { data } = await api.get<Product>(`/api/v1/products/${id}/`);
    return data;
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    return null;
  }
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const body: Partial<ProductPayload> = { ...payload };
  if (!body.barcode) delete body.barcode;
  const { data } = await api.post<Product>("/api/v1/products/", body);
  return data;
}

export async function updateProduct(id: number, payload: Partial<ProductPayload>): Promise<Product> {
  const { data } = await api.patch<Product>(`/api/v1/products/${id}/`, payload);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/api/v1/products/${id}/`);
}
