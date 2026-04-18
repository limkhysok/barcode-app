"use client";

import type { InventoryRecord } from "@/src/types/inventory.types";

interface DeleteConfirmModalProps {
  target: InventoryRecord | null;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

export function DeleteConfirmModal({ target, onCancel, onConfirm, deleting }: Readonly<DeleteConfirmModalProps>) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
      <button className="absolute inset-0 bg-black/20 backdrop-blur-sm cursor-default" onClick={onCancel} aria-label="Close modal" />
      <div className="relative bg-white rounded-t-md sm:rounded-sm shadow-xl w-full sm:max-w-sm overflow-hidden">
        <div className="px-5 py-5">
          <p className="text-[13px] font-bold text-gray-800">
            Are you sure to delete Record{" "}
            <span className="font-black text-black">#{target.id}</span>?
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            <span className="font-black text-gray-700">{target.product_details.product_name}</span> at{" "}
            <span className="font-black text-gray-700">{target.site}</span> will be permanently removed.
          </p>
        </div>
        <div className="border-t border-black px-5 py-3 bg-gray-50/50 flex justify-end gap-2">
          <button onClick={onCancel} disabled={deleting}
            className="w-20 py-1.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition disabled:opacity-60 cursor-pointer">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="w-20 py-1.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-white bg-red-500 hover:bg-red-600 active:scale-[0.98] transition disabled:opacity-60 cursor-pointer">
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
