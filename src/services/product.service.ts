import api from "./api";
import type { Product, ProductPayload } from "@/src/types/product.types";

/**
 * Universal product getter. 
 * On server: Pass 'serverFetch' from "@/src/lib/server-fetch".
 * On client: Call without arguments.
 */
export async function getProducts(fetcher?: <T>(path: string) => Promise<T>): Promise<Product[]> {
  try {
    let data: any;

    if (fetcher) {
      // Server-side: Use the passed fetcher (usually serverFetch)
      data = await fetcher("/api/v1/products/");
    } else {
      // Client-side: Use the standard axios api instance
      const res = await api.get("/api/v1/products/");
      data = res.data;
    }

    // Defensive handling: support both direct array and DRF's { results: [] } wrapper
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
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
  const { data } = await api.put<Product>(`/api/v1/products/${id}/`, payload);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/api/v1/products/${id}/`);
}
