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
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No transactions found.</p>
      </div>
    );
  }

  /* ── MOBILE (< sm): compact 1-col rows ─────────────────────────────── */
  const mobileRows = (
    <div className="sm:hidden">
      <div className="px-3 py-1.5 flex items-center gap-2 border-b border-t border-gray-200 bg-white">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">#</span>
          <span className="text-slate-200">·</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Items</span>
          <span className="text-slate-200">·</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Type</span>
        </div>
        <div className="shrink-0 flex items-center gap-4">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Qty</span>
          <span className="text-slate-200">·</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date</span>
          <span className="w-7" />
        </div>
      </div>
      <div className="space-y-0">
        {displayed.map((t) => {
          const totalQty = t.items.reduce((sum, i) => sum + Math.abs(i.quantity), 0);
          return (
            <div key={t.id} className="relative group bg-white border-b border-gray-200 overflow-hidden">
              <div className="px-3 py-2 flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-slate-300 text-[10px] font-bold shrink-0">{t.id}</span>
                  <span className="shrink-0 text-[10px] font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-full">
                    x{t.items.length} {t.items.length === 1 ? "item" : "items"}
                  </span>
                  <span className="text-slate-300 shrink-0">·</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">{t.transaction_type}</span>
                </div>
                <div className="shrink-0 flex items-center gap-2 relative z-10">
                  <span className={`text-[12px] font-black tabular-nums leading-none ${t.transaction_type === "Receive" ? "text-green-600" : "text-red-500"}`}>
                    {t.transaction_type === "Receive" ? "+" : "-"}{totalQty}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter" suppressHydrationWarning>
                    {(() => {
                      const d = new Date(t.transaction_date);
                      const day = String(d.getDate()).padStart(2, "0");
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      const h24 = d.getHours();
                      const ampm = h24 >= 12 ? "PM" : "AM";
                      const h12 = h24 % 12 || 12;
                      return `${day}/${month} ${h12}${ampm}`;
                    })()}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => onActionClick(e, t)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-sm transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                    </svg>
                  </button>
                </div>
              </div>
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
    </div>
  );

  /* ── TABLET (sm → lg): always 2-col card grid ────────────────────────── */
  const tabletGrid = (
    <div className="hidden sm:grid lg:hidden grid-cols-2 gap-3">
      {displayed.map((t) => {
        const totalQty = t.items.reduce((sum, i) => sum + Math.abs(i.quantity), 0);
        const isReceive = t.transaction_type === "Receive";
        return (
          <div
            key={t.id}
            className="group bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col hover:border-orange-300 hover:shadow-md transition-all duration-200"
          >
            {/* Header */}
            <div className="px-4 pt-3 pb-2.5 flex items-center justify-between border-b border-slate-100">
              <span className="text-[10px] font-black text-slate-400 tabular-nums">#{t.id}</span>
              <span
                className={`inline-flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
                  isReceive ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"
                }`}
              >
                <span className={`w-1 h-1 rounded-full ${isReceive ? "bg-green-500" : "bg-red-500"}`} />
                {t.transaction_type}
              </span>
            </div>

            {/* Body */}
            <div className="px-4 py-4 flex-1 flex flex-col gap-3">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-3xl font-black tabular-nums leading-none ${isReceive ? "text-green-600" : "text-red-500"}`}>
                  {isReceive ? "+" : "-"}{totalQty}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">qty</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                  x{t.items.length} {t.items.length === 1 ? "item" : "items"}
                </span>
                <span className="text-[10px] font-bold text-slate-400 tabular-nums" suppressHydrationWarning>
                  {formatDateTime(t.transaction_date).split(" ")[0]}
                </span>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-3 pb-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5">
              <button type="button" onClick={() => onView(t)} className="flex-1 flex items-center justify-center py-2 rounded-sm bg-slate-50 border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-all cursor-pointer" title="View">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
              {canEdit && (
                <button type="button" onClick={() => onEdit(t)} className="flex-1 flex items-center justify-center py-2 rounded-sm bg-slate-50 border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-all cursor-pointer" title="Edit">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                </button>
              )}
              <button type="button" onClick={() => onPrint(t)} className="flex-1 flex items-center justify-center py-2 rounded-sm bg-slate-50 border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-all cursor-pointer" title="Print">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 3.99A.75.75 0 017.5 3.75h9a.75.75 0 01.75.75v3h-10.5v-3zM3 16.25v-3a3 3 0 013-3h12a3 3 0 013 3v3a.75.75 0 01-.75.75H18v3.75a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V17H3.75a.75.75 0 01-.75-.75zM9 15.75v3h6v-3H9z" /></svg>
              </button>
              {canDelete && (
                <button type="button" onClick={() => onDelete(t)} className="flex-1 flex items-center justify-center py-2 rounded-sm bg-slate-50 border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer" title="Delete">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" /></svg>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ── DESKTOP (lg+): list table or 3–4 col grid based on viewMode ─────── */
  const desktopList = (
    <div className="hidden lg:block overflow-x-auto bg-white border border-slate-200 rounded-md">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            {["#", "Type", "Items", "Qty", "Date", "By", "Actions"].map((h) => (
              <th key={h} className="px-5 py-3 text-left text-[9px] font-black tracking-widest text-slate-400 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {displayed.map((t) => {
            const totalQty = t.items.reduce((sum, i) => sum + Math.abs(i.quantity), 0);
            const isReceive = t.transaction_type === "Receive";
            return (
              <tr key={t.id} className="group hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3">
                  <span className="text-[11px] font-black text-slate-500 tabular-nums">#{t.id}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
                    isReceive ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${isReceive ? "bg-green-500" : "bg-red-500"}`} />
                    {t.transaction_type}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                    x{t.items.length} {t.items.length === 1 ? "item" : "items"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-[13px] font-black tabular-nums leading-none ${isReceive ? "text-green-600" : "text-red-500"}`}>
                    {isReceive ? "+" : "-"}{totalQty}
                  </span>
                </td>
                <td className="px-5 py-3" suppressHydrationWarning>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-black text-slate-700 tabular-nums">{formatDateTime(t.transaction_date).split(" ")[0]}</span>
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">{formatDateTime(t.transaction_date).split(" ")[1]}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-[10px] font-bold text-slate-500 truncate max-w-30 block">{t.performed_by_username ?? "—"}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-0.5 opacity-30 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => onView(t)} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-all cursor-pointer" title="View Details">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    {canEdit && (
                      <button type="button" onClick={() => onEdit(t)} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-all cursor-pointer" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                      </button>
                    )}
                    <button type="button" onClick={() => onPrint(t)} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-all cursor-pointer" title="Print PDF">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 3.99A.75.75 0 017.5 3.75h9a.75.75 0 01.75.75v3h-10.5v-3zM3 16.25v-3a3 3 0 013-3h12a3 3 0 013 3v3a.75.75 0 01-.75.75H18v3.75a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V17H3.75a.75.75 0 01-.75-.75zM9 15.75v3h6v-3H9z" /></svg>
                    </button>
                    {canDelete && (
                      <button type="button" onClick={() => onDelete(t)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer" title="Delete">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" /></svg>
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
  );

  const desktopGrid = (
    <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-3">
      {displayed.map((t) => {
        const totalQty = t.items.reduce((sum, i) => sum + Math.abs(i.quantity), 0);
        const isReceive = t.transaction_type === "Receive";
        return (
          <div key={t.id} className="group bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col hover:border-orange-300 hover:shadow-md transition-all duration-200">
            <div className="px-4 pt-3 pb-2.5 flex items-center justify-between border-b border-slate-100">
              <span className="text-[10px] font-black text-slate-400 tabular-nums">#{t.id}</span>
              <span className={`inline-flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
                isReceive ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"
              }`}>
                <span className={`w-1 h-1 rounded-full ${isReceive ? "bg-green-500" : "bg-red-500"}`} />
                {t.transaction_type}
              </span>
            </div>
            <div className="px-4 py-4 flex-1 flex flex-col gap-3">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-4xl font-black tabular-nums leading-none ${isReceive ? "text-green-600" : "text-red-500"}`}>
                  {isReceive ? "+" : "-"}{totalQty}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">qty</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                  x{t.items.length} {t.items.length === 1 ? "item" : "items"}
                </span>
                <span className="text-[10px] font-bold text-slate-400 tabular-nums" suppressHydrationWarning>
                  {formatDateTime(t.transaction_date).split(" ")[0]}
                </span>
              </div>
            </div>
            <div className="px-3 pb-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5">
              <button type="button" onClick={() => onView(t)} className="flex-1 flex items-center justify-center py-2 rounded-sm bg-slate-50 border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-all cursor-pointer" title="View">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
              {canEdit && (
                <button type="button" onClick={() => onEdit(t)} className="flex-1 flex items-center justify-center py-2 rounded-sm bg-slate-50 border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-all cursor-pointer" title="Edit">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                </button>
              )}
              <button type="button" onClick={() => onPrint(t)} className="flex-1 flex items-center justify-center py-2 rounded-sm bg-slate-50 border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-all cursor-pointer" title="Print">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 3.99A.75.75 0 017.5 3.75h9a.75.75 0 01.75.75v3h-10.5v-3zM3 16.25v-3a3 3 0 013-3h12a3 3 0 013 3v3a.75.75 0 01-.75.75H18v3.75a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V17H3.75a.75.75 0 01-.75-.75zM9 15.75v3h6v-3H9z" /></svg>
              </button>
              {canDelete && (
                <button type="button" onClick={() => onDelete(t)} className="flex-1 flex items-center justify-center py-2 rounded-sm bg-slate-50 border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer" title="Delete">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" /></svg>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {mobileRows}
      {tabletGrid}
      {viewMode === "list" ? desktopList : desktopGrid}
    </>
  );
};

export default TransactionsTable;
