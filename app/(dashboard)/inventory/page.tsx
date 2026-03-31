export const dynamic = "force-dynamic";

import { serverFetch } from "@/src/lib/server-fetch";
import { getInventory } from "@/src/services/inventory.service";
import { getProducts } from "@/src/services/product.service";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{page_size?: string; search?: string; site?: string }>;
}>) {
  const { page_size: pageSizeStr, search, site } = await searchParams;

  const pageSize = pageSizeStr || "20";

  const [paginatedRecords, paginatedProducts] = await Promise.all([
    getInventory({ page_size: pageSize, search, site }, serverFetch),
    getProducts(serverFetch, {}, 1000),
  ]);

  return (
    <InventoryClient
      initialPaginatedRecords={paginatedRecords}
      initialPaginatedProducts={paginatedProducts}
      initialStats={null}
    />
  );
}
