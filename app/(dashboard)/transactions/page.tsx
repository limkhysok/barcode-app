export const dynamic = "force-dynamic";

import { serverFetch } from "@/src/lib/server-fetch";
import { isRedirectError } from "@/src/lib/is-redirect-error";
import { getTransactions, getTransactionStats } from "@/src/services/transaction.service";
import { getInventory } from "@/src/services/inventory.service";
import type { PaginatedTransactions, PaginatedInventory } from "@/src/types/api.types";
import TransactionsClient from "./TransactionsClient";

export default async function TransactionsPage() {
  const [paginatedTransactions, paginatedInventory, initialStats] = await Promise.all([
    getTransactions({ ordering: "-transaction_date" }, serverFetch).catch(
      (e: unknown): PaginatedTransactions => {
        if (isRedirectError(e)) throw e;
        return { count: 0, page_size: 20, results: [] };
      }
    ),
    getInventory({ page: 1 }, serverFetch).catch(
      (e: unknown): PaginatedInventory => {
        if (isRedirectError(e)) throw e;
        return { count: 0, page_size: 20, results: [] };
      }
    ),
    getTransactionStats(serverFetch).catch((e: unknown) => {
      if (isRedirectError(e)) throw e;
      return null;
    }),
  ]);

  return (
    <TransactionsClient
      initialPaginatedTransactions={paginatedTransactions}
      initialPaginatedInventory={paginatedInventory}
      initialStats={initialStats}
    />
  );
}
