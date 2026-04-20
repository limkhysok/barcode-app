"use client";

import React from "react";
import type { Product } from "@/src/types/product.types";
import { Edit2, Trash2, Eye, Database, ArrowUp, ArrowDown, Image as ImageIcon, Package } from "lucide-react";

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

  // ── Tablet: 2-col cards ──
  const tabletGrid = (
    <div className="hidden sm:grid lg:hidden grid-cols-2 gap-3 p-3">
      {displayed.map((p) => (
        <div key={p.id} className="group bg-white border border-slate-200 rounded-sm overflow-hidden flex flex-col transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5">
          {/* Header bar */}
          <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <span className="text-[9px] font-black text-slate-400 tabular-nums">#{p.id}</span>
            <span className="text-[9px] font-mono font-bold text-slate-300 uppercase tracking-tighter truncate max-w-32 ml-2">{p.barcode}</span>
          </div>

          {/* Image */}
          <div className="aspect-video w-full bg-slate-50 flex items-center justify-center border-b border-slate-100 overflow-hidden group-hover:bg-slate-100 transition-colors">
            {p.product_picture ? (
              <img
                src={`${BASE_URL}${p.product_picture}`}
                alt={p.product_name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-20">
                <ImageIcon size={28} strokeWidth={1} />
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">No Preview</span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-3 py-3 flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[8px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-widest shrink-0">
                {p.category}
              </span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide truncate">{p.supplier}</span>
            </div>
            <span className="text-[12px] font-black text-slate-900 uppercase leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors">
              {p.product_name}
            </span>
            <div className="flex items-baseline gap-1.5 mt-auto pt-1">
              <span className="text-3xl font-black text-orange-600 tabular-nums leading-none tracking-tighter">{p.reorder_level}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">reorder</span>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-2 pb-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => onView(p)}
              className="flex-1 flex items-center justify-center py-2.5 rounded-sm bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all cursor-pointer border border-transparent hover:border-blue-100"
              title="View"
            >
              <Eye size={14} strokeWidth={2.5} />
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(p)}
                className="flex-1 flex items-center justify-center py-2.5 rounded-sm bg-slate-50 text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-all cursor-pointer border border-transparent hover:border-orange-100"
                title="Edit"
              >
                <Edit2 size={14} strokeWidth={2.5} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(p)}
                className="flex-1 flex items-center justify-center py-2.5 rounded-sm bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer border border-transparent hover:border-red-100"
                title="Delete"
              >
                <Trash2 size={14} strokeWidth={2.5} />
              </button>
            )}
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
            <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-4">
                <span className="text-[11px] font-black text-slate-500 tabular-nums">#{p.id}</span>
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
                <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-tighter tabular-nums">{p.barcode}</span>
              </td>
              <td className="px-5 py-4">
                <span className="text-[13px] font-black text-slate-900 uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                  {p.product_name}
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex text-[9px] font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100/50 uppercase tracking-widest">
                  {p.category}
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="text-sm font-black text-slate-950 tabular-nums">{p.reorder_level}</span>
              </td>
              <td className="px-5 py-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.supplier}</span>
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
    <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-3">
      {displayed.map((p) => (
        <div key={p.id} className="group bg-white border border-slate-200 rounded-sm overflow-hidden flex flex-col transition-all duration-300 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5">
          {/* Top bar */}
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <span className="text-[10px] font-black text-slate-400 tabular-nums">#{p.id}</span>
            <span className="text-[10px] font-bold text-slate-300 tracking-tighter font-mono uppercase">{p.barcode}</span>
          </div>

          {/* Image Section */}
          <div className="aspect-video w-full bg-slate-50 flex items-center justify-center border-b border-slate-100 overflow-hidden relative group-hover:bg-slate-100 transition-colors">
            {p.product_picture ? (
              <img
                src={`${BASE_URL}${p.product_picture}`}
                alt={p.product_name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-20">
                <ImageIcon size={32} strokeWidth={1} />
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">No Preview</span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-4 py-5 flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-widest">
                {p.category}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.supplier}</span>
            </div>

            <span className="text-sm font-black text-slate-900 uppercase leading-tight group-hover:text-orange-600 transition-colors line-clamp-2 min-h-10">
              {p.product_name}
            </span>

            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-4xl font-black text-orange-600 tabular-nums leading-none tracking-tighter">{p.reorder_level}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">reorder units</span>
            </div>
          </div>

          {/* Actions footer */}
          <div className="px-2 pb-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => onView(p)}
              className="flex-1 flex items-center justify-center py-2.5 rounded-sm bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all cursor-pointer border border-transparent hover:border-blue-100"
              title="View"
            >
              <Eye size={14} strokeWidth={2.5} />
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(p)}
                className="flex-1 flex items-center justify-center py-2.5 rounded-sm bg-slate-50 text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-all cursor-pointer border border-transparent hover:border-orange-100"
                title="Edit"
              >
                <Edit2 size={14} strokeWidth={2.5} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(p)}
                className="flex-1 flex items-center justify-center py-2.5 rounded-sm bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer border border-transparent hover:border-red-100"
                title="Delete"
              >
                <Trash2 size={14} strokeWidth={2.5} />
              </button>
            )}
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
