import api from "./api";
import type { Product, ProductPayload } from "@/src/types/product.types";
import type { PaginatedProducts, ProductStats } from "@/src/types/api.types";

export interface ProductFilters {
  search?: string;
  category?: string;
  min_cost?: string | number;
  max_cost?: string | number;
  min_reorder?: string | number;
  max_reorder?: string | number;
  needs_reorder?: boolean;
  ordering?: string;
}

/**
 * Universal product getter.
 * @param page Optional page number
 * @param fetcher Server-side fetcher
 * @param filters Optional server-side filter params
 * @param page_size Optional page size limit
 */
export async function getProducts(page = 1, fetcher?: <T>(path: string) => Promise<T>, filters?: ProductFilters, page_size?: number | string): Promise<PaginatedProducts> {
  const params = new URLSearchParams({ page: String(page) });
  if (page_size) params.set("page_size", String(page_size));
  if (filters?.search) params.set("search", filters.search);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.min_cost !== undefined && filters.min_cost !== "") params.set("min_cost", String(filters.min_cost));
  if (filters?.max_cost !== undefined && filters.max_cost !== "") params.set("max_cost", String(filters.max_cost));
  if (filters?.min_reorder !== undefined && filters.min_reorder !== "") params.set("min_reorder", String(filters.min_reorder));
  if (filters?.max_reorder !== undefined && filters.max_reorder !== "") params.set("max_reorder", String(filters.max_reorder));
  if (filters?.needs_reorder) params.set("needs_reorder", "true");
  if (filters?.ordering) params.set("ordering", filters.ordering);

  const path = `/api/v1/products/?${params.toString()}`;
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
