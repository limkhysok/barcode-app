import { serverFetch } from "@/src/lib/server-fetch";
import type { PaginatedInventory, PaginatedProducts } from "@/src/types/api.types";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ page?: string }>;
}>) {
  const { page: pageStr } = await searchParams;
  const page = Number.parseInt(pageStr ?? "1") || 1;

  const [paginatedRecords, paginatedProducts] = await Promise.all([
    serverFetch<PaginatedInventory>(`/api/v1/inventory/?page=${page}`).catch(
      (): PaginatedInventory => ({ count: 0, next: null, previous: null, results: [] })
    ),
    serverFetch<PaginatedProducts>(`/api/v1/products/?page=1`).catch(
      (): PaginatedProducts => ({ count: 0, next: null, previous: null, results: [] })
    ),
  ]);

  return (
    <InventoryClient
      initialPaginatedRecords={paginatedRecords}
      initialPaginatedProducts={paginatedProducts}
    />
  );
}
