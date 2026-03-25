import { serverFetch } from "@/src/lib/server-fetch";
import type { Product } from "@/src/types/product.types";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  let products: Product[] = [];
  try {
    const data = await serverFetch<any>("/api/products/");
    // Defensive: handle both array and object (e.g., { results: [...] })
    if (Array.isArray(data)) {
      products = data;
    } else if (data && Array.isArray(data.results)) {
      products = data.results;
    } else {
      products = [];
    }
  } catch {
    /* render empty, client can retry */
  }

  return <ProductsClient initialProducts={products} />;
}
