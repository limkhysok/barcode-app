"use client";

import React from "react";
import type { InventoryRecord } from "@/src/types/inventory.types";
import { 
  Edit2, 
  Trash2, 
  Database,
  ChevronRight,
  MapPin
} from "lucide-react";

interface InventoryTableProps {
  loading: boolean;
  error: string;
  displayed: InventoryRecord[];
  onEdit: (r: InventoryRecord) => void;
  onDelete: (r: InventoryRecord) => void;
  canEdit: boolean;
  canDelete: boolean;
  ordering?: string;
  onSort: (col: string) => void;
}

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

export function InventoryTable({
  loading,
  error,
  displayed,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  ordering,
  onSort,
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
    return <p className="text-center py-20 text-sm text-red-500 font-black bg-red-50/50 rounded-md border border-red-100 mx-4 uppercase tracking-widest">{error}</p>;
  }

  if (displayed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <Database className="w-10 h-10 opacity-30" strokeWidth={1.5} />
        <p className="text-sm font-black uppercase tracking-widest">No Records Found</p>
      </div>
    );
  }

  const orderingFields: Record<string, string> = {
    '#': 'id',
    'Product': 'product_name',
    'Site': 'site',
    'Location': 'location',
    'Quantity': 'quantity_on_hand',
    'Order Date': 'updated_at',
  };

  return (
    <>
      {/* Mobile Cards */}
      <div className="sm:hidden space-y-2 px-1 py-1">
        {displayed.map((r) => (
          <div
            key={r.id}
            className="relative group bg-white border border-gray-200 rounded-sm overflow-hidden hover:shadow-md hover:border-orange-500/30 transition-all duration-300"
          >
            <div className="flex flex-col divide-y divide-gray-100">
              {/* Row 1: ID, Category and Qty */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 text-[10px] font-black tabular-nums">
                    #{r.id}
                  </span>
                  <span className="text-slate-300 text-xs">·</span>
                  <span className="bg-slate-100 text-slate-900 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                    {r.product_details.category}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-baseline justify-end gap-1.5">
                    <span className="text-[17px] font-black text-orange-600 tabular-nums leading-none">
                      {r.quantity_on_hand.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">quantity</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Name and Status */}
              <div className="px-3 py-3 flex items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[11px] font-black text-slate-950 truncate uppercase tracking-tight leading-tight group-hover:text-orange-600 transition-colors">
                    {r.product_details.product_name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin size={10} className="text-slate-300" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">{r.site} • {r.location}</p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 relative z-10">
                  {canEdit && (
                    <button
                      onClick={() => onEdit(r)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded transition-all cursor-pointer"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDelete(r)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {canEdit && (
              <button
                onClick={() => onEdit(r)}
                className="absolute inset-0 w-full h-full cursor-pointer z-0 opacity-0"
              />
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto bg-white border border-gray-100 rounded-sm shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/50 border-b border-gray-100 text-left">
            <tr>
              {[
                { label: "#", class: "pl-6" },
                { label: "Product" },
                { label: "Site" },
                { label: "Location" },
                { label: "Quantity", class: "text-center" },
                { label: "Reorder" },
                { label: "Order Date" },
                { label: "Actions", class: "pr-6 text-right" }
              ].map((h) => {
                const canSort = orderingFields[h.label];
                const isSorting = canSort && (ordering === canSort || ordering === '-' + canSort);
                const isAsc = isSorting && ordering === canSort;
                const isDesc = isSorting && ordering === '-' + canSort;

                let justifyClass = "";
                if (h.class?.includes('center')) justifyClass = "justify-center";
                else if (h.class?.includes('right')) justifyClass = "justify-end";

                return (
                  <th 
                    key={h.label} 
                    className={`px-4 py-4 text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase ${h.class ?? ""} ${canSort ? "cursor-pointer select-none" : ""}`}
                    onClick={() => canSort && onSort(h.label)}
                  >
                    <div className={`flex items-center gap-1.5 ${justifyClass}`}>
                      {h.label}
                      {canSort && (
                        <div className="flex flex-col -space-y-1">
                           <ChevronRight size={10} className={`-rotate-90 ${isAsc ? "text-orange-500" : "text-gray-200"}`} strokeWidth={4} />
                           <ChevronRight size={10} className={`rotate-90 ${isDesc ? "text-orange-500" : "text-gray-200"}`} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {displayed.map((r) => (
              <tr key={r.id} className="group hover:bg-slate-50/60 transition-colors">
                <td className="pl-6 px-4 py-4">
                  <span className="text-[11px] font-black text-slate-500 tabular-nums">#{r.id}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-[13px] font-black text-slate-900 uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                    {r.product_details.product_name}
                  </span>
                </td>
                <td className="px-4 py-4">
                   <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-gray-300 shrink-0" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{r.site}</span>
                   </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{r.location}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-sm font-black text-slate-950 tabular-nums">
                    {r.quantity_on_hand.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {r.reorder_status === "Yes" ? (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">
                      <span className="w-1 h-1 rounded-full bg-red-500" /> LOW STOCK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-100">
                      <span className="w-1 h-1 rounded-full bg-slate-300" /> OPTIMAL
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter leading-tight">{formatDateTime(r.updated_at).split(' ')[0]}</span>
                      <span className="text-[9px] font-bold text-gray-300 tabular-nums">{formatDateTime(r.updated_at).split(' ')[1]}</span>
                   </div>
                </td>
                <td className="pr-6 px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-0.5 opacity-20 group-hover:opacity-100 transition-opacity">
                    {canEdit && (
                      <button
                        onClick={() => onEdit(r)}
                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-all cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit2 size={16} strokeWidth={2.5} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onDelete(r)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer"
                        title="Delete Record"
                      >
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
    </>
  );
}
