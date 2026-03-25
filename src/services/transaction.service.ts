import api from "./api";
import type { Transaction, TransactionPayload } from "@/src/types/transaction.types";

export async function getTransactions(): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>("/api/transactions/");
  return data;
}

export async function createTransaction(payload: TransactionPayload): Promise<Transaction> {
  const { data } = await api.post<Transaction>("/api/transactions/", payload);
  return data;
}

export async function deleteTransaction(id: number): Promise<void> {
  await api.delete(`/api/transactions/${id}/`);
}
