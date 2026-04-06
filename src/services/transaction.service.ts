import api from "./api";
import type { Transaction, TransactionPayload } from "@/src/types/transaction.types";
import { isRedirectError } from "@/src/lib/is-redirect-error";

export async function getTransactions(params?: {
  type?: string;
  barcode?: string;
  search?: string;
  ordering?: string;
}, fetcher?: <T>(path: string) => Promise<T>): Promise<Transaction[]> {
  const query = new URLSearchParams();
  if (params?.type) query.set("type", params.type);
  if (params?.barcode) query.set("barcode", params.barcode);
  if (params?.search) query.set("search", params.search);
  if (params?.ordering) query.set("ordering", params.ordering);

  const path = `/api/v1/transactions/?${query.toString()}`;
  if (fetcher) return await fetcher(path);

  const { data } = await api.get<Transaction[]>(path);
  return data;
}

export interface TransactionTypeStats {
  total_count: number;
  today_count: number;
}

export interface TransactionStats {
  total_transactions: number;
  today_transactions: number;
  by_type: {
    Receive: TransactionTypeStats;
    Sale: TransactionTypeStats;
  };
}

export async function getTransactionStats(fetcher?: <T>(path: string) => Promise<T>): Promise<TransactionStats | null> {
  const path = "/api/v1/transactions/stats/";
  try {
    if (fetcher) {
      const res = await fetcher(path);
      return res as TransactionStats;
    }
    const { data } = await api.get<TransactionStats>(path);
    return data;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Failed to fetch transaction stats:", error);
    return null;
  }
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
