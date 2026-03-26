import { serverFetch } from "@/src/lib/server-fetch";
import type { Transaction } from "@/src/types/transaction.types";
import type { InventoryRecord } from "@/src/types/inventory.types";
import TransactionsClient from "./TransactionsClient";

export default async function TransactionsPage() {
  const [transactions, inventory] = await Promise.all([
    serverFetch<Transaction[]>("/api/transactions/").catch((): Transaction[] => []),
    serverFetch<InventoryRecord[]>("/api/inventory/").catch((): InventoryRecord[] => []),
  ]);

  return <TransactionsClient initialTransactions={transactions} initialInventory={inventory} />;
}
