"use client";

import React from "react";
import type { InventoryRecord } from "@/src/types/inventory.types";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  target: InventoryRecord | null;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

export function DeleteConfirmModal({ target, onCancel, onConfirm, deleting }: Readonly<DeleteConfirmModalProps>) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
      <div className="bg-white rounded-t-sm sm:rounded-sm shadow-2xl w-full sm:max-w-sm p-6 text-center border-b-[6px] border-red-500">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertTriangle className="w-7 h-7 text-red-500" strokeWidth={2.5} />
        </div>
        <div className="space-y-2 mb-6">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">Delete Record?</h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
            Record <span className="text-slate-900"># {target.id}</span> for <span className="text-slate-900">{target.product_details.product_name}</span> at <span className="text-slate-900">{target.site}</span> will be permanently purged.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-3 rounded-md text-[11px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition disabled:opacity-60"
          >
            Abort
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3 rounded-md text-[11px] font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 active:scale-[0.97] transition disabled:opacity-60 shadow-lg shadow-red-200 flex items-center justify-center gap-2"
          >
            {deleting ? "Purging…" : (
              <>
                <Trash2 size={14} strokeWidth={3} />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
