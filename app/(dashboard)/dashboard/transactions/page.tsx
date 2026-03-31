import { serverFetch } from "@/src/lib/server-fetch";
import { getTransactions } from "@/src/services/transaction.service";
import { getInventory } from "@/src/services/inventory.service";
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
    getTransactions({ page }, serverFetch).catch(
      (): PaginatedTransactions => ({ count: 0, next: null, previous: null, results: [] })
    ),
    getInventory({ page: 1 }, serverFetch).catch(
      (): PaginatedInventory => ({ count: 0, page_size: 20, results: [] })
    ),
  ]);

  return (
    <TransactionsClient
      initialPaginatedTransactions={paginatedTransactions}
      initialPaginatedInventory={paginatedInventory}
    />
  );
}
