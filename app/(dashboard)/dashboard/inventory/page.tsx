export const dynamic = "force-dynamic";

import { serverFetch } from "@/src/lib/server-fetch";
import { getInventory, getInventoryStats } from "@/src/services/inventory.service";
import { getProducts } from "@/src/services/product.service";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ page?: string; page_size?: string; search?: string; site?: string }>;
}>) {
  const { page: pageStr, page_size: pageSizeStr, search, site } = await searchParams;
  const page = Number.parseInt(pageStr ?? "1") || 1;
  const pageSize = pageSizeStr || "20";

  const [paginatedRecords, paginatedProducts, stats] = await Promise.all([
    getInventory({ page, page_size: pageSize, search, site }, serverFetch),
    getProducts(1, serverFetch, {}, 1000),
    getInventoryStats(serverFetch),
  ]);

  return (
    <InventoryClient
      initialPaginatedRecords={paginatedRecords}
      initialPaginatedProducts={paginatedProducts}
      initialStats={stats}
    />
  );
}
