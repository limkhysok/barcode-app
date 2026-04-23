import type { Product } from "./product.types";
import type { InventoryRecord } from "./inventory.types";

export interface PaginatedResponse<T> {
  count: number;
  page_size?: number;
  results: T[];
}

export type PaginatedInventory = PaginatedResponse<InventoryRecord>;

export type PaginatedProducts = PaginatedResponse<Product>;

export interface ProductStats {
  total_products: number;
  total_value: number;
  by_category: {
    Accessories: { count: number; total_value: number };
    Fasteners: { count: number; total_value: number };
  };
}
