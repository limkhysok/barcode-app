export interface Product {
  id: number;
  barcode: string;
  product_name: string;
  category: string;
  cost_per_unit: string;
  reorder_level: number;
  supplier: string;
  created_at: string;
  updated_at: string;
  created_by: number;
}

export interface ProductPayload {
  barcode: string;
  product_name: string;
  category: string;
  cost_per_unit: number;
  reorder_level: number;
  supplier: string;
}
