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
    page_size?: string;
  }>;
}>) {
  const { page_size: pageSizeStr, search, category } = await searchParams;

  const page_size = pageSizeStr || "20";
  const filters = { search, category };

  const [paginated, stats] = await Promise.all([
    getProducts(serverFetch, filters, page_size),
    getProductStats(serverFetch),
  ]);

  return <ProductsClient initialPaginated={paginated} initialStats={stats} />;
}
