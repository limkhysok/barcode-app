import { serverFetch } from "@/src/lib/server-fetch";
import type { InventoryRecord } from "@/src/types/inventory.types";
import type { Product } from "@/src/types/product.types";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
  const [records, products] = await Promise.all([
    serverFetch<InventoryRecord[]>("/api/v1/inventory/").catch((): InventoryRecord[] => []),
    serverFetch<Product[]>("/api/v1/products/").catch((): Product[] => []),

  ]);

  return <InventoryClient initialRecords={records} initialProducts={products} />;
}
