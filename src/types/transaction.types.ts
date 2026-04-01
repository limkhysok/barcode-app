export interface TransactionItem {
  id: number;
  inventory: number;
  product_name: string;
  quantity: number;
  cost_per_unit: string;
  line_total: string;
}

export interface Transaction {
  id: number;
  transaction_type: "Receive" | "Sale";
  performed_by: number;
  performed_by_username: string;
  total_transaction_value: string;
  items: TransactionItem[];
  transaction_date: string;
}

export interface TransactionItemPayload {
  inventory: number;
  quantity: number;
}

export interface TransactionPayload {
  transaction_type: "Receive" | "Sale";
  items: TransactionItemPayload[];
}
