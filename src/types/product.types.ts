export interface Product {
  id: number;
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
  product_name: string;
  category: string;
  cost_per_unit: number;
  reorder_level: number;
  supplier: string;
}
