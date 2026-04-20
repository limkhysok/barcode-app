"use client";

import React from "react";
import type { InventoryRecord } from "@/src/types/inventory.types";
import { 
  Edit2, 
  Trash2, 
  Database, 
  MapPin, 
  Package, 
  ArrowUp, 
  ArrowDown,
  Eye
} from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export type SortDir = "asc" | "desc" | "";

interface InventoryTableProps {
  loading: boolean;
  error: string;
  displayed: InventoryRecord[];
  onEdit: (r: InventoryRecord) => void;
  onDelete: (r: InventoryRecord) => void;
  onView: (r: InventoryRecord) => void;
  canEdit: boolean;
  canDelete: boolean;
  ordering?: string;
  onSort: (col: string) => void;
  viewMode?: "list" | "grid";
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
  handleSort: (f: string) => void;
}) => {
  const isSortable = !!field;
  const isActive = field && (ordering === field || ordering === `-${field}`);
  return (
    <th
      onClick={() => isSortable && field && handleSort(label)}
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

function StockBadge({ r }: Readonly<{ r: InventoryRecord }>) {
  if (r.quantity_on_hand === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">
        <span className="w-1 h-1 rounded-full bg-red-500" /> NO STOCK
      </span>
    );
  }
  if (r.reorder_status === "LOW") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-100">
        <span className="w-1 h-1 rounded-full bg-yellow-400" /> LOW
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
      <span className="w-1 h-1 rounded-full bg-green-500" /> GOOD
    </span>
  );
}

export function InventoryTable({
  loading,
  error,
  displayed,
  onEdit,
  onDelete,
  onView,
  canEdit,
  canDelete,
  ordering = "",
  onSort,
  viewMode = "list",
}: Readonly<InventoryTableProps>) {


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
        <Database className="w-10 h-10 opacity-20" strokeWidth={1} />
        <p className="text-[9px] font-black uppercase tracking-[0.25em]">No Records Found</p>
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
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Product</span>
        </div>
        <div className="shrink-0 flex items-center gap-4">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Qty</span>
          <span className="w-7" />
        </div>
      </div>
      <div className="divide-y divide-slate-100 bg-white">
        {displayed.map((r) => {
          const isOut = r.quantity_on_hand === 0;
          const isLow = r.reorder_status === "LOW" && !isOut;
          let qtyClass = "text-orange-600 bg-orange-50";
          if (isOut) qtyClass = "text-red-500 bg-red-50";
          else if (isLow) qtyClass = "text-yellow-600 bg-yellow-50";

          return (
            <div key={r.id} className="group bg-white hover:bg-slate-50 transition-all duration-300">
              <div className="px-3 py-3.5 flex items-center gap-3">
                <button
                  onClick={() => onView(r)}
                  className="flex flex-col flex-1 min-w-0 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] font-black text-slate-300 tabular-nums">#{r.id}</span>
                    <span className="text-slate-200">·</span>
                    <span className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                      {r.product_details.product_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={9} className="text-slate-300 shrink-0" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[150px]">
                      {r.site} · {r.location}
                    </span>
                  </div>
                </button>
                <div className="shrink-0 flex items-center gap-4">
                  <span className={`text-[12px] font-black tabular-nums leading-none w-8 h-8 flex items-center justify-center rounded-sm ${qtyClass}`}>
                    {r.quantity_on_hand}
                  </span>
                  <div className="flex items-center">
                    <button onClick={() => onView(r)} className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors cursor-pointer" title="View">
                      <Eye size={14} />
                    </button>
                    {canEdit && (
                      <button onClick={() => onEdit(r)} className="p-1.5 text-slate-300 hover:text-orange-500 transition-colors cursor-pointer">
                        <Edit2 size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => onDelete(r)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    )}
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
    <div className="hidden sm:grid lg:hidden grid-cols-2 gap-2 p-1">
      {displayed.map((r) => (
        <div key={r.id} className="group relative bg-white border border-slate-200 rounded-sm overflow-hidden transition-all duration-300 hover:border-orange-400 hover:shadow-md hover:shadow-orange-500/10">
          <button type="button" onClick={() => onView(r)} className="w-full text-left flex flex-col cursor-pointer">
            <div className="h-20 w-full bg-slate-50 flex items-center justify-center overflow-hidden group-hover:bg-orange-50 transition-colors relative">
              {r.product_details.product_picture ? (
                <img src={`${BASE_URL}${r.product_details.product_picture}`} alt={r.product_details.product_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <Package size={20} strokeWidth={1} className="opacity-20" />
              )}
              <div className="absolute top-1 left-1 flex items-center gap-1.5">
                <span className="text-[8px] font-black text-slate-500 tabular-nums bg-white/80 px-1 py-0.5 rounded-sm">#{r.id}</span>
                <StockBadge r={r} />
              </div>
            </div>
            <div className="px-2.5 py-2 flex flex-col gap-1.5">
              <span className="text-[11px] font-black text-slate-900 leading-tight truncate group-hover:text-orange-600 transition-colors uppercase">{r.product_details.product_name}</span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 min-w-0">
                  <MapPin size={9} className="text-slate-300 shrink-0" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase truncate tracking-tighter">{r.site} · {r.location}</span>
                </div>
                <span className={`text-[12px] font-black tabular-nums transition-colors ${r.reorder_status === "No" ? "text-orange-600" : "text-red-500"}`}>
                  {r.quantity_on_hand}
                </span>
              </div>
            </div>
          </button>
          <div className="absolute top-0 inset-x-0 h-20 bg-black/30 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity flex items-center justify-center gap-1">
            <button onClick={() => onView(r)} className="pointer-events-auto p-1.5 bg-white/90 rounded-sm text-slate-600 hover:text-blue-500 transition-colors cursor-pointer" title="View"><Eye size={11} strokeWidth={2.5} /></button>
            {canEdit && <button onClick={() => onEdit(r)} className="pointer-events-auto p-1.5 bg-white/90 rounded-sm text-slate-600 hover:text-orange-500 transition-colors cursor-pointer" title="Edit"><Edit2 size={11} strokeWidth={2.5} /></button>}
            {canDelete && <button onClick={() => onDelete(r)} className="pointer-events-auto p-1.5 bg-white/90 rounded-sm text-slate-600 hover:text-red-500 transition-colors cursor-pointer" title="Delete"><Trash2 size={11} strokeWidth={2.5} /></button>}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Desktop: List Table ──
  const desktopList = (
    <div className="hidden lg:block overflow-x-auto bg-white border border-slate-200 rounded-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <Header label="#" field="id" ordering={ordering} handleSort={onSort} className="pl-6 w-16" />
            <Header label="Pic" ordering={ordering} handleSort={onSort} className="w-16" />
            <Header label="Product" field="product_name" ordering={ordering} handleSort={onSort} />
            <Header label="Barcode" field="barcode" ordering={ordering} handleSort={onSort} className="w-36" />
            <Header label="Site" field="site" ordering={ordering} handleSort={onSort} className="w-44" />
            <Header label="Quantity" field="quantity_on_hand" ordering={ordering} handleSort={onSort} className="text-center w-32" />
            <Header label="Status" field="reorder_status" ordering={ordering} handleSort={onSort} className="w-32" />
            <Header label="Updated" field="updated_at" ordering={ordering} handleSort={onSort} className="w-40" />
            <Header label="Actions" ordering={ordering} handleSort={onSort} className="pr-6 text-right w-24" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {displayed.map((r) => (
            <tr key={r.id} className="group hover:bg-orange-50/60 transition-colors">
              <td className="pl-6 px-5 py-4">
                <span className="text-[11px] font-black text-slate-500 tabular-nums group-hover:text-orange-600 transition-colors">#{r.id}</span>
              </td>
              <td className="px-5 py-4 whitespace-nowrap">
                <div className="w-10 h-10 rounded-sm bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                  {r.product_details.product_picture ? (
                    <img src={`${BASE_URL}${r.product_details.product_picture}`} alt={r.product_details.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={16} className="text-slate-200" />
                  )}
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-col">
                  <span className="text-[13px] font-black text-slate-900 uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                    {r.product_details.product_name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{r.product_details.category}</span>
                </div>
              </td>
              <td className="px-5 py-4 text-[11px] font-mono font-bold text-slate-300 tracking-tighter tabular-nums group-hover:text-orange-400 transition-colors whitespace-nowrap">
                {r.product_details.barcode || "—"}
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin size={12} className="text-slate-300 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{r.site}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase truncate">{r.location}</span>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-center">
                <span className={`text-[13px] font-black tabular-nums transition-colors ${r.reorder_status === 'No' ? 'text-orange-600' : 'text-red-500'}`}>
                  {r.quantity_on_hand.toLocaleString()}
                </span>
              </td>
              <td className="px-5 py-4">
                <StockBadge r={r} />
              </td>
              <td className="px-5 py-4 whitespace-nowrap" suppressHydrationWarning>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-black text-slate-700 tabular-nums uppercase">{formatDateTime(r.updated_at).split(' ')[0]}</span>
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums uppercase">{formatDateTime(r.updated_at).split(' ')[1]}</span>
                </div>
              </td>
              <td className="pr-6 px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onView(r)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all cursor-pointer" title="View">
                    <Eye size={16} strokeWidth={2.5} />
                  </button>
                  {canEdit && (
                    <button onClick={() => onEdit(r)} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-all cursor-pointer" title="Edit">
                      <Edit2 size={16} strokeWidth={2.5} />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => onDelete(r)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer" title="Delete">
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ── Desktop: Grid cards ──
  const desktopGrid = (
    <div className="hidden lg:grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
      {displayed.map((r) => (
        <div key={r.id} className="group relative bg-white border border-slate-200 rounded-sm overflow-hidden transition-all duration-300 hover:border-orange-400 hover:shadow-md hover:shadow-orange-500/10 hover:-translate-y-0.5 flex flex-col">
          <button type="button" onClick={() => onView(r)} className="w-full text-left flex flex-col cursor-pointer flex-1">
            <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100 group-hover:bg-orange-50 transition-colors">
              {r.product_details.product_picture ? (
                <img src={`${BASE_URL}${r.product_details.product_picture}`} alt={r.product_details.product_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <Package size={24} strokeWidth={1} className="opacity-20" />
              )}
              <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-slate-500 tabular-nums bg-white/90 px-1.5 py-0.5 rounded-sm border border-slate-200 self-start">#{r.id}</span>
                <StockBadge r={r} />
              </div>
            </div>
            <div className="p-3 flex flex-col gap-2">
              <div>
                <p className="text-[11px] font-black text-slate-900 leading-tight truncate group-hover:text-orange-600 transition-colors uppercase tracking-tight">{r.product_details.product_name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">{r.product_details.category}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 min-w-0">
                  <MapPin size={9} className="text-slate-300 shrink-0" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase truncate tracking-tighter">{r.site} · {r.location}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-50">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Quantity</span>
                  <span className={`text-[14px] font-black tabular-nums transition-colors ${r.reorder_status === "No" ? "text-orange-600" : "text-red-500"}`}>
                    {r.quantity_on_hand}
                  </span>
                </div>
              </div>
            </div>
          </button>
          <div className="absolute top-0 inset-x-0 aspect-square bg-black/30 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity flex items-center justify-center gap-1.5">
            <button onClick={() => onView(r)} className="pointer-events-auto p-2 bg-white/95 rounded-sm text-slate-600 hover:text-blue-500 transition-colors cursor-pointer shadow-sm active:scale-90" title="View"><Eye size={13} strokeWidth={2.5} /></button>
            {canEdit && <button onClick={() => onEdit(r)} className="pointer-events-auto p-2 bg-white/95 rounded-sm text-slate-600 hover:text-orange-500 transition-colors cursor-pointer shadow-sm active:scale-90" title="Edit"><Edit2 size={13} strokeWidth={2.5} /></button>}
            {canDelete && <button onClick={() => onDelete(r)} className="pointer-events-auto p-2 bg-white/95 rounded-sm text-slate-600 hover:text-red-500 transition-colors cursor-pointer shadow-sm active:scale-90" title="Delete"><Trash2 size={13} strokeWidth={2.5} /></button>}
          </div>
        </div>
      ))}
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
