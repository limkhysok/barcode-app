"use client";

import type { Product } from "@/src/types/product.types";
import { X, Package, Image as ImageIcon } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface ProductViewModalProps {
  product: Product | null;
  onClose: () => void;
}

function Row({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-[12px] font-semibold text-gray-800 break-all">{value}</span>
    </div>
  );
}

export function ProductViewModal({ product, onClose }: Readonly<ProductViewModalProps>) {
  if (!product) return null;

  const imageUrl = product.product_picture
    ? product.product_picture.startsWith("http")
      ? product.product_picture
      : `${BASE_URL}${product.product_picture}`
    : null;

  const createdAt = new Date(product.created_at).toLocaleString();
  const updatedAt = new Date(product.updated_at).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
      <button
        className="absolute inset-0 bg-black/20 backdrop-blur-sm cursor-default"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="relative bg-white rounded-t-md sm:rounded-sm shadow-xl w-full sm:max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-orange-500">Product</p>
            <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-wider leading-tight">
              {product.product_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Image */}
        <div className="px-5 pt-4">
          {imageUrl ? (
            <div className="w-full h-40 rounded-sm overflow-hidden bg-gray-50 border border-gray-100">
              <img src={imageUrl} alt={product.product_name} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-full h-40 rounded-sm bg-gray-50 border border-gray-100 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-sm bg-gray-200 flex items-center justify-center">
                <Package size={18} className="text-gray-400" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">No Image</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="px-5 py-4">
          <Row label="ID" value={`#${product.id}`} />
          <Row label="Barcode" value={product.barcode} />
          <Row label="Category" value={product.category} />
          <Row label="Supplier" value={product.supplier} />
          <Row label="Cost / Unit" value={`$${Number(product.cost_per_unit).toFixed(2)}`} />
          <Row label="Reorder Level" value={product.reorder_level} />
          <Row label="Created" value={createdAt} />
          <Row label="Updated" value={updatedAt} />
        </div>

        {/* Footer */}
        <div className="border-t border-black px-5 py-3 bg-gray-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
