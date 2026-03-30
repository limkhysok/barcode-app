import api from "./api";
import type { Transaction, TransactionPayload } from "@/src/types/transaction.types";
import type { PaginatedTransactions } from "@/src/types/api.types";

export async function getTransactions(params?: {
  type?: string;
  barcode?: string;
  search?: string;
  page?: number;
}): Promise<PaginatedTransactions> {
  const { data } = await api.get<PaginatedTransactions>("/api/v1/transactions/", { params });
  return data;
}

export async function createTransaction(payload: TransactionPayload): Promise<Transaction> {
  const { data } = await api.post<Transaction>("/api/v1/transactions/", payload);
  return data;
}

export async function updateTransaction(id: number, payload: TransactionPayload): Promise<Transaction> {
  const { data } = await api.patch<Transaction>(`/api/v1/transactions/${id}/`, payload);
  return data;
}

export async function deleteTransaction(id: number): Promise<void> {
  await api.delete(`/api/v1/transactions/${id}/`);
}

export interface ScanTransactionPayload {
  barcode: string;
  transaction_type: "Receive" | "Sale";
  quantity: number;
  inventory_id?: number;
}

export async function scanTransaction(payload: ScanTransactionPayload): Promise<Transaction> {
  const { data } = await api.post<Transaction>("/api/v1/transactions/scan/", payload);
  return data;
}
