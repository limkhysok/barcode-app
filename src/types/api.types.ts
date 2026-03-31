import type { Product } from "./product.types";
import type { InventoryRecord } from "./inventory.types";
import type { Transaction } from "./transaction.types";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PaginatedInventory {
  count: number;
  page_size: number;
  results: InventoryRecord[];
}

export type PaginatedProducts = PaginatedResponse<Product>;
export type PaginatedTransactions = PaginatedResponse<Transaction>;

export interface ProductStats {
  total_products: number;
  total_value: number;
  by_category: {
    Accessories: { count: number; total_value: number };
    Fasteners: { count: number; total_value: number };
  };
}
