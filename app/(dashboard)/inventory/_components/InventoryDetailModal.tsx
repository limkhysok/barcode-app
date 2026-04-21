"use client";

import React from "react";
import type { InventoryRecord } from "@/src/types/inventory.types";
import { X, Package } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface InventoryDetailModalProps {
  open: boolean;
  record: InventoryRecord | null;
  onClose: () => void;
}

function Row({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-300 last:border-0">
      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-[12px] font-semibold text-gray-800 break-all uppercase">{value}</span>
    </div>
  );
}

export function InventoryDetailModal({ open, record, onClose }: Readonly<InventoryDetailModalProps>) {
  if (!open || !record) return null;

  const recordPic = record.product_details.product_picture;
  let imageUrl: string | null = null;
  if (recordPic) {
    imageUrl = recordPic.startsWith("http") ? recordPic : `${BASE_URL}${recordPic}`;
  }

  const updatedAt = new Date(record.updated_at).toLocaleString();

  const isLow = record.reorder_status === "LOW";
  const isOut = record.quantity_on_hand === 0;

  let statusLabel = "GOOD STOCK";
  let statusColor = "text-green-600 bg-green-50 border-green-100";
  if (isOut) {
    statusLabel = "NO STOCK";
    statusColor = "text-red-500 bg-red-50 border-red-100";
  } else if (isLow) {
    statusLabel = "LOW STOCK";
    statusColor = "text-yellow-600 bg-yellow-50 border-yellow-100";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
      <button
        className="absolute inset-0 bg-black/20 backdrop-blur-sm cursor-default"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="relative bg-white rounded-t-lg sm:rounded-sm shadow-xl w-full sm:max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-orange-500">Inventory Inquiry</p>
            <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-wider leading-tight">
              {record.product_details.product_name}
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
              <img src={imageUrl} alt={record.product_details.product_name} className="w-full h-full object-contain" />
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
          <Row label="Record ID" value={`#${record.id}`} />
          <Row label="Barcode" value={record.product_details.barcode || "N/A"} />
          <Row label="Category" value={record.product_details.category} />
          <Row label="Site" value={record.site} />
          <Row label="Zone / Location" value={record.location} />
          <Row label="Quantity on Hand" value={
            <span className="text-[14px] font-black text-orange-600 tabular-nums">
              {record.quantity_on_hand.toLocaleString()}
            </span>
          } />
          <Row label="Status" value={
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black border ${statusColor}`}>
               {statusLabel}
            </span>
          } />
          <Row label="Last Update" value={updatedAt} />
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
