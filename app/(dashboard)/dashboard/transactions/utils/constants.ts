// Constants and types for TransactionsClient

export const ringStyle = { "--tw-ring-color": "#FA4900" } as React.CSSProperties;

export const TYPE_CONFIG = {
  Receive: { label: "Receive", bg: "bg-green-50", text: "text-green-600", dot: "bg-green-500" },
  Sale:    { label: "Sale",    bg: "bg-red-50",   text: "text-red-600",   dot: "bg-red-500"   },
};

export type TxTypeFilter = "" | "Receive" | "Sale";
export type ItemDraft = { id: number; inventory: number; quantity: number };
export type TemplateItem = { barcode: string; product_name: string; unit: string; quantity: number };


let itemIdCounter = 0;
export function getNextItemId() {
  return ++itemIdCounter;
}
export const emptyItem = (): ItemDraft => ({ id: getNextItemId(), inventory: 0, quantity: 0 });
