"use client";

import React from "react";
import type { Transaction } from "@/src/types/transaction.types";

function formatDateTime(ts: string): string {
  const d = new Date(ts);
  const day   = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year  = d.getFullYear();
  const h24   = d.getHours();
  const mins  = d.getMinutes();
  const ampm  = h24 >= 12 ? "PM" : "AM";
  const h12   = h24 % 12 || 12;
  const time  = mins === 0 ? `${h12}${ampm}` : `${h12}:${String(mins).padStart(2, "0")}${ampm}`;
  return `${day}/${month}/${year} ${time}`;
}

function fmtValue(v: string, sign: string) {
  return `${sign}$${Math.abs(Number.parseFloat(v)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const TYPE_CONFIG: Record<string, { label: string; text: string }> = {
  Receive: { label: "Receive", text: "text-black" },
  Sale:    { label: "Sale",    text: "text-black" },
};

type TransactionsTableProps = {
  displayed: Transaction[];
  loading: boolean;
  error: string;
  onActionClick: (e: React.MouseEvent, t: Transaction) => void;
  menuOpenId: number | null;
};

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  displayed,
  loading,
  error,
  onActionClick,
  menuOpenId,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#FA4900", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (error) {
    return <p className="text-center py-20 text-sm text-red-400">{error}</p>;
  }

  if (displayed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        <p className="text-sm font-medium">No transactions found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-black">
        {displayed.map((t) => {
          const cfg = TYPE_CONFIG[t.transaction_type as keyof typeof TYPE_CONFIG];
          const sign = t.transaction_type === "Receive" ? "+" : "−";
          const valCol = t.transaction_type === "Receive" ? "text-green-600" : "text-red-500";
          const first = t.items[0];
          const more = t.items.length - 1;
          return (
            <div key={t.id} className="px-4 py-4 flex items-start gap-3 active:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">
                    {first?.product_name ?? "—"}
                    {more > 0 && <span className="text-gray-400 font-normal"> & {more} more</span>}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {t.items.length} item{t.items.length === 1 ? "" : "s"}
                </p>
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <span className={`text-sm font-black tabular-nums ${valCol}`}>
                    {fmtValue(t.total_transaction_value, sign)}
                  </span>
                  <span className="text-gray-400">by <span className="font-semibold text-gray-600">{t.performed_by_username}</span></span>
                </div>
                <p className="text-[11px] text-gray-400" suppressHydrationWarning>{formatDateTime(t.transaction_date)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => onActionClick(e, t)}
                className="p-2.5 rounded-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition shrink-0 mt-0.5"
                title="Actions"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-black">
            <tr>
              {["#", "Type", "Items", "Total Value", "Date", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[12px] font-light tracking-widest text-slate-900">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black bg-white text-[12px]">
            {displayed.map((t) => {
              const cfg = TYPE_CONFIG[t.transaction_type as keyof typeof TYPE_CONFIG];
              const sign = t.transaction_type === "Receive" ? "+" : "−";
              const valCol = t.transaction_type === "Receive" ? "text-green-600" : "text-red-500";
              return (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-0 font-black text-gray-400">#{t.id}</td>
                  <td className="px-5 py-2">
                    <span className={`inline-flex text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-2 font-semibold text-gray-800">
                    {t.items.length} {t.items.length === 1 ? "Item" : "Items"}
                  </td>
                  <td className={`px-5 py-2 font-bold tabular-nums ${valCol}`}>
                    {fmtValue(t.total_transaction_value, sign)}
                  </td>
                  <td className="px-5 py-2 text-gray-500 whitespace-nowrap" suppressHydrationWarning>
                    {formatDateTime(t.transaction_date)}
                  </td>
                  <td className="px-5 py-2">
                    <button
                      type="button"
                      onClick={(e) => onActionClick(e, t)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                      title="Actions"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TransactionsTable;
