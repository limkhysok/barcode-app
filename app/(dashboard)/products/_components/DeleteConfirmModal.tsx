"use client";

import type { Product } from "@/src/types/product.types";

interface DeleteConfirmModalProps {
  target: Product | null;
  onClose: () => void;
  onDelete: () => Promise<void>;
  deleting: boolean;
}

export function DeleteConfirmModal({
  target,
  onClose,
  onDelete,
  deleting,
}: Readonly<DeleteConfirmModalProps>) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
      <button className="absolute inset-0 bg-black/20 backdrop-blur-sm cursor-default" onClick={onClose} aria-label="Close modal" />
      <div className="relative bg-white rounded-t-md sm:rounded-sm shadow-xl w-full sm:max-w-sm overflow-hidden">
        <div className="px-5 py-5">
          <p className="text-[13px] font-bold text-gray-800">
            Are you sure to delete{" "}
            <span className="font-black text-black">{target.product_name}</span>?
          </p>
          <p className="text-[11px] text-gray-500 mt-1">This action cannot be undone. All details of this product will be permanently removed.</p>
        </div>
        <div className="border-t border-black px-5 py-3 bg-gray-50/50 flex justify-end gap-2">
          <button onClick={onClose} disabled={deleting}
            className="w-20 py-1.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition disabled:opacity-60 cursor-pointer">
            Cancel
          </button>
          <button onClick={onDelete} disabled={deleting}
            className="w-20 py-1.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-white bg-red-500 hover:bg-red-600 active:scale-[0.98] transition disabled:opacity-60 cursor-pointer">
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
