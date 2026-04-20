"use client";

import React from "react";
import type { Product } from "@/src/types/product.types";
import { Edit2, Trash2, Eye, Database, ArrowUp, ArrowDown, Package } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export type SortDir = "asc" | "desc" | "";

interface ProductsTableProps {
  loading: boolean;
  error: string;
  displayed: Product[];
  products: Product[];
  sortField: string;
  setSortField: (v: string) => void;
  sortDir: SortDir;
  setSortDir: (v: SortDir) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onView: (p: Product) => void;
  canEdit: boolean;
  canDelete: boolean;
  viewMode?: "list" | "grid";
}

const SortIcon = ({ field, sortField, sortDir }: { field: string; sortField: string; sortDir: SortDir }) => {
  if (sortField !== field || !sortDir) return null;
  return sortDir === "asc" ? (
    <ArrowUp size={10} className="ml-1.5 text-orange-500" strokeWidth={3} />
  ) : (
    <ArrowDown size={10} className="ml-1.5 text-orange-500" strokeWidth={3} />
  );
};

const Header = ({
  label,
  field,
  className,
  sortField,
  sortDir,
  handleSort,
}: {
  label: string;
  field?: string;
  className?: string;
  sortField: string;
  sortDir: SortDir;
  handleSort: (f: string) => void;
}) => {
  const isSortable = !!field;
  const isActive = sortField === field && sortDir !== "";
  return (
    <th
      onClick={() => isSortable && field && handleSort(field)}
      className={`px-5 py-4 text-left text-[9px] font-black tracking-widest uppercase transition-all duration-200 select-none ${
        isSortable ? "cursor-pointer hover:bg-slate-100/50" : ""
      } ${isActive ? "text-orange-600 bg-orange-50/30" : "text-slate-400"} ${className || ""}`}
    >
      <div className="flex items-center">
        {label}
        {isSortable && field && <SortIcon field={field} sortField={sortField} sortDir={sortDir} />}
      </div>
    </th>
  );
};

export function ProductsTable({
  loading,
  error,
  displayed,
  products,
  sortField,
  setSortField,
  sortDir,
  setSortDir,
  onEdit,
  onDelete,
  onView,
  canEdit,
  canDelete,
  viewMode = "list",
}: Readonly<ProductsTableProps>) {

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") setSortDir("");
      else setSortDir("asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

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
        <p className="text-sm font-medium uppercase tracking-widest text-[10px]">{msg}</p>
      </div>
    );
  }

  // ── Mobile: compact rows ──
  const mobileRows = (
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

      <div className="divide-y divide-gray-100">
        {displayed.map((p) => (
          <div
            key={p.id}
            className="relative group bg-white overflow-hidden hover:bg-slate-50 transition-all duration-300"
          >
            <div className="px-3 py-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-slate-300 text-[10px] font-bold shrink-0">{p.id}</span>
                <span className="text-slate-300 shrink-0">·</span>
                <span className="shrink-0 text-[9px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-100/50 uppercase tracking-tighter">
                  {p.category}
                </span>
                <span className="text-slate-300 shrink-0">·</span>
                <span className="text-[10px] font-black text-slate-900 truncate uppercase">{p.product_name}</span>
              </div>
              <div className="shrink-0 flex items-center gap-2 relative z-10">
                <span className="text-[12px] font-black text-orange-600 tabular-nums leading-none bg-orange-50 w-7 h-7 flex items-center justify-center rounded-sm">
                  {p.reorder_level}
                </span>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => onView(p)}
                    className="p-1.5 text-slate-400 hover:text-blue-500 transition-all cursor-pointer"
                    title="View"
                  >
                    <Eye size={14} />
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="p-1.5 text-slate-400 hover:text-orange-500 transition-all cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(p)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Tablet: 4-col cards ──
  const tabletGrid = (
    <div className="hidden sm:grid lg:hidden grid-cols-4 gap-2">
      {displayed.map((p) => (
        <div key={p.id} className="group relative bg-white border border-slate-200 rounded-sm overflow-hidden transition-all duration-300 hover:border-orange-400 hover:shadow-md hover:shadow-orange-500/10 hover:-translate-y-0.5">
          {/* Card button — click anywhere to view */}
          <button type="button" onClick={() => onView(p)} className="w-full text-left flex flex-col cursor-pointer">
            <div className="h-20 w-full bg-slate-50 flex items-center justify-center overflow-hidden group-hover:bg-orange-50 transition-colors relative">
              {p.product_picture ? (
                <img src={`${BASE_URL}${p.product_picture}`} alt={p.product_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <Package size={20} strokeWidth={1} className="opacity-20" />
              )}
              <span className="absolute top-1 left-1 text-[8px] font-black text-slate-500 tabular-nums bg-white/80 px-1 py-0.5 rounded-sm">#{p.id}</span>
            </div>
            <div className="px-2 py-1.5 flex flex-col gap-1">
              <span className="text-[8px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-100 uppercase tracking-widest self-start truncate max-w-full">{p.category}</span>
              <span className="text-[11px] font-black text-slate-900 leading-tight truncate group-hover:text-orange-600 transition-colors">{p.product_name}</span>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-[9px] text-slate-400 truncate">{p.supplier}</span>
                <span className="text-[10px] font-black text-orange-600 tabular-nums shrink-0 ml-1">{p.reorder_level}</span>
              </div>
            </div>
          </button>
          {/* Action overlay — sibling to button, pointer-events-none so bg passes clicks to card */}
          <div className="absolute top-0 inset-x-0 h-20 bg-black/30 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity flex items-center justify-center gap-1">
            <button type="button" onClick={() => onView(p)} className="pointer-events-auto p-1.5 bg-white/90 rounded-sm text-slate-600 hover:text-blue-500 transition-colors cursor-pointer" title="View"><Eye size={11} strokeWidth={2.5} /></button>
            {canEdit && <button type="button" onClick={() => onEdit(p)} className="pointer-events-auto p-1.5 bg-white/90 rounded-sm text-slate-600 hover:text-orange-500 transition-colors cursor-pointer" title="Edit"><Edit2 size={11} strokeWidth={2.5} /></button>}
            {canDelete && <button type="button" onClick={() => onDelete(p)} className="pointer-events-auto p-1.5 bg-white/90 rounded-sm text-slate-600 hover:text-red-500 transition-colors cursor-pointer" title="Delete"><Trash2 size={11} strokeWidth={2.5} /></button>}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Desktop: List table ──
  const desktopList = (
    <div className="hidden lg:block overflow-x-auto bg-white border border-slate-200 rounded-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <Header label="#" field="id" sortField={sortField} sortDir={sortDir} handleSort={handleSort} />
            <Header label="Pic" sortField={sortField} sortDir={sortDir} handleSort={handleSort} />
            <Header label="Barcode" field="barcode" sortField={sortField} sortDir={sortDir} handleSort={handleSort} />
            <Header label="Product Name" field="product_name" sortField={sortField} sortDir={sortDir} handleSort={handleSort} />
            <Header label="Category" field="category" sortField={sortField} sortDir={sortDir} handleSort={handleSort} />
            <Header label="Reorder" field="reorder_level" sortField={sortField} sortDir={sortDir} handleSort={handleSort} />
            <Header label="Supplier" field="supplier" sortField={sortField} sortDir={sortDir} handleSort={handleSort} />
            <Header label="Actions" sortField={sortField} sortDir={sortDir} handleSort={handleSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {displayed.map((p) => (
            <tr key={p.id} className="group hover:bg-orange-50/60 transition-colors">
              <td className="px-5 py-4">
                <span className="text-[12px] font-black text-slate-500 tabular-nums group-hover:text-orange-600 transition-colors">#{p.id}</span>
              </td>
              <td className="px-5 py-4 whitespace-nowrap">
                <div className="w-10 h-10 rounded-sm bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                  {p.product_picture ? (
                    <img
                      src={`${BASE_URL}${p.product_picture}`}
                      alt={p.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={16} className="text-slate-200" />
                  )}
                </div>
              </td>
              <td className="px-5 py-4 whitespace-nowrap">
                <span className="text-[12px] font-mono font-bold text-slate-300 tracking-tighter tabular-nums group-hover:text-orange-400 transition-colors">{p.barcode}</span>
              </td>
              <td className="px-5 py-4">
                <span className="text-[12px] font-black text-slate-900 tracking-tight group-hover:text-orange-600 transition-colors">
                  {p.product_name}
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex text-[9px] font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100/50 uppercase tracking-widest">
                  {p.category}
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="text-[12px] font-black text-slate-950 tabular-nums group-hover:text-orange-600 transition-colors">{p.reorder_level}</span>
              </td>
              <td className="px-5 py-4">
                <span className="text-[12px] font-black text-slate-400 tracking-widest group-hover:text-orange-600 transition-colors">{p.supplier}</span>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onView(p)}
                    className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all cursor-pointer"
                    title="View Product"
                  >
                    <Eye size={16} strokeWidth={2.5} />
                  </button>
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
  );

  // ── Desktop: Grid cards ──
  const desktopGrid = (
    <div className="hidden lg:grid grid-cols-6 gap-2">
      {displayed.map((p) => (
        <div key={p.id} className="group relative bg-white border border-slate-200 rounded-sm overflow-hidden transition-all duration-300 hover:border-orange-400 hover:shadow-md hover:shadow-orange-500/10 hover:-translate-y-0.5">
          {/* Card button — click anywhere to view */}
          <button type="button" onClick={() => onView(p)} className="w-full text-left flex flex-col cursor-pointer">
            <div className="h-20 w-full bg-slate-50 flex items-center justify-center overflow-hidden group-hover:bg-orange-50 transition-colors relative">
              {p.product_picture ? (
                <img src={`${BASE_URL}${p.product_picture}`} alt={p.product_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <Package size={20} strokeWidth={1} className="opacity-20" />
              )}
              <span className="absolute top-1 left-1 text-[8px] font-black text-slate-500 tabular-nums bg-white/80 px-1 py-0.5 rounded-sm">#{p.id}</span>
            </div>
            <div className="px-2 py-1.5 flex flex-col gap-1">
              <span className="text-[8px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-100 uppercase tracking-widest self-start truncate max-w-full">{p.category}</span>
              <span className="text-[11px] font-black text-slate-900 leading-tight truncate group-hover:text-orange-600 transition-colors">{p.product_name}</span>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-[9px] text-slate-400 truncate">{p.supplier}</span>
                <span className="text-[10px] font-black text-orange-600 tabular-nums shrink-0 ml-1">{p.reorder_level}</span>
              </div>
            </div>
          </button>
          {/* Action overlay — sibling to button, pointer-events-none so bg passes clicks to card */}
          <div className="absolute top-0 inset-x-0 h-20 bg-black/30 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity flex items-center justify-center gap-1">
            <button type="button" onClick={() => onView(p)} className="pointer-events-auto p-1.5 bg-white/90 rounded-sm text-slate-600 hover:text-blue-500 transition-colors cursor-pointer" title="View"><Eye size={11} strokeWidth={2.5} /></button>
            {canEdit && <button type="button" onClick={() => onEdit(p)} className="pointer-events-auto p-1.5 bg-white/90 rounded-sm text-slate-600 hover:text-orange-500 transition-colors cursor-pointer" title="Edit"><Edit2 size={11} strokeWidth={2.5} /></button>}
            {canDelete && <button type="button" onClick={() => onDelete(p)} className="pointer-events-auto p-1.5 bg-white/90 rounded-sm text-slate-600 hover:text-red-500 transition-colors cursor-pointer" title="Delete"><Trash2 size={11} strokeWidth={2.5} /></button>}
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
