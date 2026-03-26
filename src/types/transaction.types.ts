import type { InventoryRecord } from "./inventory.types";

export interface Transaction {
  id: number;
  inventory: number;
  inventory_details: InventoryRecord;
  product_name: string;
  barcode: string;
  site: string;
  location: string;
  transaction_type: "Receive" | "Sale";
  quantity: number;
  total_value: string;
  performed_by: number;
  performed_by_username: string;
  transaction_date: string;
}

export interface TransactionPayload {
  inventory: number;
  transaction_type: "Receive" | "Sale";
  quantity: number;
}
