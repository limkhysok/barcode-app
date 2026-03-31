"use client";

import React from "react";
import type { Transaction, TransactionPayload } from "@/src/types/transaction.types";
import type { InventoryRecord } from "@/src/types/inventory.types";
import { formatDateTime, fmtValue } from "../utils/helpers";
import { TYPE_CONFIG, ItemDraft, getNextItemId, emptyItem } from "../utils/constants";
import InventoryPicker from "./InventoryPicker";
import { scanBarcode } from "@/src/services/inventory.service";

// ─── ViewTransactionModal ───────────────────────────────────────────────────

type ViewModalProps = {
  viewTarget: Transaction | null;
  onClose: () => void;
};

export const ViewTransactionModal: React.FC<ViewModalProps> = ({ viewTarget, onClose }) => {
  if (!viewTarget) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
      <div className="bg-white rounded-t-sm sm:rounded-sm shadow-2xl w-full sm:max-w-lg flex flex-col max-h-[90vh]">
        <div className="h-1 w-full rounded-t-sm sm:rounded-t-sm" style={{ background: "#FA4900" }} />
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-black shrink-0">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-none"
              style={{ background: "#FFF0E8", color: "#FA4900" }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#FA4900" }} />
              <span>View</span>
            </span>
            <h2 className="text-xl font-bold text-gray-900">Transaction #{viewTarget.id}</h2>
            <p className="text-xs text-gray-400 mt-0.5" suppressHydrationWarning>{formatDateTime(viewTarget.transaction_date)}</p>
          </div>
          <button onClick={onClose}
            className="mt-1 p-2 rounded-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="flex items-center gap-4 flex-wrap">
            {(() => {
              const cfg = TYPE_CONFIG[viewTarget.transaction_type];
              return (
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                  {cfg.label}
                </span>
              );
            })()}
            <span className="text-xs text-gray-500">by <span className="font-semibold text-gray-700">{viewTarget.performed_by_username}</span></span>
          </div>
          <div className="border border-black overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-black">
                <tr>
                  {["Product", "Qty", "Unit Cost", "Total"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold tracking-widest uppercase text-slate-900">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {viewTarget.items.map((item) => {
                  const sign = viewTarget.transaction_type === "Receive" ? "+" : "−";
                  const valCol = viewTarget.transaction_type === "Receive" ? "text-green-600" : "text-red-500";
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-semibold text-gray-800">{item.product_name}</td>
                      <td className="px-4 py-3 text-gray-600 tabular-nums">{Math.abs(item.quantity)}</td>
                      <td className="px-4 py-3 text-gray-600 tabular-nums">${Number.parseFloat(item.cost_per_unit).toFixed(2)}</td>
                      <td className={`px-4 py-3 font-bold tabular-nums ${valCol}`}>
                        {sign}${Number.parseFloat(item.line_total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Grand Total</p>
            <p className={`text-xl font-black tabular-nums ${viewTarget.transaction_type === "Receive" ? "text-green-600" : "text-red-500"}`}>
              {fmtValue(viewTarget.total_transaction_value, viewTarget.transaction_type === "Receive" ? "+" : "−")}
            </p>
          </div>
        </div>
        <div className="border-t border-black px-6 py-4 shrink-0">
          <button type="button" onClick={onClose}
            className="w-full py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── DeleteConfirmModal ─────────────────────────────────────────────────────

type DeleteModalProps = {
  deleteTarget: Transaction | null;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
};

export const DeleteConfirmModal: React.FC<DeleteModalProps> = ({ deleteTarget, onClose, onConfirm, deleting }) => {
  if (!deleteTarget) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm px-5 pt-4 pb-8 sm:p-7 space-y-5 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-gray-900">Delete Transaction?</h2>
          <p className="text-sm text-gray-500">
            <span className="font-semibold">{deleteTarget.transaction_type}</span>
            {" · "}
            <span className="font-semibold">{deleteTarget.items.length} item{deleteTarget.items.length === 1 ? "" : "s"}</span>
            {" · "}
            <span className="font-semibold">{fmtValue(deleteTarget.total_transaction_value, "")}</span>
            {" will be permanently removed."}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={deleting}
            className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition disabled:opacity-60">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-white bg-red-500 hover:bg-red-600 active:scale-[0.97] transition disabled:opacity-60">
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── NewTransactionModal ─────────────────────────────────────────────────────

type NewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryRecord[];
  onSave: (payload: TransactionPayload, andExport: boolean) => Promise<void>;
  saving: boolean;
  formError: string;
};

export const NewTransactionModal: React.FC<NewModalProps> = ({ isOpen, onClose, inventory, onSave, saving, formError }) => {
  const [txType, setTxType] = React.useState<"Receive" | "Sale">("Receive");
  const [items, setItems] = React.useState<ItemDraft[]>([emptyItem()]);
  const [scanInput, setScanInput] = React.useState("");
  const [scanFeedback, setScanFeedback] = React.useState<{ ok: boolean; msg: string } | null>(null);
  const scanInputRef = React.useRef<HTMLInputElement>(null);
  const [extraRecords, setExtraRecords] = React.useState<InventoryRecord[]>([]);

  // Combined inventory sources: the prop-provided paginated list + any missing items fetched via scanning
  const allInventory = React.useMemo(() => {
    const merged = [...inventory];
    for (const er of extraRecords) {
      if (!merged.some(r => r.id === er.id)) merged.push(er);
    }
    return merged;
  }, [inventory, extraRecords]);

  React.useEffect(() => {
    if (isOpen) {
      // Focus after a tiny delay to ensure the modal is visible
      setTimeout(() => scanInputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      setTxType("Receive");
      setItems([emptyItem()]);
      setScanInput("");
      setScanFeedback(null);
      setExtraRecords([]); // Clear cache on close
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
    // Small delay to ensure the DOM has updated before refocusing terminal
    setTimeout(() => scanInputRef.current?.focus(), 50);
  };
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, patch: Partial<ItemDraft>) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const handleScanBarcodeWithValue = async (inputValue: string) => {
    const q = inputValue.trim();
    if (!q) return;

    // Clear input immediately to prepare for next scan
    setScanInput("");

    try {
      const scanRes = await scanBarcode(q);
      
      if (!scanRes.found || !scanRes.inventory.length) {
        setScanFeedback({ ok: false, msg: scanRes.detail || `"${q}" not found in inventory.` });
        return;
      }

      // Automatically pick the first inventory record found for this barcode
      const targetRecord = scanRes.inventory[0];
      const invId = targetRecord.id;

      // Ensure we have the full record info for this ID locally
      const existsInProp = inventory.some(r => r.id === invId);
      const existsInExtra = extraRecords.some(r => r.id === invId);
      
      if (!existsInProp && !existsInExtra) {
        setExtraRecords(prev => [...prev, targetRecord]);
      }
      
      setItems((prev) => {
        const currentItems = [...prev];
        const existingIdx = currentItems.findIndex((i) => i.inventory === invId);

        if (existingIdx >= 0) {
          return currentItems.map((item, i) =>
            i === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
          );
        }

        const emptyIdx = currentItems.findIndex((i) => i.inventory === 0);
        if (emptyIdx >= 0) {
          return currentItems.map((item, i) =>
            i === emptyIdx ? { ...item, inventory: invId, quantity: 1 } : item
          );
        }

        return [...currentItems, { id: getNextItemId(), inventory: invId, quantity: 1 }];
      });

      const productName = scanRes.product?.product_name || targetRecord.product_details?.product_name || "Unknown";
      setScanFeedback({ ok: true, msg: `+1 × ${productName} (${targetRecord.site})` });
    } catch (err) {
      console.error("Scan error:", err);
      setScanFeedback({ ok: false, msg: `"${q}" not found or error occurred.` });
    }
    setTimeout(() => setScanFeedback(null), 3000);
  };

  const handleSubmit = (e: React.BaseSyntheticEvent, andExport: boolean) => {
    e.preventDefault();
    const valid = items.filter((i) => i.inventory > 0 && i.quantity > 0);
    const payload: TransactionPayload = {
      transaction_type: txType,
      items: valid.map((i) => ({
        inventory: i.inventory,
        quantity: txType === "Sale" ? -Math.abs(i.quantity) : Math.abs(i.quantity),
      })),
    };
    onSave(payload, andExport);
  };

  const selectedInvIds = items.map((i) => i.inventory).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
      <div className="bg-white rounded-t-sm sm:rounded-sm shadow-2xl w-full sm:max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="h-1 w-full shrink-0" style={{ background: "#FA4900" }} />
        <div className="flex items-center justify-between px-5 py-4 border-b border-black shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">New Transaction</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-[8px] font-bold tracking-widest uppercase text-[#FA4900]">
                  <span className="w-1 h-1 rounded-full bg-[#FA4900] animate-pulse" />
                  <span>Live Session</span>
                </span>
                <span className="text-gray-300 text-[8px]">|</span>
                <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest italic">Digital Processing Active</p>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-sm text-gray-400 hover:text-black hover:bg-gray-100 transition-all shrink-0 active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white sm:border-r border-black">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400 flex items-center gap-2">
                  <span className="w-3 h-0.5 bg-gray-200" />
                  <span>Scanner Terminal</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-black tracking-widest uppercase ${txType === "Receive" ? "text-green-600" : "text-gray-300"}`}>Receive</span>
                  <button
                    type="button"
                    onClick={() => setTxType(txType === "Receive" ? "Sale" : "Receive")}
                    className="relative w-8 h-4 rounded-full bg-slate-100 border border-slate-200 transition-colors duration-200 focus:outline-none"
                  >
                    <div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full shadow-sm transition-transform duration-200 transform ${txType === "Sale" ? "translate-x-4 bg-red-600" : "bg-green-600"}`} />
                  </button>
                  <span className={`text-[8px] font-black tracking-widest uppercase ${txType === "Sale" ? "text-red-600" : "text-gray-300"}`}>Sale</span>
                </div>
              </div>
              <div className="group relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-focus-within:bg-[#FA4900] transition-colors" />
                </div>
                <input
                  ref={scanInputRef}
                  type="text"
                  autoComplete="off"
                  autoFocus
                  id="barcode-scan-input"
                  placeholder="SCAN BARCODE..."
                  value={scanInput}
                  onChange={(e) => {
                    setScanInput(e.target.value);
                    setScanFeedback(null);
                  }}
                  onKeyDown={(e) => {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (e.key === "Enter" || e.key === "Tab") {
                      console.log("[Scanner] Input detected:", value);
                      e.preventDefault();
                      if (value !== "") handleScanBarcodeWithValue(value);
                    }
                  }}
                  className="w-full pl-9 pr-12 py-2 rounded-sm border-2 border-black text-sm bg-white text-black outline-none focus:border-[#FA4900] transition-all placeholder:text-gray-300 font-mono tracking-widest uppercase"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
                    <rect x="7" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
                    <rect x="12" y="4" width="2" height="16" rx="0.5" fill="currentColor" />
                    <rect x="18" y="4" width="1" height="16" rx="0.5" fill="currentColor" />
                    <rect x="21" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
                  </svg>
                </div>
              </div>
              {scanFeedback && (
                <p className={`text-[10px] font-bold tracking-widest uppercase px-4 py-2 border flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${scanFeedback.ok ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${scanFeedback.ok ? "bg-green-500" : "bg-red-500"}`} />
                  {scanFeedback.msg}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400 flex items-center gap-2">
                  <span className="w-3 h-0.5 bg-gray-200" />
                  <span>Item Registry</span>
                </p>
                <span className="text-[10px] font-bold text-gray-300 tabular-nums uppercase tracking-widest">{items.filter(i => i.inventory > 0).length} Registered</span>
              </div>
              <div className="space-y-2 max-h-62.5 overflow-y-auto custom-scrollbar">
                {items.map((item, idx) => {
                  const rec = allInventory.find((r) => r.id === item.inventory);
                  return (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-black hover:bg-white transition-all group/item">
                      <div className="w-6 text-[10px] font-black text-gray-300 text-center">{String(idx + 1).padStart(2, "0")}</div>
                      <div className="flex-1 min-w-0">
                        <InventoryPicker
                          inventory={allInventory}
                          value={item.inventory}
                          onChange={(id) => updateItem(idx, { inventory: id })}
                          excludeIds={selectedInvIds}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min={1}
                            placeholder="0"
                            value={item.quantity || ""}
                            onChange={(e) => updateItem(idx, { quantity: Math.abs(Number.parseInt(e.target.value) || 0) })}
                            className="w-14 px-2 py-2 rounded-sm border border-black text-sm outline-none focus:ring-1 focus:ring-black transition text-right font-black bg-white"
                          />
                          {rec && (
                            <div className="flex items-center gap-1 ml-1.5 px-1">
                              <span className="text-lg font-black text-gray-200 leading-none">/</span>
                              <span className="text-sm font-black text-gray-400 tabular-nums leading-none">{rec.quantity_on_hand}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="p-1.5 rounded-sm text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-0 active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={addItem}
                className="w-full py-2.5 bg-white border-2 border-dashed border-slate-100 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase hover:border-black hover:text-black transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Include Entry
              </button>
            </div>
          </div>

          <div className="sm:w-80 shrink-0 flex flex-col bg-slate-50 border-t sm:border-t-0 border-black">
            <div className="px-5 py-4 border-b border-black bg-white">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-900">Receipt</p>
                <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-0 flex flex-col">
              {(() => {
                const filled = items.filter((i) => i.inventory > 0 && i.quantity > 0);
                if (filled.length === 0) {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 px-10 text-center gap-4">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                        </svg>
                      </div>
                      <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">Awaiting item registry entries for generation</p>
                    </div>
                  );
                }
                const sign = txType === "Receive" ? "+" : "−";
                const valCol = txType === "Receive" ? "text-green-600" : "text-red-600";
                const grandTotal = filled.reduce((sum, i) => {
                  const rec = allInventory.find((r) => r.id === i.inventory);
                  return sum + (rec ? i.quantity * Number.parseFloat(rec.product_details.cost_per_unit) : 0);
                }, 0);
                return (
                  <div className="divide-y divide-black">
                    <div className="min-h-0 border-b border-black">
                      <table className="w-full">
                        <thead className="bg-slate-100/50">
                          <tr className="border-b border-black">
                            <th className="px-4 py-2 text-left text-[9px] font-black tracking-widest uppercase text-gray-500">Item Details</th>
                            <th className="px-4 py-2 text-right text-[9px] font-black tracking-widest uppercase text-gray-500">Valuation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 bg-white/40">
                          {filled.map((i) => {
                            const rec = allInventory.find((r) => r.id === i.inventory);
                            const lineTotal = rec ? i.quantity * Number.parseFloat(rec.product_details.cost_per_unit) : 0;
                            return (
                              <tr key={i.id} className="group/row hover:bg-white transition-colors">
                                <td className="px-4 py-3">
                                  <p className="text-[11px] font-black text-gray-900 leading-tight uppercase truncate max-w-35">{rec?.product_details.product_name ?? "—"}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] font-bold text-gray-400 tabular-nums">{i.quantity} UNIT{i.quantity === 1 ? "" : "S"}</span>
                                    <span className="text-[9px] font-bold text-gray-200">/</span>
                                    <span className="text-[9px] font-bold text-gray-400 truncate">{rec?.site}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right align-top">
                                  <p className={`text-[11px] font-black tabular-nums transition-colors ${valCol}`}>
                                    {sign}${lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-6 bg-white space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Summary Total</p>
                        <span className="text-[10px] font-black text-gray-900 tabular-nums tracking-widest">${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pt-4 border-t-2 border-black flex flex-col items-center gap-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Grand Value</p>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-[12px] font-black ${valCol}`}>{sign}</span>
                          <p className={`text-3xl font-black tabular-nums tracking-tighter ${valCol}`}>
                            ${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="border-t border-black px-5 py-3 shrink-0 space-y-3 bg-gray-50/50">
          {formError && (
            <p className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 rounded-sm px-3 py-2 flex items-center gap-2 uppercase tracking-widest">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {formError}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button type="button" onClick={onClose}
              className="py-2.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition shadow-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={saving}
              className="py-2.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-white active:scale-[0.98] transition disabled:opacity-60 shadow-md transform hover:-translate-y-0.5"
              style={{ background: "#FA4900" }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={(e) => handleSubmit(e, true)}
              className="py-2 rounded-sm text-[10px] font-black tracking-widest uppercase text-white bg-slate-900 hover:bg-black active:scale-[0.98] transition disabled:opacity-60 whitespace-nowrap shadow-md transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231a1.125 1.125 0 01-1.12-1.227L6.34 18m11.318-5.318a4.5 4.5 0 00-6.364 0m6.364 0c.24.24.451.506.63.797m-6.994-.797a4.5 4.5 0 00-3.181 3.182m0 0a4.503 4.503 0 014.535-3.041m0 0a4.503 4.503 0 014.535 3.041m-9.07 0c.179-.291.39-.557.63-.797m0 0a4.5 4.5 0 013.181-3.182m0 0a4.5 4.5 0 013.181 3.182" />
              </svg>
              <span>{saving ? "Processing..." : "Save & Print"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── EditTransactionModal ─────────────────────────────────────────────────────

type EditModalProps = {
  editTarget: Transaction | null;
  onClose: () => void;
  inventory: InventoryRecord[];
  onSave: (id: number, payload: TransactionPayload) => Promise<void>;
  saving: boolean;
  formError: string;
};

export const EditTransactionModal: React.FC<EditModalProps> = ({ editTarget, onClose, inventory, onSave, saving, formError }) => {
  const [editTxType, setEditTxType] = React.useState<"Receive" | "Sale">("Receive");
  const [editItems, setEditItems] = React.useState<ItemDraft[]>([emptyItem()]);
  const [scanInput, setScanInput] = React.useState("");
  const [scanFeedback, setScanFeedback] = React.useState<{ ok: boolean; msg: string } | null>(null);
  const editScanInputRef = React.useRef<HTMLInputElement>(null);
  const [extraRecords, setExtraRecords] = React.useState<InventoryRecord[]>([]);

  const allEditInventory = React.useMemo(() => {
    const merged = [...inventory];
    for (const er of extraRecords) {
      if (!merged.some(r => r.id === er.id)) merged.push(er);
    }
    return merged;
  }, [inventory, extraRecords]);

  React.useEffect(() => {
    if (editTarget) {
      setTimeout(() => editScanInputRef.current?.focus(), 150);
    }
  }, [editTarget]);

  React.useEffect(() => {
    if (editTarget) {
      setEditTxType(editTarget.transaction_type);
      setEditItems(editTarget.items.map((item) => ({
        id: getNextItemId(),
        inventory: item.inventory,
        quantity: Math.abs(item.quantity),
      })));
    }
  }, [editTarget]);

  if (!editTarget) return null;

  const addEditItem = () => {
    setEditItems((prev) => [...prev, emptyItem()]);
    setTimeout(() => editScanInputRef.current?.focus(), 50);
  };
  const removeEditItem = (idx: number) => setEditItems((prev) => prev.filter((_, i) => i !== idx));
  const updateEditItem = (idx: number, patch: Partial<ItemDraft>) => {
    setEditItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const handleScanBarcodeWithValue = async (inputValue: string) => {
    const q = inputValue.trim();
    if (!q) return;

    setScanInput("");
    try {
      const scanRes = await scanBarcode(q);
      
      if (!scanRes.found || !scanRes.inventory.length) {
        setScanFeedback({ ok: false, msg: scanRes.detail || `"${q}" not found in inventory.` });
        return;
      }

      const targetRecord = scanRes.inventory[0];
      const invId = targetRecord.id;

      const existsInProp = inventory.some(r => r.id === invId);
      const existsInExtra = extraRecords.some(r => r.id === invId);
      
      if (!existsInProp && !existsInExtra) {
        setExtraRecords(prev => [...prev, targetRecord]);
      }

      setEditItems((prev) => {
        const currentItems = [...prev];
        const existingIdx = currentItems.findIndex((i) => i.inventory === invId);

        if (existingIdx >= 0) {
          return currentItems.map((item, i) =>
            i === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
          );
        }

        const emptyIdx = currentItems.findIndex((i) => i.inventory === 0);
        if (emptyIdx >= 0) {
          return currentItems.map((item, i) =>
            i === emptyIdx ? { ...item, inventory: invId, quantity: 1 } : item
          );
        }

        return [...currentItems, { id: getNextItemId(), inventory: invId, quantity: 1 }];
      });

      const productName = scanRes.product?.product_name || targetRecord.product_details?.product_name || "Unknown";
      setScanFeedback({ ok: true, msg: `+1 × ${productName} (${targetRecord.site})` });
    } catch (err) {
      console.error("Scan error:", err);
      setScanFeedback({ ok: false, msg: `"${q}" not found or error occurred.` });
    }
    setTimeout(() => setScanFeedback(null), 3000);
  };

  const handleSubmit = (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    const valid = editItems.filter((i) => i.inventory > 0 && i.quantity > 0);
    const payload: TransactionPayload = {
      transaction_type: editTxType,
      items: valid.map((i) => ({
        inventory: i.inventory,
        quantity: editTxType === "Sale" ? -Math.abs(i.quantity) : Math.abs(i.quantity),
      })),
    };
    onSave(editTarget.id, payload);
  };

  const editSelectedInvIds = editItems.map((i) => i.inventory).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
      <div className="bg-white rounded-t-sm sm:rounded-sm shadow-2xl w-full sm:max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="h-1 w-full shrink-0" style={{ background: "#FA4900" }} />
        <div className="flex items-center justify-between px-5 py-4 border-b border-black shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Edit Transaction #{editTarget.id}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-[8px] font-bold tracking-widest uppercase text-[#FA4900]">
                  <span className="w-1 h-1 rounded-full bg-[#FA4900] animate-pulse" />
                  <span>Edit Mode</span>
                </span>
                <span className="text-gray-300 text-[8px]">|</span>
                <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest italic">Modify and Update</p>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-sm text-gray-400 hover:text-black hover:bg-gray-100 transition-all shrink-0 active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white sm:border-r border-black">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400 flex items-center gap-2">
                  <span className="w-3 h-0.5 bg-gray-200" />
                  <span>Scanner Terminal</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-black tracking-widest uppercase ${editTxType === "Receive" ? "text-green-600" : "text-gray-300"}`}>Receive</span>
                  <button
                    type="button"
                    onClick={() => setEditTxType(editTxType === "Receive" ? "Sale" : "Receive")}
                    className="relative w-8 h-4 rounded-full bg-slate-100 border border-slate-200 transition-colors duration-200 focus:outline-none"
                  >
                    <div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full shadow-sm transition-transform duration-200 transform ${editTxType === "Sale" ? "translate-x-4 bg-red-600" : "bg-green-600"}`} />
                  </button>
                  <span className={`text-[8px] font-black tracking-widest uppercase ${editTxType === "Sale" ? "text-red-600" : "text-gray-300"}`}>Sale</span>
                </div>
              </div>
              <div className="group relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-focus-within:bg-[#FA4900] transition-colors" />
                </div>
                <input
                  ref={editScanInputRef}
                  type="text"
                  autoComplete="off"
                  autoFocus
                  id="edit-barcode-scan-input"
                  placeholder="SCAN BARCODE..."
                  value={scanInput}
                  onChange={(e) => { setScanInput(e.target.value); setScanFeedback(null); }}
                  onKeyDown={(e) => {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (e.key === "Enter" || e.key === "Tab") {
                      console.log("[Edit Scanner] Input detected:", value);
                      e.preventDefault();
                      if (value !== "") handleScanBarcodeWithValue(value);
                    }
                  }}
                  className="w-full pl-9 pr-12 py-2 rounded-sm border-2 border-black text-sm bg-white text-black outline-none focus:border-[#FA4900] transition-all placeholder:text-gray-300 font-mono tracking-widest uppercase"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
                    <rect x="7" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
                    <rect x="12" y="4" width="2" height="16" rx="0.5" fill="currentColor" />
                    <rect x="18" y="4" width="1" height="16" rx="0.5" fill="currentColor" />
                    <rect x="21" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
                  </svg>
                </div>
              </div>
              {scanFeedback && (
                <p className={`text-[10px] font-bold tracking-widest uppercase px-4 py-2 border flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${scanFeedback.ok ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${scanFeedback.ok ? "bg-green-500" : "bg-red-500"}`} />
                  {scanFeedback.msg}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400 flex items-center gap-2">
                  <span className="w-3 h-0.5 bg-gray-200" />
                  <span>Item Registry</span>
                </p>
                <span className="text-[10px] font-bold text-gray-300 tabular-nums uppercase tracking-widest">{editItems.filter(i => i.inventory > 0).length} Registered</span>
              </div>
              <div className="space-y-2 max-h-62.5 overflow-y-auto custom-scrollbar">
                {editItems.map((item, idx) => {
                  const rec = allEditInventory.find((r) => r.id === item.inventory);
                  return (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-black hover:bg-white transition-all group/item">
                      <div className="w-6 text-[10px] font-black text-gray-300 text-center">{String(idx + 1).padStart(2, "0")}</div>
                      <div className="flex-1 min-w-0">
                        <InventoryPicker
                          inventory={allEditInventory}
                          value={item.inventory}
                          onChange={(id) => updateEditItem(idx, { inventory: id })}
                          excludeIds={editSelectedInvIds}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min={1}
                            placeholder="0"
                            value={item.quantity || ""}
                            onChange={(e) => updateEditItem(idx, { quantity: Math.abs(Number.parseInt(e.target.value) || 0) })}
                            className="w-14 px-2 py-2 rounded-sm border border-black text-sm outline-none focus:ring-1 focus:ring-black transition text-right font-black bg-white"
                          />
                          {rec && (
                            <div className="flex items-center gap-1 ml-1.5 px-1">
                              <span className="text-lg font-black text-gray-200 leading-none">/</span>
                              <span className="text-sm font-black text-gray-400 tabular-nums leading-none">{rec.quantity_on_hand}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEditItem(idx)}
                        disabled={editItems.length === 1}
                        className="p-1.5 rounded-sm text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-0 active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={addEditItem}
                className="w-full py-2.5 bg-white border-2 border-dashed border-slate-100 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase hover:border-black hover:text-black transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Include Entry
              </button>
            </div>
          </div>

          <div className="sm:w-80 shrink-0 flex flex-col bg-slate-50 border-t sm:border-t-0 border-black">
            <div className="px-5 py-4 border-b border-black bg-white">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-900">Receipt</p>
                <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-0 flex flex-col">
              {(() => {
                const filled = editItems.filter((i) => i.inventory > 0 && i.quantity > 0);
                if (filled.length === 0) {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 px-10 text-center gap-4">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                        </svg>
                      </div>
                      <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">Awaiting item registry entries for generation</p>
                    </div>
                  );
                }
                const sign = editTxType === "Receive" ? "+" : "−";
                const valCol = editTxType === "Receive" ? "text-green-600" : "text-red-600";
                const grandTotal = filled.reduce((sum, i) => {
                  const rec = allEditInventory.find((r) => r.id === i.inventory);
                  return sum + (rec ? i.quantity * Number.parseFloat(rec.product_details.cost_per_unit) : 0);
                }, 0);
                return (
                  <div className="divide-y divide-black">
                    <div className="min-h-0 border-b border-black">
                      <table className="w-full">
                        <thead className="bg-slate-100/50">
                          <tr className="border-b border-black">
                            <th className="px-4 py-2 text-left text-[9px] font-black tracking-widest uppercase text-gray-500">Item Details</th>
                            <th className="px-4 py-2 text-right text-[9px] font-black tracking-widest uppercase text-gray-500">Valuation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 bg-white/40">
                          {filled.map((i) => {
                            const rec = allEditInventory.find((r) => r.id === i.inventory);
                            const lineTotal = rec ? i.quantity * Number.parseFloat(rec.product_details.cost_per_unit) : 0;
                            return (
                              <tr key={i.id} className="group/row hover:bg-white transition-colors">
                                <td className="px-4 py-3">
                                  <p className="text-[11px] font-black text-gray-900 leading-tight uppercase truncate max-w-35">{rec?.product_details.product_name ?? "—"}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] font-bold text-gray-400 tabular-nums">{i.quantity} UNIT{i.quantity === 1 ? "" : "S"}</span>
                                    <span className="text-[9px] font-bold text-gray-200">/</span>
                                    <span className="text-[9px] font-bold text-gray-400 truncate">{rec?.site}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right align-top">
                                  <p className={`text-[11px] font-black tabular-nums transition-colors ${valCol}`}>
                                    {sign}${lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-6 bg-white space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Summary Total</p>
                        <span className="text-[10px] font-black text-gray-900 tabular-nums tracking-widest">${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pt-4 border-t-2 border-black flex flex-col items-center gap-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Grand Value</p>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-[12px] font-black ${valCol}`}>{sign}</span>
                          <p className={`text-3xl font-black tabular-nums tracking-tighter ${valCol}`}>
                            ${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="border-t border-black px-5 py-3 shrink-0 space-y-3 bg-gray-50/50">
          {formError && (
            <p className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 rounded-sm px-3 py-2 flex items-center gap-2 uppercase tracking-widest">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {formError}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onClose}
              className="py-2.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition shadow-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="py-2.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-white active:scale-[0.98] transition disabled:opacity-60 shadow-md transform hover:-translate-y-0.5"
              style={{ background: "#FA4900" }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
