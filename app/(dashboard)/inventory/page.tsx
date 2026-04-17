export const dynamic = "force-dynamic";

import { serverFetch } from "@/src/lib/server-fetch";
import { getInventory } from "@/src/services/inventory.service";
import { getProducts } from "@/src/services/product.service";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{search?: string; site?: string }>;
}>) {
  const { search, site } = await searchParams;

  const [paginatedRecords, paginatedProducts] = await Promise.all([
    getInventory({ search, site }, serverFetch),
    getProducts(serverFetch, {}),
  ]);

  return (
    <InventoryClient
      initialPaginatedRecords={paginatedRecords}
      initialPaginatedProducts={paginatedProducts}
    />
  );
}
