"use client";

import React from "react";
import type { Transaction } from "@/src/types/transaction.types";

function formatDateTime(ts: string): string {
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const h24 = d.getHours();
  const mins = d.getMinutes();
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  const time = mins === 0 ? `${h12}${ampm}` : `${h12}:${String(mins).padStart(2, "0")}${ampm}`;
  return `${day}/${month}/${year} ${time}`;
}

function fmtValue(v: string, sign: string) {
  return `${sign}$${Math.abs(Number.parseFloat(v)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const TYPE_CONFIG: Record<string, { label: string; text: string }> = {
  Receive: { label: "Receive", text: "text-black" },
  Sale: { label: "Sale", text: "text-black" },
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
          const valCol = t.transaction_type === "Receive" ? "text-green-700 bg-green-50 border-green-100" : "text-red-700 bg-red-50 border-red-100";
          const first = t.items[0];
          const more = t.items.length - 1;

          return (
            <div key={t.id} className="px-3 py-2 bg-white">

              {/* Card Header (Row 1) */}
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-50">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black text-white bg-black px-1.5 py-0.5 rounded-sm shrink-0">#{t.id}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md truncate">{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Product:</span>
                    <p className="font-black text-gray-900 text-[11px] leading-snug truncate uppercase tracking-tighter">
                      {first?.product_name ?? "—"}
                      {more > 0 && <span className="text-gray-400 font-normal"> & {more} MORE</span>}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border shadow-sm ${valCol}`}>
                    <span className="text-[12px] font-black tabular-nums leading-none">
                      {fmtValue(t.total_transaction_value, sign)}
                    </span>
                  </div>
                  <div className="flex items-center -mr-1">
                    <button
                      onClick={(e) => onActionClick(e, t)}
                      className="p-1 px-1.5 rounded-lg text-gray-300 hover:text-gray-900 transition-colors active:scale-95"
                      title="Actions"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Meta (Row 2) */}
              <div className="flex items-center gap-3 mb-2 px-1 py-1 bg-slate-50/70 border border-slate-100/50 rounded-lg text-[10px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <span className="font-bold text-gray-700 truncate">{t.performed_by_username}</span>
                </div>
                <span className="text-slate-300 select-none">•</span>
                <div className="flex items-center gap-1.5 min-w-0 text-slate-500">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l1.29 1.29m-12.18 5.625h16.5m-16.5 0a2.25 2.25 0 002.25 2.25h12.008a2.25 2.25 0 002.25-2.25m-16.5 0V6.375m16.5 0v.112c0 2.232-1.808 4.04-4.04 4.04h-1.508a4.486 4.486 0 00-4.486 4.486v1.508c0 2.232-1.808 4.04-4.04 4.04h-1.112z" />
                  </svg>
                  <span className="truncate font-medium">{t.items.length} ITEMS</span>
                </div>
              </div>

              {/* Card Footer (Row 3) */}
              <div className="flex items-center justify-between px-1.5 py-1">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${t.transaction_type === "Receive" ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Log</span>

                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-200 text-[12px]">•</span>
                  <p className="text-[9px] font-black text-slate-500 font-mono tracking-tighter uppercase tabular-nums" suppressHydrationWarning>
                    {formatDateTime(t.transaction_date)}
                  </p>
                </div>
              </div>

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
