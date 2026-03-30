export const dynamic = "force-dynamic";

import { serverFetch } from "@/src/lib/server-fetch";
import type { PaginatedTransactions, PaginatedInventory } from "@/src/types/api.types";
import TransactionsClient from "./TransactionsClient";

export default async function TransactionsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ page?: string }>;
}>) {
  const { page: pageStr } = await searchParams;
  const page = Number.parseInt(pageStr ?? "1") || 1;

  const [paginatedTransactions, paginatedInventory] = await Promise.all([
    serverFetch<PaginatedTransactions>(`/api/v1/transactions/?page=${page}`).catch(
      (): PaginatedTransactions => ({ count: 0, next: null, previous: null, results: [] })
    ),
    serverFetch<PaginatedInventory>("/api/v1/inventory/?page=1").catch(
      (): PaginatedInventory => ({ count: 0, next: null, previous: null, results: [] })
    ),
  ]);

  return (
    <TransactionsClient
      initialPaginatedTransactions={paginatedTransactions}
      initialPaginatedInventory={paginatedInventory}
    />
  );
}
