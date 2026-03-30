export const dynamic = "force-dynamic";

import { serverFetch } from "@/src/lib/server-fetch";
import { getProducts, getProductStats } from "@/src/services/product.service";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ 
    page?: string; 
    limit?: string;
    search?: string;
    category?: string;
    min_cost?: string;
    max_cost?: string;
    min_reorder?: string;
    max_reorder?: string;
    needs_reorder?: string;
    page_size?: string;
  }>;
}>) {
  const { 
    page: pageStr, page_size: pageSizeStr, search, category, 
    min_cost, max_cost, min_reorder, max_reorder, needs_reorder 
  } = await searchParams;
  
  const page = Number.parseInt(pageStr ?? "1") || 1;
  const page_size = pageSizeStr || "20";

  const filters = {
    search, category,
    min_cost, max_cost, min_reorder, max_reorder,
    needs_reorder: needs_reorder === "true"
  };

  // Fetch initial data + stats
  const [paginated, stats] = await Promise.all([
    getProducts(page, serverFetch, filters, page_size),
    getProductStats(serverFetch),
  ]);

  return <ProductsClient initialPaginated={paginated} initialStats={stats} />;
}
