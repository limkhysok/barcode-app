import api from "./api";
import type { Transaction, TransactionPayload } from "@/src/types/transaction.types";

export async function getTransactions(params?: {
  inventory_id?: number;
  type?: string;
  barcode?: string;
  search?: string;
}): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>("/api/transactions/", { params });
  return data;
}

export async function createTransaction(payload: TransactionPayload): Promise<Transaction> {
  const { data } = await api.post<Transaction>("/api/transactions/", payload);
  return data;
}

export async function deleteTransaction(id: number): Promise<void> {
  await api.delete(`/api/transactions/${id}`);
}

export interface ScanTransactionPayload {
  barcode: string;
  transaction_type: "Receive" | "Sale";
  quantity: number;
  inventory_id?: number;
}

export async function scanTransaction(payload: ScanTransactionPayload): Promise<Transaction> {
  const { data } = await api.post<Transaction>("/api/transactions/scan", payload);
  return data;
}
