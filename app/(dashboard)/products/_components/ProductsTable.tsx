"use client";

import React from "react";
import type { Product } from "@/src/types/product.types";
import { Edit2, Trash2, Database } from "lucide-react";

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
  viewMode?: "list" | "grid";
}

export function ProductsTable({
  loading,
  error,
  displayed,
  products,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  viewMode = "list",
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
    return <p className="text-center py-20 text-sm text-red-400">{error}</p>;
  }

  if (displayed.length === 0) {
    const msg = products.length === 0 ? "Product is Empty" : "No Match Found";
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <Database className="w-10 h-10 opacity-30" strokeWidth={1.5} />
        <p className="text-sm font-medium">{msg}</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile: Compact List ── */}
      <div className="sm:hidden">
        <div className="px-3 py-1.5 flex items-center gap-2 border-b border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">#</span>
            <span className="text-slate-200">·</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Category</span>
            <span className="text-slate-200">·</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Name</span>
          </div>
          <div className="shrink-0 flex items-center gap-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Reorder</span>
            <span className="w-7" />
          </div>
        </div>

        <div className="space-y-0">
          {displayed.map((p) => (
            <div
              key={p.id}
              className="relative group bg-white border-b border-gray-200 overflow-hidden hover:shadow-md hover:border-orange-500/30 transition-all duration-300"
            >
              <div className="px-3 py-2 flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-slate-300 text-[10px] font-bold shrink-0">{p.id}</span>
                  <span className="text-slate-300 shrink-0">·</span>
                  <span className="shrink-0 text-[10px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-100/50">
                    {p.category}
                  </span>
                  <span className="text-slate-300 shrink-0">·</span>
                  <span className="text-[10px] font-black text-slate-900 truncate">{p.product_name}</span>
                </div>
                <div className="shrink-0 flex items-center gap-2 relative z-10">
                  <span className="text-[12px] font-black text-orange-600 tabular-nums leading-none">
                    {p.reorder_level}
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(p)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(p)}
                  className="absolute inset-0 w-full h-full cursor-pointer z-0 opacity-0"
                  aria-label={`Edit ${p.product_name}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Desktop: Grid View ── */}
      {viewMode === "grid" && (
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-2">
          {displayed.map((p) => (
            <div key={p.id} className="group bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col transition-all duration-300 hover:border-orange-500/30 hover:shadow-md">
              {/* Top bar: ID · barcode */}
              <div className="px-4 pt-3 pb-2.5 flex items-center justify-between border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-500 tabular-nums">#{p.id}</span>
                <span className="text-[10px] font-bold text-slate-400 tracking-tighter font-mono uppercase">{p.barcode}</span>
              </div>

              {/* Body */}
              <div className="px-4 py-4 flex-1 flex flex-col gap-3">
                {/* Category + supplier */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-widest">
                    {p.category}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.supplier}</span>
                </div>

                {/* Product name */}
                <span className="text-sm font-black text-slate-900 uppercase leading-tight group-hover:text-orange-600 transition-colors">
                  {p.product_name}
                </span>

                {/* Reorder level (big number like qty in transactions) */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-orange-600 tabular-nums leading-none">{p.reorder_level}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">reorder</span>
                </div>
              </div>

              {/* Actions footer */}
              <div className="px-3 pb-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="flex-1 flex items-center justify-center py-2 rounded-sm bg-slate-50 border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-all cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 size={15} strokeWidth={2.5} />
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(p)}
                    className="flex-1 flex items-center justify-center py-2 rounded-sm bg-slate-50 border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={15} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Desktop: List View ── */}
      {viewMode === "list" && (
        <div className="hidden sm:block overflow-x-auto bg-white border border-slate-200 rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["#", "Barcode", "Product Name", "Category", "Reorder", "Supplier", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[9px] font-black tracking-widest text-slate-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {displayed.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-[11px] font-black text-slate-500 tabular-nums">#{p.id}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-tighter tabular-nums">{p.barcode}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                      {p.product_name}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex text-[9px] font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100 uppercase tracking-widest">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-black text-slate-950 tabular-nums">{p.reorder_level}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.supplier}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-0.5">
                      {canEdit && (
                        <button
                          onClick={() => onEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-all cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => onDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer"
                          title="Delete Product"
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
      )}
    </>
  );
}
