"use client";

import React from "react";
import type { InventoryRecord } from "@/src/types/inventory.types";
import {
  Edit2,
  Trash2,
  Database,
  ChevronRight,
  MapPin,
  Package,
} from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

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
  viewMode?: "list" | "grid";
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
        <p className="max-w-md text-center py-4 text-[11px] font-black text-red-500 bg-red-50/50 rounded-sm border border-red-100 uppercase tracking-widest leading-loose">
          {error}
        </p>
      </div>
    );
  }

  if (displayed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-300">
        <Database className="w-12 h-12 opacity-20" strokeWidth={1} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Records Found</p>
      </div>
    );
  }

  function getStockStatus(r: InventoryRecord) {
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

  const orderingFields: Record<string, string> = {
    '#': 'id',
    'Product': 'product_name',
    'Site': 'site',
    'Quantity': 'quantity_on_hand',
    'Status': 'reorder_status',
    'Updated': 'updated_at',
    'Order Date': 'updated_at',
  };

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {displayed.map((r) => (
          <div
            key={r.id}
            className="group relative bg-white border border-slate-200 rounded-md overflow-hidden hover:border-orange-300 hover:shadow-md transition-all duration-200"
          >
            {/* Image */}
            <div className="relative w-full aspect-square bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
              {r.product_details.product_picture ? (
                <img
                  src={`${BASE_URL}${r.product_details.product_picture}`}
                  alt={r.product_details.product_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package size={32} className="text-slate-200" strokeWidth={1} />
              )}
              {/* Status badge top-right */}
              <div className="absolute top-2 right-2">
                {getStockStatus(r)}
              </div>
              {/* Actions overlay */}
              {(canEdit || canDelete) && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {canEdit && (
                    <button
                      onClick={() => onEdit(r)}
                      className="p-2 rounded-sm bg-white text-slate-700 hover:text-orange-500 hover:bg-orange-50 transition-all active:scale-95"
                      title="Edit Record"
                    >
                      <Edit2 size={14} strokeWidth={2.5} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDelete(r)}
                      className="p-2 rounded-sm bg-white text-slate-700 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                      title="Delete Record"
                    >
                      <Trash2 size={14} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3 space-y-1.5">
              <div>
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-orange-600 transition-colors">
                  {r.product_details.product_name}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                  {r.product_details.category}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <MapPin size={9} className="text-slate-300 shrink-0" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                  {r.site} · {r.location}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Qty</span>
                <span className={`text-[14px] font-black tabular-nums leading-none ${r.reorder_status === "No" ? "text-orange-600" : "text-red-500"}`}>
                  {r.quantity_on_hand.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ── Mobile Compact Rows (Transactions Concept) ── */}
      <div className="sm:hidden">
        {/* Mobile Header */}
        <div className="px-3 py-1.5 flex items-center gap-2 border-b border-gray-100 bg-white sticky top-0 z-10">
           <div className="flex items-center gap-3 flex-1 min-w-0">
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">#</span>
             <span className="text-slate-200">·</span>
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Record</span>
           </div>
           <div className="shrink-0 flex items-center gap-4">
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Qty</span>
             <span className="text-slate-200">·</span>
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Updated</span>
             <span className="w-7" />
           </div>
        </div>

        <div className="space-y-0">
          {displayed.map((r) => (
            <div
              key={r.id}
              className="relative group bg-white border-b border-gray-100 overflow-hidden hover:bg-slate-50/10"
            >
              <div className="px-3 py-3 flex items-center gap-2">
                {/* Left: ID + Name wrapper as button for accessiblity */}
                <button 
                  onClick={() => onEdit(r)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left group/btn appearance-none cursor-pointer"
                  aria-label={`Edit ${r.product_details.product_name}`}
                >
                  <span className="text-slate-300 text-[10px] font-black tabular-nums shrink-0 group-hover/btn:text-orange-500 transition-colors">#{r.id}</span>
                  <div className="w-8 h-8 rounded-sm bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {r.product_details.product_picture ? (
                      <img
                        src={`${BASE_URL}${r.product_details.product_picture}`}
                        alt={r.product_details.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={14} className="text-slate-200" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight group-hover/btn:text-orange-600 transition-colors">
                      {r.product_details.product_name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                        {r.site} · {r.location}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Right: Qty + Time + Action */}
                <div className="shrink-0 flex items-center gap-2 relative z-10">
                  <span className={`text-[12px] font-black tabular-nums leading-none ${r.reorder_status !== 'No' ? 'text-red-500' : 'text-orange-600'}`}>
                    {r.quantity_on_hand.toLocaleString()}
                  </span>
                  <span className="text-slate-200 shrink-0">·</span>
                  <span className="text-[9px] font-bold text-slate-400 font-mono tracking-tighter shrink-0" suppressHydrationWarning>
                    {formatDateTime(r.updated_at).split(' ')[0].split('/').slice(0,2).join('/')} {formatDateTime(r.updated_at).split(' ')[1]}
                  </span>
                  <button className="p-1 text-slate-300">
                     <ChevronRight size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Desktop Clean Table (Transactions Concept) ── */}
      <div className="hidden sm:block overflow-x-auto bg-white border border-slate-200 rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {[
                { label: "#", class: "pl-6 w-16" },
                { label: "Pic", class: "w-16" },
                { label: "Product" },
                { label: "Barcode", class: "w-36" },
                { label: "Site", class: "w-40" },
                { label: "Quantity", class: "text-center w-32" },
                { label: "Reorder Lvl", class: "text-center w-32" },
                { label: "Status", class: "w-32" },
                { label: "Updated", class: "w-40" },
                { label: "Actions", class: "pr-6 text-right w-24" }
              ].map((h) => {
                const canSort = orderingFields[h.label];
                const isSorting = canSort && (ordering === canSort || ordering === '-' + canSort);
                const isAsc = isSorting && ordering === canSort;
                const isDesc = isSorting && ordering === '-' + canSort;

                return (
                  <th 
                    key={h.label} 
                    className={`px-5 py-3 text-[9px] font-black tracking-widest text-slate-400 uppercase ${h.class ?? ""} ${canSort ? "cursor-pointer select-none group/th" : ""}`}
                    onClick={() => canSort && onSort(h.label)}
                  >
                    <div className={`flex items-center gap-1.5 ${h.class?.includes('center') ? 'justify-center' : ''} ${h.class?.includes('right') ? 'justify-end' : ''}`}>
                      {h.label}
                    {canSort && (
                    <div className="flex flex-col -space-y-1 opacity-20 group-hover/th:opacity-100 transition-opacity ml-1">
                      <ChevronRight size={8} className={`-rotate-90 ${isAsc ? "text-orange-500 opacity-100" : ""}`} strokeWidth={4} />
                      <ChevronRight size={8} className={`rotate-90 ${isDesc ? "text-orange-500 opacity-100" : ""}`} strokeWidth={4} />
                    </div>
                  )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {displayed.map((r) => (
              <tr key={r.id} className="group hover:bg-slate-50/60 transition-colors">
                <td className="pl-6 px-5 py-4">
                  <span className="text-[11px] font-black text-slate-500 tabular-nums">#{r.id}</span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="w-10 h-10 rounded-sm bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                    {r.product_details.product_picture ? (
                      <img
                        src={`${BASE_URL}${r.product_details.product_picture}`}
                        alt={r.product_details.product_name}
                        className="w-full h-full object-cover"
                      />
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
                <td className="px-5 py-4">
                  <span className="text-[11px] font-mono font-bold text-slate-600 tracking-wider">
                    {r.product_details.barcode || "—"}
                  </span>
                </td>
                <td className="px-5 py-4">
                   <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-slate-300 shrink-0" />
                      <div className="flex flex-col min-w-0">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{r.site}</span>
                         <span className="text-[9px] font-bold text-slate-400 uppercase truncate">{r.location}</span>
                      </div>
                   </div>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className={`text-[13px] font-black tabular-nums transition-colors ${r.reorder_status !== 'No' ? 'text-red-500' : 'text-orange-600'}`}>
                    {r.quantity_on_hand.toLocaleString()}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="text-[13px] font-black tabular-nums text-slate-500">
                    {r.product_details.reorder_level.toLocaleString()}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {getStockStatus(r)}
                </td>
                <td className="px-5 py-4" suppressHydrationWarning>
                   <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-black text-slate-700 tabular-nums">{formatDateTime(r.updated_at).split(' ')[0]}</span>
                      <span className="text-[10px] font-bold text-slate-400 tabular-nums">{formatDateTime(r.updated_at).split(' ')[1]}</span>
                   </div>
                </td>
                <td className="pr-6 px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-0.5 opacity-20 group-hover:opacity-100 transition-opacity">
                    {canEdit && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(r); }}
                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-all cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit2 size={16} strokeWidth={2.5} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(r); }}
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
    </div>
  );
}
