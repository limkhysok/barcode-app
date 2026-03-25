import { serverFetch } from "@/src/lib/server-fetch";
import type { Product } from "@/src/types/product.types";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  let products: Product[] = [];
  try {
    products = await serverFetch<Product[]>("/api/products/");
  } catch { /* render empty, client can retry */ }

  return <ProductsClient initialProducts={products} />;
}
