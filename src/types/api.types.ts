import type { Product } from "./product.types";
import type { InventoryRecord } from "./inventory.types";
import type { Transaction } from "./transaction.types";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type PaginatedProducts = PaginatedResponse<Product>;
export type PaginatedInventory = PaginatedResponse<InventoryRecord>;
export type PaginatedTransactions = PaginatedResponse<Transaction>;
