export const dynamic = "force-dynamic";

import { serverFetch } from "@/src/lib/server-fetch";
import { isRedirectError } from "@/src/lib/is-redirect-error";
import type { Transaction } from "@/src/types/transaction.types";
import { getTransactions, getTransactionStats } from "@/src/services/transaction.service";
import { getInventory } from "@/src/services/inventory.service";
import type { PaginatedInventory } from "@/src/types/api.types";
import TransactionsClient from "./TransactionsClient";

export default async function TransactionsPage() {
  const [initialTransactions, paginatedInventory, initialStats] = await Promise.all([
    getTransactions({ ordering: "-transaction_date" }, serverFetch).catch(
      (e: unknown): Transaction[] => {
        if (isRedirectError(e)) throw e;
        return [];
      }
    ),
    getInventory({}, serverFetch).catch(
      (e: unknown): PaginatedInventory => {
        if (isRedirectError(e)) throw e;
        return { count: 0, results: [] };
      }
    ),
    getTransactionStats(serverFetch).catch((e: unknown) => {
      if (isRedirectError(e)) throw e;
      return null;
    }),
  ]);

  return (
    <TransactionsClient
      initialTransactions={initialTransactions}
      initialPaginatedInventory={paginatedInventory}
      initialStats={initialStats}
    />
  );
}
