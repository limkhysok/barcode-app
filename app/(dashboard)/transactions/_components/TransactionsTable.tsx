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
  viewMode?: "list" | "grid";
};

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  displayed,
  loading,
  error,
  onActionClick,
  menuOpenId,
  viewMode = "list",
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
          const first = t.items[0];
          const more = t.items.length - 1;

          return (
            <div key={t.id} className="px-3 py-3 bg-white border border-gray-700 rounded-lg mb-4 shadow-sm hover:shadow-md transition-shadow duration-150">

              {/* Card Header (Row 1) */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-white bg-black px-1.5 py-0.5 rounded shadow-sm shrink-0">#{t.id}</span>
                    <span className="text-[9px] font-semibold text-black uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded truncate shadow-sm">{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider shrink-0">Product:</span>
                    <p className="font-bold text-gray-900 text-[10px] leading-tight truncate uppercase tracking-tight">
                      {first?.product_name ?? "—"}
                      {more > 0 && <span className="text-gray-400 font-normal"> & {more} MORE</span>}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 px-2 py-0.5 ">
                    <span className="text-[11px] font-bold tabular-nums leading-none text-black">
                      Qty: {t.items.reduce((sum, item) => sum + Math.abs(item.quantity), 0)}
                    </span>
                  </div>
                  <div className="flex items-center -mr-0.5">
                    <button
                      onClick={(e) => onActionClick(e, t)}
                      className="p-1 px-1.5 rounded text-gray-300 hover:text-black hover:bg-gray-100 transition-colors active:scale-95 "
                      title="Actions"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Meta (Row 2) - items left, date right */}
              <div className="flex items-center justify-between mb-2 px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] shadow-sm">
                <div className="flex items-center gap-1 min-w-0 text-gray-700 font-semibold">
                  <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l1.29 1.29m-12.18 5.625h16.5m-16.5 0a2.25 2.25 0 002.25 2.25h12.008a2.25 2.25 0 002.25-2.25m-16.5 0V6.375m16.5 0v.112c0 2.232-1.808 4.04-4.04 4.04h-1.508a4.486 4.486 0 00-4.486 4.486v1.508c0 2.232-1.808 4.04-4.04 4.04h-1.112z" />
                  </svg>
                  <span className="truncate font-semibold">{t.items.length} ITEMS</span>
                </div>
                <p className="text-[9px] font-semibold text-gray-400 font-mono tracking-tight" suppressHydrationWarning>
                  {formatDateTime(t.transaction_date)}
                </p>
              </div>

            </div>
          );
        })}
      </div>

      {/* Desktop — grid view */}
      {viewMode === "grid" && (
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
          {displayed.map((t) => {
            const totalQty = t.items.reduce((sum, item) => sum + Math.abs(item.quantity), 0);
            const first = t.items[0];
            const more = t.items.length - 1;
            return (
              <div key={t.id} className="bg-white border border-black flex flex-col overflow-hidden hover:bg-slate-50/40 transition-colors duration-150">
                {/* body: left number column + right content */}
                <div className="flex flex-1 min-h-0">
                  {/* left: big ID */}
                  <div className="w-14 shrink-0 border-r border-black/10 flex flex-col items-center justify-center py-4 bg-slate-50">
                    <span className="text-[8px] font-black tracking-[0.2em] uppercase text-gray-400 mb-1">N0.</span>
                    <span className="text-[18px] font-black tabular-nums text-gray-900 leading-none">{t.id}</span>
                  </div>
                  {/* right: type + product + more */}
                  <div className="flex-1 min-w-0 px-3 py-3 flex flex-col justify-between gap-1">
                    <span className="text-[8px] font-black tracking-[0.2em] uppercase text-gray-400">{t.transaction_type}</span>
                    <div>
                      <p className="text-[12px] font-bold text-gray-900 truncate leading-snug">{first?.product_name ?? "—"}</p>
                      {more > 0 && (
                        <p className="text-[9px] text-gray-400 mt-0.5">+{more} more item{more > 1 ? "s" : ""}</p>
                      )}
                    </div>
                  </div>
                  {/* action */}
                  <div className="flex items-start pt-2 pr-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => onActionClick(e, t)}
                      className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-black hover:bg-gray-100 transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* stats row */}
                <div className="grid grid-cols-2 divide-x divide-black/10 border-t border-black">
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="text-[8px] font-black tracking-[0.15em] uppercase text-gray-400">Items</span>
                    <span className="text-[13px] font-black tabular-nums text-gray-900">{t.items.length}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="text-[8px] font-black tracking-[0.15em] uppercase text-gray-400">Qty</span>
                    <span className="text-[13px] font-black tabular-nums text-gray-900">{totalQty}</span>
                  </div>
                </div>
                {/* footer */}
                <div className="flex items-center justify-between px-3 py-1.5 border-t border-black/10 bg-slate-50">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest truncate">{t.performed_by_username ?? "—"}</span>
                  <span className="text-[8px] text-gray-400 tabular-nums shrink-0 ml-2" suppressHydrationWarning>{formatDateTime(t.transaction_date)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Desktop — list view */}
      {viewMode === "list" && (
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm border border-black rounded-4xl">
          <thead className="bg-slate-50 border-b border-black">
            <tr>
              {["#", "Type", "Items", "Total Quantity", "Date", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[12px] font-light tracking-widest text-slate-900">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black bg-white text-[12px]">
            {displayed.map((t) => {
              const cfg = TYPE_CONFIG[t.transaction_type as keyof typeof TYPE_CONFIG];
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
                  <td className="px-5 py-2 font-semibold tabular-nums text-gray-800">
                    {t.items.reduce((sum, item) => sum + Math.abs(item.quantity), 0)}
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
      )}
    </>
  );
};

export default TransactionsTable;
