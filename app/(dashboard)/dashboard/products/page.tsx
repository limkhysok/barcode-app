export const dynamic = "force-dynamic";

import { serverFetch } from "@/src/lib/server-fetch";
import { getProducts, getProductStats } from "@/src/services/product.service";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ page?: string }>;
}>) {
  const { page: pageStr } = await searchParams;
  const page = Number.parseInt(pageStr ?? "1") || 1;

  // Fetch initial data + stats
  const [paginated, stats] = await Promise.all([
    getProducts(page, serverFetch),
    getProductStats(serverFetch),
  ]);

  return <ProductsClient initialPaginated={paginated} initialStats={stats} />;
}
