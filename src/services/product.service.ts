import api from "./api";
import type { Product, ProductPayload } from "@/src/types/product.types";
import type { PaginatedProducts, ProductStats } from "@/src/types/api.types";

export interface ProductFilters {
  search?: string;
  category?: string;
  ordering?: string;
}

/**
 * Universal product getter.
 * @param fetcher Server-side fetcher
 * @param filters Optional filter params
 * @param page_size Optional page size limit
 */
export async function getProducts(fetcher?: <T>(path: string) => Promise<T>, filters?: ProductFilters, page_size?: number | string): Promise<PaginatedProducts> {
  const params = new URLSearchParams();
  if (page_size) params.set("page_size", String(page_size));
  if (filters?.search) params.set("search", filters.search);
  if (filters?.category) params.set("category", filters.category);
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
    return { count: 0, page_size: 0, results: [] };
  }
}

/**
 * Get product analytics/stats. 
 */
export async function getProductStats(fetcher?: <T>(path: string) => Promise<T>): Promise<ProductStats | null> {
  const path = "/api/v1/products/stats/";
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
  const { data } = await api.post<Product>("/api/v1/products/", payload);
  return data;
}

export async function updateProduct(id: number, payload: Partial<ProductPayload>): Promise<Product> {
  const { data } = await api.put<Product>(`/api/v1/products/${id}/`, payload);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/api/v1/products/${id}/`);
}
