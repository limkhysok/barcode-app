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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm px-5 pt-4 pb-8 sm:p-7 space-y-5 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-gray-900">Delete Product?</h2>
          <p className="text-sm text-gray-500">
            <span className="font-semibold">{target.product_name}</span> will be permanently removed.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition">
            Cancel
          </button>
          <button onClick={onDelete} disabled={deleting}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold tracking-widest uppercase text-white bg-red-500 hover:bg-red-600 active:scale-[0.97] transition disabled:opacity-60">
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
