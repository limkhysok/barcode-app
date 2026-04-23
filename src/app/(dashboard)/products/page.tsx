export const dynamic = "force-dynamic";

import { serverFetch } from "@/src/lib/server-fetch";
import { getProducts, getProductStats } from "@/src/services/product.service";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{
    search?: string;
    category?: string;
  }>;
}>) {
  const { search, category } = await searchParams;
  const filters = { search, category };

  const [paginated, stats] = await Promise.all([
    getProducts(serverFetch, filters),
    getProductStats(serverFetch),
  ]);

  return <ProductsClient initialPaginated={paginated} initialStats={stats} />;
}
