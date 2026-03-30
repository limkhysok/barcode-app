import { serverFetch } from "@/src/lib/server-fetch";
import { getProducts } from "@/src/services/product.service";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  // Pass serverFetch to the universal service when calling from a Server Component
  const products = await getProducts(serverFetch);

  return <ProductsClient initialProducts={products} />;
}
