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
  onView: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onPrint: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
  canEdit: boolean;
  canDelete: boolean;
  onActionClick: (e: React.MouseEvent, t: Transaction) => void;
  viewMode?: "list" | "grid";
};

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  displayed,
  loading,
  error,
  onView,
  onEdit,
  onPrint,
  onDelete,
  canEdit,
  canDelete,
  onActionClick,
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
      <div className="sm:hidden space-y-2">
        {displayed.map((t) => {
          const totalQty = t.items.reduce((sum, item) => sum + Math.abs(item.quantity), 0);
          const first = t.items[0];
          const more = t.items.length - 1;

          return (
            <div
              key={t.id}
              className="relative group bg-white border border-gray-200 rounded-sm overflow-hidden hover:shadow-md hover:border-orange-500/30 transition-all duration-300"
            >
              <div className="flex flex-col divide-y divide-gray-100">
                {/* Row 1: ID, Type and Quantity */}
                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 rounded-sm text-[11px] font-bold px-1 py-0.5">
                      #{t.id}
                    </span>
                    <span className={`text-slate-800 text-[10px] font-bold uppercase tracking-wider px-1 py-0.5`}>
                       {t.transaction_type}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-xl font-black text-orange-600 tabular-nums leading-none">
                        {totalQty}
                      </span>
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Quantity</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Product Name, Date and Actions */}
                <div className="px-3 py-1 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[10px] font-black text-slate-900 truncate uppercase leading-tight group-hover:text-orange-600 transition-colors">
                      {first?.product_name ?? "—"}
                      {more > 0 && <span className="text-gray-400 font-bold ml-1.5 text-[11px]">+{more} MORE</span>}
                    </h3>
                  </div>
                  <div className="shrink-0 flex items-center gap-3 relative z-10">
                    <span className="text-gray-600 font-mono text-[10px] uppercase font-bold tracking-tighter" suppressHydrationWarning>
                      {formatDateTime(t.transaction_date).split(' ')[0]}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => onActionClick(e, t)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                      title="More Actions"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Invisible Clickable Surface for Primary Action (z-0 ensures it's below interactive footer) */}
              <button
                type="button"
                onClick={() => onView(t)}
                className="absolute inset-0 w-full h-full cursor-pointer z-0 opacity-0"
                aria-label="View Details"
              />
            </div>
          );
        })}
      </div>

      {/* Desktop — grid view */}
      {viewMode === "grid" && (
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {displayed.map((t) => {
            const totalQty = t.items.reduce((sum, item) => sum + Math.abs(item.quantity), 0);
            const first = t.items[0];
            const more = t.items.length - 1;

            return (
              <div key={t.id} className="group bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col transition-all duration-300 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/10">
                {/* Header (Integrated) */}
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</span>
                    <span className="text-[14px] font-black text-black tabular-nums group-hover:text-orange-600 transition-colors">#{t.id}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-300 font-mono tracking-tighter uppercase" suppressHydrationWarning>{formatDateTime(t.transaction_date).split(' ')[0]}</span>
                </div>

                {/* Card Body */}
                <div className="px-4 py-2 flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${t.transaction_type === 'Receive' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover:text-orange-400">{t.transaction_type}</p>
                      </div>
                      <p className="text-[16px] font-black text-black leading-tight tracking-tight group-hover:text-orange-600 transition-colors uppercase truncate max-w-37.5">{first?.product_name ?? "—"}</p>
                      {more > 0 && <p className="text-[10px] font-bold text-gray-400 group-hover:text-orange-300">and {more} more items...</p>}
                    </div>
                    <div className="w-10 h-10 rounded-sm bg-slate-50 border border-gray-100 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-orange-500 transition-all">
                      <span className="text-gray-950 text-lg font-black group-hover:text-white transition-colors">{t.transaction_type === 'Receive' ? '↓' : '↑'}</span>
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-slate-50 border border-gray-100 rounded-sm p-2 flex flex-col items-center justify-center group-hover:bg-orange-50 transition-colors">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover:text-orange-400 mb-1">Items</span>
                      <span className="text-[16px] font-black text-black tabular-nums group-hover:text-orange-600 leading-none">{t.items.length}</span>
                    </div>
                    <div className="bg-slate-50 border border-gray-100 rounded-sm p-2 flex flex-col items-center justify-center group-hover:bg-orange-50 transition-colors">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover:text-orange-400 mb-1">Total Qty</span>
                      <span className="text-[16px] font-black text-black tabular-nums group-hover:text-orange-600 leading-none">{totalQty}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="px-4 py-3 pb-4 flex flex-col gap-3 mt-2">
                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <button type="button" onClick={() => onView(t)} className="flex-1 flex items-center justify-center py-2.5 rounded-sm bg-slate-50 border border-gray-100 text-gray-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-all active:scale-90 shadow-sm" title="View"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                    {canEdit && <button type="button" onClick={() => onEdit(t)} className="flex-1 flex items-center justify-center py-2.5 rounded-sm bg-slate-50 border border-gray-100 text-gray-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-90 shadow-sm" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg></button>}
                    <button type="button" onClick={() => onPrint(t)} className="flex-1 flex items-center justify-center py-2.5 rounded-sm bg-slate-50 border border-gray-100 text-gray-400 hover:text-black hover:border-black/50 hover:bg-gray-100 transition-all active:scale-90 shadow-sm" title="Print"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 3.99A.75.75 0 017.5 3.75h9a.75.75 0 01.75.75v3h-10.5v-3zM3 16.25v-3a3 3 0 013-3h12a3 3 0 013 3v3a.75.75 0 01-.75.75H18v3.75a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V17H3.75a.75.75 0 01-.75-.75zM9 15.75v3h6v-3H9z" /></svg></button>
                    {canDelete && <button type="button" onClick={() => onDelete(t)} className="flex-1 flex items-center justify-center py-2.5 rounded-sm bg-slate-50 border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all active:scale-90 shadow-sm" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.34 9m-4.72 0l-.34-9m9.48-3.32a48.108 48.108 0 00-3.45-1.24.47.47 0 01-.36-.31L15.65 1.11A.75.75 0 0015.01 1H8.99a.75.75 0 00-.64.11l-.38 1.41a.47.47 0 01-.36.31c-1.17.3-2.31.72-3.45 1.24m11.31 10.59l-.83 6.7a1.5 1.5 0 01-1.49 1.32H8.3a1.5 1.5 0 01-1.49-1.32l-.83-6.7m13.26-2.4l-13.26 2.4" /></svg></button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Desktop — list view */}
      {viewMode === "list" && (
        <div className="hidden sm:block overflow-x-auto bg-white border border-gray-200 rounded-md shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 border-b border-gray-100">
              <tr>
                {["#", "Type", "Items", "Total Quantity", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-[11px] font-black tracking-widest text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {displayed.map((t) => {
                const totalQty = t.items.reduce((sum, item) => sum + Math.abs(item.quantity), 0);
                return (
                  <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-black text-black tabular-nums group-hover:text-orange-600 transition-colors">#{t.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                        {t.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800 text-[12px]">
                      {t.items.length} {t.items.length === 1 ? "Item" : "Items"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center justify-center px-2 py-1 border-gray-100 group-hover:bg-orange-50 transition-colors">
                        <span className="font-black tabular-nums text-black text-[12px] group-hover:text-orange-600">
                          {totalQty}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4" suppressHydrationWarning>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-gray-800 uppercase tracking-tight group-hover:text-orange-600">{formatDateTime(t.transaction_date).split(' ')[0]}</span>
                        <span className="text-[11px] font-bold text-gray-300 tabular-nums">{formatDateTime(t.transaction_date).split(' ')[1]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onView(t)}
                          className="p-2 text-gray-300 hover:text-orange-500 transition-all cursor-pointer"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(t)}
                            className="p-2 text-gray-300 hover:text-orange-500 transition-all cursor-pointer"
                            title="Edit Transaction"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onPrint(t)}
                          className="p-2 text-gray-300 hover:text-orange-500 transition-all cursor-pointer"
                          title="Print PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 3.99A.75.75 0 017.5 3.75h9a.75.75 0 01.75.75v3h-10.5v-3zM3 16.25v-3a3 3 0 013-3h12a3 3 0 013 3v3a.75.75 0 01-.75.75H18v3.75a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V17H3.75a.75.75 0 01-.75-.75zM9 15.75v3h6v-3H9z" />
                          </svg>
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(t)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-all cursor-pointer"
                            title="Delete Transaction"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
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
