"use client";

import React from "react";
import type { Product } from "@/src/types/product.types";

import {
  Edit2,
  Trash2,
  Database,
  ChevronRight
} from "lucide-react";

export type SortDir = "asc" | "desc" | "";

interface ProductsTableProps {
  loading: boolean;
  error: string;
  displayed: Product[];
  products: Product[];
  costDir: SortDir;
  reorderDir: SortDir;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function ProductsTable({
  loading,
  error,
  displayed,
  products,
  costDir,
  reorderDir,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: Readonly<ProductsTableProps>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#FA4900", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (error) {
    return <p className="text-center py-20 text-sm text-red-500 font-bold bg-red-50/50 rounded-md border border-red-100 mx-4 uppercase tracking-widest">{error}</p>;
  }

  if (displayed.length === 0) {
    const msg = products.length === 0 ? "Catalog is Empty" : "No Match Found";
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <Database className="w-10 h-10 opacity-30" strokeWidth={1.5} />
        <p className="text-sm font-black uppercase tracking-widest">{msg}</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile: High Density Cards ── */}
      <div className="sm:hidden space-y-2 px-1 py-1">
        {displayed.map((p) => (
          <div
            key={p.id}
            className="relative group bg-white border border-gray-200 rounded-sm overflow-hidden hover:shadow-md hover:border-orange-500/30 transition-all duration-300"
          >
            <div className="flex flex-col divide-y divide-gray-100">
              {/* Row 1: ID, Category and Reorder */}
              <div className="p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-300 text-slate-900 rounded-sm text-[11px] font-bold px-1 py-0.5">
                    #{p.id}
                  </span>
                  <span className="bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-sm border border-orange-100/50">
                    {p.category}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-xl font-black text-orange-600 tabular-nums leading-none">
                      {p.reorder_level}
                    </span>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Reorder</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Product Name, Barcode and Tools */}
              <div className="px-2 py-1.5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[11px] font-black text-slate-950 truncate uppercase leading-tight group-hover:text-orange-600 transition-colors">
                    {p.product_name}
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">BC: {p.barcode}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 relative z-10">
                  {canEdit && (
                    <button
                      onClick={() => onEdit(p)}
                      className="p-1.5 text-slate-300 hover:text-slate-950 hover:bg-slate-100 rounded-md transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDelete(p)}
                      className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tap Action: Edit (if permitted) */}
            {canEdit && (
              <button
                onClick={() => onEdit(p)}
                className="absolute inset-0 w-full h-full cursor-pointer z-0 opacity-0"
                aria-label={`Edit ${p.product_name}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Desktop: Modular List View ── */}
      <div className="hidden sm:block overflow-x-auto bg-white border border-gray-100 rounded-sm shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/50 border-b border-gray-100 text-left">
            <tr>
              {[
                { label: "Identifier", class: "pl-6" },
                { label: "Barcode" },
                { label: "Product Name" },
                { label: "Category" },
                { label: "Reorder", class: "text-center" },
                { label: "Supplier" },
                { label: "Actions", class: "pr-6 text-right" }
              ].map((h) => (
                <th key={h.label} className={`px-4 py-4 text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase ${h.class ?? ""}`}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {displayed.map((p) => (
              <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="pl-6 px-4 py-4">
                  <span className="text-[11px] font-black text-black tabular-nums group-hover:text-orange-600 transition-colors">ID-{p.id}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-tighter tabular-nums">{p.barcode}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                    {p.product_name}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex text-[9px] font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100 uppercase tracking-widest">
                    {p.category}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-sm font-black text-slate-950 tabular-nums">
                    {p.reorder_level}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.supplier}</span>
                </td>
                <td className="pr-6 px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {canEdit && (
                      <button
                        onClick={() => onEdit(p)}
                        className="p-1.5 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded-md transition-all"
                        title="Edit Product"
                      >
                        <Edit2 size={16} strokeWidth={2.5} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onDelete(p)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                        title="Delete Product"
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    )}
                    <button className="p-1.5 text-gray-300 hover:text-slate-900 rounded-md transition-all">
                      <ChevronRight size={16} strokeWidth={3} />
                    </button>
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
