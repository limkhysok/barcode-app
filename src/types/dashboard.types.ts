export interface DashboardRange {
  label: string;
  start: string;
  end: string;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface DashboardProductStats {
  total: number;
  by_category: CategoryStat[];
  low_stock: number;
  out_of_stock: number;
}

export interface SiteStat {
  site: string;
  records: number;
  total_quantity: number;
  total_stock_value: string;
}

export interface DashboardInventoryStats {
  total_records: number;
  total_quantity: number;
  total_stock_value: string;
  needs_reorder: number;
  by_site: SiteStat[];
}

export interface TransactionTypeStat {
  count: number;
  total_quantity: number;
}

export interface RecentActivityItem {
  id: number;
  transaction_type: "Receive" | "Sale";
  transaction_date: string;
  performed_by: string | null;
  item_count: number;
  total_quantity: number;
}

export interface DashboardTransactionStats {
  total: number;
  by_type: {
    Receive?: TransactionTypeStat;
    Sale?: TransactionTypeStat;
  };
  recent_activity: RecentActivityItem[];
}

export interface DashboardStats {
  range: DashboardRange;
  products: DashboardProductStats;
  inventory: DashboardInventoryStats;
  transactions: DashboardTransactionStats;
}
