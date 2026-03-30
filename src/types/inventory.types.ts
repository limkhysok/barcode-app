export interface InventoryProductDetails {
  id: number;
  barcode: string;
  product_name: string;
  category: string;
  supplier: string;
  cost_per_unit: string;
  reorder_level: number;
}


export interface InventoryRecord {
  id: number;
  product: number;
  product_details: InventoryProductDetails;
  site: string;
  location: string;
  product_description: string;
  quantity_on_hand: number;
  stock_value: string;
  reorder_status: "Yes" | "No";
  order_date: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryPayload {
  product: number;
  site: string;
  location: string;
  quantity_on_hand: number;
}

/** Response from GET /api/inventory/scan?barcode=<value> */
export interface ScanResult {
  found: boolean;
  product?: InventoryProductDetails;
  inventory: InventoryRecord[];
  detail?: string;
}
