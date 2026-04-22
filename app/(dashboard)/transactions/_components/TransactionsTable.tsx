"use client";

import React from "react";
import type { Transaction } from "@/src/types/transaction.types";
import { 
  Eye, 
  Edit2, 
  Printer, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  Clock,
  User,
  Layers,
  ArrowRightLeft
} from "lucide-react";

export type SortDir = "asc" | "desc" | "";

interface TransactionsTableProps {
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
  ordering?: string;
  onSort?: (col: string) => void;
}

const SortIcon = ({ field, currentOrdering }: { field: string; currentOrdering: string }) => {
  const isAsc = currentOrdering === field;
  const isDesc = currentOrdering === `-${field}`;
  if (!isAsc && !isDesc) return null;
  return isAsc ? (
    <ArrowUp size={10} className="ml-1.5 text-orange-500" strokeWidth={3} />
  ) : (
    <ArrowDown size={10} className="ml-1.5 text-orange-500" strokeWidth={3} />
  );
};

const Header = ({
  label,
  field,
  className,
  ordering,
  handleSort,
}: {
  label: string;
  field?: string;
  className?: string;
  ordering: string;
  handleSort?: (f: string) => void;
}) => {
  const isSortable = !!field && !!handleSort;
  const isActive = field && (ordering === field || ordering === `-${field}`);
  return (
    <th
      onClick={() => isSortable && field && handleSort?.(label)}
      className={`px-5 py-4 text-left text-[9px] font-black tracking-widest uppercase transition-all duration-200 select-none ${
        isSortable ? "cursor-pointer hover:bg-slate-100/50" : ""
      } ${isActive ? "text-orange-600 bg-orange-50/30" : "text-slate-400"} ${className || ""}`}
    >
      <div className={`flex items-center ${className?.includes('center') ? 'justify-center' : ''} ${className?.includes('right') ? 'justify-end' : ''}`}>
        {label}
        {isSortable && field && <SortIcon field={field} currentOrdering={ordering} />}
      </div>
    </th>
  );
};

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
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

function TypeBadge({ type }: Readonly<{ type: "Receive" | "Sale" }>) {
  const isReceive = type === "Receive";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
      isReceive ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"
    }`}>
      <span className={`w-1 h-1 rounded-full ${isReceive ? "bg-green-500" : "bg-red-500"}`} />
      {type}
    </span>
  );
}

export function TransactionsTable({
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
  ordering = "",
  onSort,
}: Readonly<TransactionsTableProps>) {

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#FA4900", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <p className="max-w-md text-center py-4 text-[10px] font-black text-red-500 bg-red-50/50 rounded-sm border border-red-100 uppercase tracking-[0.2em] leading-loose">
          {error}
        </p>
      </div>
    );
  }

  if (displayed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-300">
        <ArrowRightLeft className="w-10 h-10 opacity-20" strokeWidth={1} />
        <p className="text-[9px] font-black uppercase tracking-[0.25em]">No Transactions Found</p>
      </div>
    );
  }

  // ── Mobile: compact rows ──
  const mobileRows = (
    <div className="sm:hidden">
      <div className="px-3 py-1.5 flex items-center gap-2 border-b border-t border-slate-200 bg-white">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">#</span>
          <span className="text-slate-200">·</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Transaction</span>
        </div>
        <div className="shrink-0 flex items-center gap-4">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Qty</span>
          <span className="w-7" />
        </div>
      </div>
      <div className="divide-y divide-slate-100 bg-white">
        {displayed.map((t) => {
          const totalQty = t.items.reduce((sum, i) => sum + Math.abs(i.quantity), 0);
          const isReceive = t.transaction_type === "Receive";
          return (
            <div key={t.id} className="group bg-white hover:bg-slate-50 transition-all duration-300">
              <div className="px-3 py-3.5 flex items-center gap-3">
                <button
                  onClick={() => onView(t)}
                  className="flex flex-col flex-1 min-w-0 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] font-black text-slate-300 tabular-nums">#{t.id}</span>
                    <span className="text-slate-200">·</span>
                    <TypeBadge type={t.transaction_type} />
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers size={9} className="text-slate-300 shrink-0" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                      {t.items.length} Items · {t.performed_by_username}
                    </span>
                  </div>
                </button>
                <div className="shrink-0 flex items-center gap-4">
                  <span className={`text-[12px] font-black tabular-nums leading-none w-10 h-8 flex items-center justify-center rounded-sm ${isReceive ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                    {isReceive ? "+" : "-"}{totalQty}
                  </span>
                  <div className="flex items-center">
                    <button onClick={() => onView(t)} className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors cursor-pointer" title="View">
                      <Eye size={14} strokeWidth={2.5} />
                    </button>
                    <button onClick={(e) => onActionClick(e, t)} className="p-1.5 text-slate-300 hover:text-orange-500 transition-colors cursor-pointer" title="Menu">
                      <ArrowRightLeft size={14} strokeWidth={2.5} className="rotate-90" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Tablet: 2-col Grid ──
  const tabletGrid = (
    <div className="hidden sm:grid lg:hidden grid-cols-2 gap-3 p-1">
      {displayed.map((t) => {
        const totalQty = t.items.reduce((sum, i) => sum + Math.abs(i.quantity), 0);
        const isReceive = t.transaction_type === "Receive";
        return (
          <div key={t.id} className="group relative bg-white border border-slate-200 rounded-sm overflow-hidden transition-all duration-300 hover:border-orange-400 hover:shadow-md hover:shadow-orange-500/10">
            <button type="button" onClick={() => onView(t)} className="w-full text-left flex flex-col cursor-pointer p-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                <span className="text-[10px] font-black text-slate-400 tabular-nums">#{t.id}</span>
                <TypeBadge type={t.transaction_type} />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-4xl font-black tabular-nums leading-none ${isReceive ? "text-green-600" : "text-red-500"}`}>
                    {isReceive ? "+" : "-"}{totalQty}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">qty</span>
                </div>
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase">
                      {t.items.length} {t.items.length === 1 ? "Product" : "Products"}
                    </span>
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="text-slate-300" />
                      <span className="text-[10px] font-bold text-slate-400 tabular-nums" suppressHydrationWarning>
                        {formatDateTime(t.transaction_date).split(" ")[0]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={10} className="text-slate-300" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{t.performed_by_username}</span>
                  </div>
                </div>
              </div>
            </button>
            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => onView(t)} className="p-2 bg-white/95 rounded-sm text-slate-600 hover:text-blue-500 shadow-sm transition-colors cursor-pointer" title="View"><Eye size={11} strokeWidth={2.5} /></button>
               {canEdit && <button onClick={() => onEdit(t)} className="p-2 bg-white/95 rounded-sm text-slate-600 hover:text-orange-500 shadow-sm transition-colors cursor-pointer" title="Edit"><Edit2 size={11} strokeWidth={2.5} /></button>}
               <button onClick={() => onPrint(t)} className="p-2 bg-white/95 rounded-sm text-slate-600 hover:text-green-500 shadow-sm transition-colors cursor-pointer" title="Print"><Printer size={11} strokeWidth={2.5} /></button>
               {canDelete && <button onClick={() => onDelete(t)} className="p-2 bg-white/95 rounded-sm text-slate-600 hover:text-red-500 shadow-sm transition-colors cursor-pointer" title="Delete"><Trash2 size={11} strokeWidth={2.5} /></button>}
            </div>
          </div>
          );
        })}
    </div>
  );

  // ── Desktop: List Table ──
  const desktopList = (
    <div className="hidden lg:block overflow-x-auto bg-white border border-slate-500 rounded-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/50 border-b border-slate-500">
          <tr>
            <Header label="#" field="id" ordering={ordering} handleSort={onSort} className="pl-6 w-16" />
            <Header label="Type" field="transaction_type" ordering={ordering} handleSort={onSort} className="w-32" />
            <Header label="Products" field="items_count" ordering={ordering} handleSort={onSort} className="w-32" />
            <Header label="Total Qty" field="total_qty" ordering={ordering} handleSort={onSort} className="w-32" />
            <Header label="Performed By" field="performed_by" ordering={ordering} handleSort={onSort} />
            <Header label="Date" field="transaction_date" ordering={ordering} handleSort={onSort} className="w-44" />
            <Header label="Actions" ordering={ordering} handleSort={onSort} className="pr-6 text-right w-36" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-400 bg-white">
          {displayed.map((t) => {
            const totalQty = t.items.reduce((sum, i) => sum + Math.abs(i.quantity), 0);
            const isReceive = t.transaction_type === "Receive";
            return (
              <tr key={t.id} className="group hover:bg-orange-50/60 transition-colors">
                <td className="pl-6 px-5 py-5">
                  <span className="text-[11px] font-black text-slate-500 tabular-nums group-hover:text-orange-600 transition-colors">#{t.id}</span>
                </td>
                <td className="px-5 py-5">
                  <TypeBadge type={t.transaction_type} />
                </td>
                <td className="px-5 py-5">
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full uppercase tabular-nums">
                       {t.items.length} {t.items.length === 1 ? "Item" : "Items"}
                     </span>
                   </div>
                </td>
                <td className="px-5 py-5">
                  <span className={`text-[15px] font-black tabular-nums transition-colors ${isReceive ? 'text-green-600' : 'text-red-500'}`}>
                    {isReceive ? "+" : "-"}{totalQty.toLocaleString()}
                  </span>
                </td>
                <td className="px-5 py-5">
                   <div className="flex items-center gap-2">
                     <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                        <User size={12} className="text-slate-400" strokeWidth={3} />
                     </div>
                     <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">{t.performed_by_username}</span>
                   </div>
                </td>
                <td className="px-5 py-5 whitespace-nowrap" suppressHydrationWarning>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-black text-slate-700 tabular-nums uppercase">{formatDateTime(t.transaction_date).split(' ')[0]}</span>
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums uppercase">{formatDateTime(t.transaction_date).split(' ')[1]}</span>
                  </div>
                </td>
                <td className="pr-6 px-5 py-5 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onView(t)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all cursor-pointer" title="View Details">
                      <Eye size={16} strokeWidth={2.5} />
                    </button>
                    {canEdit && (
                      <button onClick={() => onEdit(t)} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-all cursor-pointer" title="Edit">
                        <Edit2 size={16} strokeWidth={2.5} />
                      </button>
                    )}
                    <button onClick={() => onPrint(t)} className="p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded transition-all cursor-pointer" title="Print PDF">
                      <Printer size={16} strokeWidth={2.5} />
                    </button>
                    {canDelete && (
                      <button onClick={() => onDelete(t)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer" title="Delete">
                        <Trash2 size={16} strokeWidth={2.5} />
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

  // ── Desktop: Grid cards ──
  const desktopGrid = (
    <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {displayed.map((t) => {
        const totalQty = t.items.reduce((sum, i) => sum + Math.abs(i.quantity), 0);
        const isReceive = t.transaction_type === "Receive";
        return (
          <div key={t.id} className="group relative bg-white border border-slate-200 rounded-sm overflow-hidden transition-all duration-300 hover:border-orange-400 hover:shadow-md hover:shadow-orange-500/10 hover:-translate-y-0.5 flex flex-col">
            <button type="button" onClick={() => onView(t)} className="w-full text-left flex flex-col cursor-pointer flex-1 p-5">
              <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                <span className="text-[10px] font-black text-slate-400 tabular-nums">#{t.id}</span>
                <TypeBadge type={t.transaction_type} />
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-black tabular-nums tracking-tighter leading-none ${isReceive ? "text-green-600" : "text-red-500"}`}>
                    {isReceive ? "+" : "-"}{totalQty}
                  </span>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">quantity</span>
                </div>
                <div className="space-y-3 pt-4 border-t border-slate-50">
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-full uppercase tabular-nums">
                       {t.items.length} {t.items.length === 1 ? "Item" : "Items"}
                     </span>
                     <div className="flex items-center gap-1.5">
                       <Clock size={12} className="text-slate-300" />
                       <span className="text-[11px] font-bold text-slate-400 tabular-nums" suppressHydrationWarning>
                         {formatDateTime(t.transaction_date).split(" ")[0]}
                       </span>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                         <User size={10} className="text-slate-400" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{t.performed_by_username}</span>
                   </div>
                </div>
              </div>
            </button>
            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => onView(t)} className="p-2 bg-white/95 rounded-sm text-slate-600 hover:text-blue-500 shadow-sm transition-colors cursor-pointer" title="View"><Eye size={13} strokeWidth={2.5} /></button>
               {canEdit && <button onClick={() => onEdit(t)} className="p-2 bg-white/95 rounded-sm text-slate-600 hover:text-orange-500 shadow-sm transition-colors cursor-pointer" title="Edit"><Edit2 size={13} strokeWidth={2.5} /></button>}
               <button onClick={() => onPrint(t)} className="p-2 bg-white/95 rounded-sm text-slate-600 hover:text-green-500 shadow-sm transition-colors cursor-pointer" title="Print"><Printer size={13} strokeWidth={2.5} /></button>
               {canDelete && <button onClick={() => onDelete(t)} className="p-2 bg-white/95 rounded-sm text-slate-600 hover:text-red-500 shadow-sm transition-colors cursor-pointer" title="Delete"><Trash2 size={13} strokeWidth={2.5} /></button>}
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
}

export default TransactionsTable;
