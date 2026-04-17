"use client";

import React from "react";
import type { Transaction, TransactionPayload } from "@/src/types/transaction.types";
import type { InventoryRecord } from "@/src/types/inventory.types";
function formatDateTime(ts: string): string {
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const h24 = d.getHours();
  const mins = d.getMinutes();
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  const time = mins === 0 ? `${h12}${ampm}` : `${h12}:${String(mins).padStart(2, "0")}${ampm}`;
  return `${day}/${month}/${year} ${time}`;
}


const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  Receive: { label: "Receive", bg: "bg-green-50", text: "text-green-600", dot: "bg-green-500" },
  Sale: { label: "Sale", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

type ItemDraft = { id: number; inventory: number; quantity: number };

let itemIdCounter = 0;
function getNextItemId() { return ++itemIdCounter; }
const emptyItem = (): ItemDraft => ({ id: getNextItemId(), inventory: 0, quantity: 1 });
import InventoryPicker from "./InventoryPicker";
import { scanBarcode } from "@/src/services/inventory.service";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

// --- CUSTOM HOOKS ------------------------------------------------------------

function useCameraScanner(readerId: string, onScan: (decodedText: string) => Promise<void>) {
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const html5QrCodeRef = React.useRef<Html5Qrcode | null>(null);

  // High-Speed Scanning Control
  const isProcessingRef = React.useRef(false);
  const lastScannedRef = React.useRef<{ code: string; time: number } | null>(null);
  const [lastScanSuccess, setLastScanSuccess] = React.useState(false);

  const stopCamera = async () => {
    const qr = html5QrCodeRef.current;
    if (qr?.isScanning) {
      try {
        await qr.stop();
        qr.clear();
      } catch (e) {
        console.warn("Stop scanner error", e);
      }
    }
    html5QrCodeRef.current = null;
    setIsCameraOpen(false);
  };

  const handleCameraScan = async (decodedText: string) => {
    const now = Date.now();
    const code = decodedText.trim();

    if (isProcessingRef.current) return;

    // Suppression logic: Ignore the same code if scanned less than 2.5s ago
    if (lastScannedRef.current?.code === code && now - lastScannedRef.current.time < 2500) {
      return;
    }

    isProcessingRef.current = true;
    lastScannedRef.current = { code, time: now };

    // Visual trigger
    setLastScanSuccess(true);
    setTimeout(() => setLastScanSuccess(false), 200);

    try {
      await onScan(code);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    // Give DOM a moment to render the #reader div
    setTimeout(async () => {
      try {
        const qr = new Html5Qrcode(readerId, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
        });
        html5QrCodeRef.current = qr;
        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          handleCameraScan,
          () => { } // ignore errors
        );
      } catch (err: any) {
        console.warn("Camera start error:", err);
        setCameraError(err.message || "Could not start camera.");
        setIsCameraOpen(false);
      }
    }, 100);
  };

  const toggleCamera = () => {
    if (isCameraOpen) stopCamera();
    else startCamera();
  };

  return {
    isCameraOpen,
    cameraError,
    lastScanSuccess,
    toggleCamera,
    stopCamera,
  };
}

// ─── ViewTransactionModal ───────────────────────────────────────────────────

type ViewModalProps = {
  viewTarget: Transaction | null;
  onClose: () => void;
  inventory: InventoryRecord[];
};

export const ViewTransactionModal: React.FC<ViewModalProps> = ({ viewTarget, onClose, inventory }) => {
  if (!viewTarget) return null;

  const totalQuantity = viewTarget.items.reduce((sum, i) => sum + Math.abs(i.quantity), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
      <button className="absolute inset-0 bg-black/20 backdrop-blur-sm cursor-default" onClick={onClose} aria-label="Close modal" />
      <div className="relative bg-white rounded-t-md sm:rounded-sm shadow-2xl w-full sm:max-w-xl flex flex-col max-h-[90vh] overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-black shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Transaction #{viewTarget.id}</h2>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium" suppressHydrationWarning>{formatDateTime(viewTarget.transaction_date)}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-sm text-gray-400 hover:text-black hover:bg-gray-100 transition-all shrink-0 active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white min-h-0">
          {/* Meta */}
          <div className="flex items-center gap-3">
            {(() => {
              const cfg = TYPE_CONFIG[viewTarget.transaction_type];
              return (
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                  {cfg.label}
                </span>
              );
            })()}
            <span className="text-[10px] text-gray-400 font-medium">by <span className="font-black text-gray-700">{viewTarget.performed_by_username}</span></span>
          </div>

          {/* Item table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-800 flex items-center gap-2">
                <span className="w-3 h-0.5 bg-gray-200" />{" "}
                Item Registry
              </p>
              <span className="text-[10px] font-bold text-gray-400 tabular-nums uppercase tracking-widest">
                {viewTarget.items.length} ITEMS
              </span>
            </div>
            <div className="border border-black overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-4 px-3 py-2 bg-slate-50 border-b border-black">
                <span className="hidden sm:inline-block w-5 shrink-0 text-[10px] font-black text-gray-700 tracking-widest text-center">N0</span>
                <span className="flex-1 sm:w-64 sm:shrink-0 text-[10px] font-black text-gray-700 uppercase tracking-widest text-left">Product</span>
                <span className="w-28 shrink-0 text-[10px] font-black text-gray-700 uppercase tracking-widest">Barcode</span>
                <span className="w-16 sm:w-24 shrink-0 text-[10px] font-black text-gray-700 uppercase tracking-widest text-right">Quantity</span>
              </div>
              <div className="divide-y divide-black/10">
                {viewTarget.items.map((item, idx) => {
                  const rec = inventory.find((r) => r.id === item.inventory);
                  return (
                    <div key={item.id} className="flex items-center gap-1 sm:gap-4 px-3 py-2.5 hover:bg-slate-50/60 transition-colors">
                      <span className="hidden sm:inline-block w-5 shrink-0 text-[10px] font-black text-gray-300 text-center">{String(idx + 1).padStart(2, "0")}</span>
                      <div className="flex-1 sm:w-64 sm:shrink-0 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.product_name}</p>
                      </div>
                      <div className="w-28 shrink-0 min-w-0">
                        <span className="text-[11px] font-mono text-gray-800 truncate block">{rec?.product_details.barcode ?? "—"}</span>
                      </div>
                      <div className="w-16 sm:w-24 shrink-0 text-right">
                        <span className="text-sm font-black text-gray-900 tabular-nums">{Math.abs(item.quantity)}</span>
                      </div>
                    </div>
                  );
                })
                }</div>
            </div>
            <div className="border border-black border-t-0 bg-slate-50">
              <div className="grid grid-cols-2 divide-x divide-black/10">
                <div className="flex flex-col items-center justify-center py-2 gap-0.5">
                  <span className="text-[8px] font-black tracking-[0.2em] uppercase text-gray-400">Items</span>
                  <span className="text-[15px] font-black tabular-nums text-gray-900 leading-none">{viewTarget.items.length}</span>
                </div>
                <div className="flex flex-col items-center justify-center py-2 gap-0.5">
                  <span className="text-[8px] font-black tracking-[0.2em] uppercase text-gray-400">Quantities</span>
                  <span className="text-[15px] font-black tabular-nums text-gray-900 leading-none">{totalQuantity}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-black px-5 py-3 shrink-0 bg-gray-50/50 flex justify-end">
          <button type="button" onClick={onClose}
            className="w-30 py-1.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition cursor-pointer">
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
      <button className="absolute inset-0 bg-black/20 backdrop-blur-sm cursor-default" onClick={onClose} aria-label="Close modal" />
      <div className="relative bg-white rounded-t-md sm:rounded-md shadow-2xl w-full sm:max-w-sm overflow-hidden">

        <div className="px-5 py-5">
          <p className="text-[13px] font-bold text-gray-800">
            Are you sure to delete Transaction{" "}
            <span className="font-black text-black">#{deleteTarget.id}</span>?
          </p>
          <p className="text-[11px] text-gray-500 mt-1">This action cannot be undone. All details of this transaction will be permanently removed.</p>
        </div>
        <div className="border-t border-black px-5 py-3 bg-gray-50/50 flex justify-end gap-2">
          <button onClick={onClose} disabled={deleting}
            className="w-20 py-1.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition disabled:opacity-60 shadow-sm">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="w-20 py-1.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-white bg-red-500 hover:bg-red-600 active:scale-[0.98] transition disabled:opacity-60 shadow-md">
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
  const [txType, setTxType] = React.useState<"Receive" | "Sale">("Sale");
  const [items, setItems] = React.useState<ItemDraft[]>([emptyItem()]);
  const [scanInput, setScanInput] = React.useState("");
  const [scanFeedback, setScanFeedback] = React.useState<{ ok: boolean; msg: string } | null>(null);
  const scanInputRef = React.useRef<HTMLInputElement>(null);
  const [extraRecords, setExtraRecords] = React.useState<InventoryRecord[]>([]);

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

      const productName = scanRes.product?.product_name || targetRecord.product_details?.product_name || "Unknown";

      let alreadyExists = false;
      setItems((prev) => {
        const currentItems = [...prev];
        const existingIdx = currentItems.findIndex((i) => i.inventory === invId);

        if (existingIdx >= 0) {
          alreadyExists = true;
          return currentItems;
        }

        const emptyIdx = currentItems.findIndex((i) => i.inventory === 0);
        if (emptyIdx >= 0) {
          return currentItems.map((item, i) =>
            i === emptyIdx ? { ...item, inventory: invId, quantity: 1 } : item
          );
        }

        return [...currentItems, { id: getNextItemId(), inventory: invId, quantity: 1 }];
      });

      if (alreadyExists) {
        setScanFeedback({ ok: true, msg: `${productName} is already in the list` });
      } else {
        setScanFeedback({ ok: true, msg: `Added: ${productName} (${targetRecord.site})` });
      }
    } catch (err: any) {
      console.error("Unexpected scan error:", err);
      setScanFeedback({ ok: false, msg: `System Error: Unable to scan "${q}"` });
    }
  };

  // Combined inventory sources: the prop-provided paginated list + any missing items fetched via scanning
  const allInventory = React.useMemo(() => {
    const merged = [...inventory];
    for (const er of extraRecords) {
      if (!merged.some(r => r.id === er.id)) merged.push(er);
    }
    return merged;
  }, [inventory, extraRecords]);

  const {
    isCameraOpen,
    cameraError,
    lastScanSuccess,
    toggleCamera,
    stopCamera
  } = useCameraScanner("reader-new", handleScanBarcodeWithValue);

  React.useEffect(() => {
    if (isOpen) {
      // Focus after a tiny delay to ensure the modal is visible
      setTimeout(() => scanInputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      setTxType("Sale");
      setItems([emptyItem()]);
      setScanInput("");
      setScanFeedback(null);
      setExtraRecords([]); // Clear cache on close
      if (stopCamera) stopCamera();
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
      <button className="absolute inset-0 bg-black/20 backdrop-blur-sm cursor-default" onClick={onClose} aria-label="Close modal" />
      <div className="relative bg-white rounded-t-md sm:rounded-sm shadow-2xl w-full sm:max-w-xl flex flex-col max-h-[90vh] overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-black shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">New Transaction</h2>

            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-sm text-gray-400 hover:text-black hover:bg-gray-100 transition-all shrink-0 active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white min-h-0">
          {/* Scanner Terminal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-black tracking-[0.2em] uppercase text-gray-400 flex items-center gap-2">
                <span className="w-3 h-0.5 bg-gray-200" />
                <span className="text-gray-800">Scanner</span>
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-[12px] font-black tracking-widest uppercase ${txType === "Receive" ? "text-green-600" : "text-gray-300"}`}>Receive</span>
                <button
                  type="button"
                  onClick={() => setTxType(txType === "Receive" ? "Sale" : "Receive")}
                  className={`relative w-10 h-5 rounded-full border transition-colors duration-200 focus:outline-none cursor-pointer ${txType === "Sale" ? "bg-red-100 border-red-300" : "bg-green-100 border-green-300"}`}
                >
                  <div className={`absolute top-1 left-1 w-2.5 h-2.5 rounded-full shadow-sm transition-transform duration-200 transform ${txType === "Sale" ? "translate-x-5 bg-red-600" : "translate-x-0 bg-green-600"}`} />
                </button>
                <span className={`text-[12px] font-black tracking-widest uppercase ${txType === "Sale" ? "text-red-600" : "text-gray-300"}`}>Sale</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="group relative flex-1">
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
                      e.preventDefault();
                      if (value !== "") handleScanBarcodeWithValue(value);
                    }
                  }}
                  className="w-full pl-9 pr-12 py-1.5 rounded-sm border-2 border-black text-[12px] bg-white text-black outline-none focus:border-[#FA4900] transition-all placeholder:text-gray-300 font-mono tracking-widest uppercase"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
                    <rect x="7" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
                    <rect x="12" y="4" width="2" height="16" rx="0.5" fill="currentColor" />
                    <rect x="18" y="4" width="1" height="16" rx="0.5" fill="currentColor" />
                    <rect x="21" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
                  </svg>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleCamera}
                className={`shrink-0 p-2 rounded-sm transition-all shadow-md group/cam ${isCameraOpen ? "bg-red-600 text-white" : "bg-black text-white hover:bg-gray-800 active:scale-95"}`}
                title={isCameraOpen ? "Close Camera" : "Open Camera Scanner"}
              >
                {isCameraOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 group-hover/cam:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                )}
              </button>
            </div>

            {isCameraOpen && (
              <div className={`relative w-full aspect-4/3 bg-black rounded-sm overflow-hidden border-2 transition-colors duration-200 animate-in fade-in zoom-in-95 ${lastScanSuccess ? "border-green-500" : "border-black"}`}>
                <div id="reader-new" className="w-full h-full" />
                {lastScanSuccess && <div className="absolute inset-0 bg-green-500/10 pointer-events-none animate-pulse" />}
                <div className="absolute inset-0 pointer-events-none border-40 border-black/30" />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-32 border-2 border-orange-500 rounded-sm shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                    <div className="w-full h-px bg-orange-500/50 animate-[scanline_2s_linear_infinite]" />
                  </div>
                </div>
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[8px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span>Live Stream</span>
                </div>
              </div>
            )}

            {cameraError && (
              <p className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {cameraError}
              </p>
            )}
            {scanFeedback && (
              <p className={`text-[10px] font-bold tracking-widest uppercase px-4 py-2 border flex items-center gap-2 ${scanFeedback.ok ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${scanFeedback.ok ? "bg-green-500" : "bg-red-500"}`} />
                {scanFeedback.msg}
              </p>
            )}
          </div>

          {/* Merged Item Registry + Receipt */}
          <div>

            <div className="border border-black overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-1 sm:gap-4 px-2 py-2 bg-slate-50 border-b border-black">
                <span className="hidden sm:inline-block w-5 shrink-0 text-[12px] font-black text-gray-700 text-center">N0</span>
                <span className="flex-1 sm:w-64 sm:shrink-0 text-[12px] font-black text-gray-700">Product</span>
                <span className="w-28 shrink-0 text-[12px] font-black text-gray-700">Barcode</span>
                <span className="w-16 sm:w-24 shrink-0 text-[12px] font-black text-gray-700 text-left sm:pr-2">Quantity</span>
                <span className="w-5 shrink-0" />
              </div>
              {/* Rows */}
              <div className="divide-y divide-black/10">
                {items.map((item, idx) => {
                  const rec = allInventory.find((r) => r.id === item.inventory);
                  return (
                    <div key={item.id} className="p-3 sm:p-0 sm:px-2 sm:py-1.5 hover:bg-slate-50/60 transition-colors group/item relative">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        {/* N0 - desktop only */}
                        <span className="hidden sm:inline-block w-5 shrink-0 text-[10px] font-black text-gray-300 text-center">{String(idx + 1).padStart(2, "0")}</span>
                        {/* Product */}
                        <div className="flex-1 sm:w-64 sm:shrink-0 min-w-0">
                          <InventoryPicker
                            inventory={allInventory}
                            value={item.inventory}
                            onChange={(id) => updateItem(idx, { inventory: id, quantity: item.quantity || 1 })}
                            excludeIds={selectedInvIds}
                          />
                        </div>
                        {/* Mobile: barcode info line */}
                        <div className="sm:hidden flex items-center gap-2 text-[10px] font-mono text-gray-500">
                          <span className="font-black text-[8px] uppercase tracking-tighter text-gray-400">BC:</span>
                          <span className="truncate block">{rec?.product_details.barcode ?? "—"}</span>
                        </div>
                        {/* Barcode - desktop only */}
                        <div className="hidden sm:block w-28 shrink-0 min-w-0">
                          <span className="text-[11px] font-mono text-gray-700 truncate block">{rec?.product_details.barcode ?? "—"}</span>
                        </div>
                        {/* Quantity controls */}
                        <div className="flex items-center justify-between sm:justify-start gap-3 sm:w-24 sm:shrink-0 mt-1 sm:mt-0">
                          <span className="sm:hidden text-[9px] font-black uppercase text-gray-400">Quantity</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateItem(idx, { quantity: Math.max(1, (item.quantity || 1) - 1) })}
                              className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded-sm bg-slate-100 text-gray-500 hover:bg-black hover:text-white transition-all active:scale-90"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                              </svg>
                            </button>
                            <div className="w-10 flex items-center justify-center px-1 py-1 rounded-sm border focus-within:border-black bg-slate-50 focus-within:bg-white transition-all">
                              <input
                                type="number"
                                min={1}
                                placeholder="1"
                                value={item.quantity || ""}
                                onChange={(e) => updateItem(idx, { quantity: Math.abs(Number.parseInt(e.target.value) || 0) })}
                                className="w-full bg-transparent outline-none text-[12px] sm:text-[10px] font-black tabular-nums text-center placeholder:text-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => updateItem(idx, { quantity: (item.quantity || 1) + 1 })}
                              className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded-sm bg-slate-100 text-gray-500 hover:bg-black hover:text-white transition-all active:scale-90"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {/* Remove */}
                        <div className="absolute top-3 right-3 sm:static sm:w-5 sm:shrink-0">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-1.5 sm:p-1 rounded-sm text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
                          >
                            <svg className="w-4 h-4 sm:w-3 sm:h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={addItem}
                className="w-full py-2.5 bg-white border-t border-dashed border-slate-200 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase hover:bg-slate-50 hover:text-black transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Include Entry
              </button>
            </div>
            {(() => {
              const filled = items.filter((i) => i.inventory > 0 && i.quantity > 0);
              if (filled.length === 0) return null;
              const totalQuantity = filled.reduce((sum, i) => sum + i.quantity, 0);
              return (
                <div className="border border-black border-t-0 bg-slate-50">
                  <div className="grid grid-cols-2 divide-x divide-black/10 border-b border-black/10">
                    <div className="flex flex-col items-center justify-center py-2 gap-0.5">
                      <span className="text-[8px] font-black tracking-[0.2em] uppercase text-gray-400">Items</span>
                      <span className="text-[15px] font-black tabular-nums text-gray-900 leading-none">{filled.length}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-2 gap-0.5">
                      <span className="text-[8px] font-black tracking-[0.2em] uppercase text-gray-400">Quantities</span>
                      <span className="text-[15px] font-black tabular-nums text-gray-900 leading-none">{totalQuantity}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="border-t border-black px-5 py-3 shrink-0 space-y-3 bg-gray-50/50">
          {formError && (
            <p className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 rounded-sm px-3 py-1 flex items-center gap-2 uppercase tracking-widest">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="w-30 py-1.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition cursor-pointer">
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={saving}
              className="px-8 py-1.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-white bg-black active:scale-[0.98] transition disabled:opacity-60 shadow-lg transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center"
            >
              {saving ? "Creating..." : "Create"}
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

      const productName = scanRes.product?.product_name || targetRecord.product_details?.product_name || "Unknown";

      let alreadyExists = false;
      setEditItems((prev) => {
        const currentItems = [...prev];
        const existingIdx = currentItems.findIndex((i) => i.inventory === invId);

        if (existingIdx >= 0) {
          alreadyExists = true;
          return currentItems;
        }

        const emptyIdx = currentItems.findIndex((i) => i.inventory === 0);
        if (emptyIdx >= 0) {
          return currentItems.map((item, i) =>
            i === emptyIdx ? { ...item, inventory: invId, quantity: 1 } : item
          );
        }

        return [...currentItems, { id: getNextItemId(), inventory: invId, quantity: 1 }];
      });

      if (alreadyExists) {
        setScanFeedback({ ok: true, msg: `${productName} is already in the list` });
      } else {
        setScanFeedback({ ok: true, msg: `Added: ${productName} (${targetRecord.site})` });
      }
    } catch (err: any) {
      console.error("Unexpected scan error:", err);
      setScanFeedback({ ok: false, msg: `System Error: Unable to scan "${q}"` });
    }
  };

  const allEditInventory = React.useMemo(() => {
    const merged = [...inventory];
    for (const er of extraRecords) {
      if (!merged.some(r => r.id === er.id)) merged.push(er);
    }
    return merged;
  }, [inventory, extraRecords]);

  const {
    isCameraOpen,
    cameraError,
    lastScanSuccess,
    toggleCamera,
    stopCamera
  } = useCameraScanner("reader-edit", handleScanBarcodeWithValue);

  React.useEffect(() => {
    if (editTarget) {
      setTimeout(() => editScanInputRef.current?.focus(), 150);
      setEditTxType(editTarget.transaction_type);
      setEditItems(editTarget.items.map((item) => ({
        id: getNextItemId(),
        inventory: item.inventory,
        quantity: Math.abs(item.quantity),
      })));
    } else {
      setEditTxType("Receive");
      setEditItems([emptyItem()]);
      setScanInput("");
      setScanFeedback(null);
      setExtraRecords([]);
      if (stopCamera) stopCamera();
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
      <button className="absolute inset-0 bg-black/20 backdrop-blur-sm cursor-default" onClick={onClose} aria-label="Close modal" />
      <div className="relative bg-white rounded-t-md sm:rounded-sm shadow-2xl w-full sm:max-w-xl flex flex-col max-h-[90vh] overflow-hidden">

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
                  <span className="w-1 h-1 rounded-full bg-[#FA4900] animate-pulse" />{" "}
                  Edit Mode
                </span>
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

        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white min-h-0">
          {/* Scanner Terminal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400 flex items-center gap-2">
                <span className="w-3 h-0.5 bg-gray-200" />
                <span className="text-gray-800">Scanner Terminal</span>
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black tracking-widest uppercase ${editTxType === "Receive" ? "text-green-600" : "text-gray-300"}`}>Receive</span>
                <button
                  type="button"
                  onClick={() => setEditTxType(editTxType === "Receive" ? "Sale" : "Receive")}
                  className="relative w-8 h-4 rounded-full bg-slate-100 border border-slate-200 transition-colors duration-200 focus:outline-none"
                >
                  <div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full shadow-sm transition-transform duration-200 transform ${editTxType === "Sale" ? "translate-x-4 bg-red-600" : "bg-green-600"}`} />
                </button>
                <span className={`text-[10px] font-black tracking-widest uppercase ${editTxType === "Sale" ? "text-red-600" : "text-gray-300"}`}>Sale</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="group relative flex-1">
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
                      e.preventDefault();
                      if (value !== "") handleScanBarcodeWithValue(value);
                    }
                  }}
                  className="w-full pl-9 pr-12 py-1.5 rounded-sm border-2 border-black text-[12px] bg-white text-black outline-none focus:border-[#FA4900] transition-all placeholder:text-gray-300 font-mono tracking-widest uppercase"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
                    <rect x="7" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
                    <rect x="12" y="4" width="2" height="16" rx="0.5" fill="currentColor" />
                    <rect x="18" y="4" width="1" height="16" rx="0.5" fill="currentColor" />
                    <rect x="21" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
                  </svg>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleCamera}
                className={`shrink-0 p-2 rounded-sm transition-all shadow-md group/cam ${isCameraOpen ? "bg-red-600 text-white" : "bg-black text-white hover:bg-gray-800 active:scale-95"}`}
                title={isCameraOpen ? "Close Camera" : "Open Camera Scanner"}
              >
                {isCameraOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 group-hover/cam:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                )}
              </button>
            </div>

            {isCameraOpen && (
              <div className={`relative w-full aspect-4/3 bg-black rounded-sm overflow-hidden border-2 transition-colors duration-200 animate-in fade-in zoom-in-95 ${lastScanSuccess ? "border-green-500" : "border-black"}`}>
                <div id="reader-edit" className="w-full h-full" />
                {lastScanSuccess && <div className="absolute inset-0 bg-green-500/10 pointer-events-none animate-pulse" />}
                <div className="absolute inset-0 pointer-events-none border-40 border-black/30" />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-32 border-2 border-orange-500 rounded-sm shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                    <div className="w-full h-px bg-orange-500/50 animate-[scanline_2s_linear_infinite]" />
                  </div>
                </div>
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[8px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span>Live Stream</span>
                </div>
              </div>
            )}

            {cameraError && (
              <p className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {cameraError}
              </p>
            )}

            {scanFeedback && (
              <p className={`text-[10px] font-bold tracking-widest uppercase px-4 py-2 border flex items-center gap-2 ${scanFeedback.ok ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${scanFeedback.ok ? "bg-green-500" : "bg-red-500"}`} />
                {scanFeedback.msg}
              </p>
            )}
          </div>

          {/* Merged Item Registry + Receipt */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-800 flex items-center gap-2">
                <span className="w-3 h-0.5 bg-gray-200" />{" "}
                Item Registry
              </p>
              <span className="text-[10px] font-bold text-gray-400 tabular-nums uppercase tracking-widest">
                {editItems.filter(i => i.inventory > 0).length} ITEMS
              </span>
            </div>
            <div className="border border-black overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-2 px-3 py-2 bg-slate-50 border-b border-black">
                <span className="hidden sm:inline-block w-5 shrink-0 text-[10px] font-black text-gray-700 tracking-widest text-center">N0</span>
                <span className="flex-1 sm:w-64 sm:shrink-0 text-[10px] font-black text-gray-700 uppercase tracking-widest">Product</span>
                <span className="w-28 shrink-0 text-[10px] font-black text-gray-700 uppercase tracking-widest">Barcode</span>
                <span className="w-16 sm:w-24 shrink-0 text-[10px] font-black text-gray-700 uppercase tracking-widest text-right">Quantity</span>
                <span className="w-5 shrink-0" />
              </div>
              <div className="divide-y divide-black/10">
                {editItems.map((item, idx) => {
                  const rec = allEditInventory.find((r) => r.id === item.inventory);
                  return (
                    <div key={item.id} className="p-3 sm:p-0 sm:px-2 sm:py-1.5 hover:bg-slate-50/60 transition-colors group/item relative">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        {/* N0 - desktop only */}
                        <span className="hidden sm:inline-block w-5 shrink-0 text-[10px] font-black text-gray-300 text-center">{String(idx + 1).padStart(2, "0")}</span>
                        {/* Product */}
                        <div className="flex-1 sm:w-64 sm:shrink-0 min-w-0">
                          <InventoryPicker
                            inventory={allEditInventory}
                            value={item.inventory}
                            onChange={(id) => updateEditItem(idx, { inventory: id, quantity: item.quantity || 1 })}
                            excludeIds={editSelectedInvIds}
                          />
                        </div>
                        {/* Mobile: barcode info line */}
                        <div className="sm:hidden flex items-center gap-2 text-[10px] font-mono text-gray-500">
                          <span className="font-black text-[8px] uppercase tracking-tighter text-gray-400">BC:</span>
                          <span className="truncate block">{rec?.product_details.barcode ?? "—"}</span>
                        </div>
                        {/* Barcode - desktop only */}
                        <div className="hidden sm:block w-28 shrink-0 min-w-0">
                          <span className="text-[11px] font-mono text-gray-700 truncate block">{rec?.product_details.barcode ?? "—"}</span>
                        </div>
                        {/* Quantity controls */}
                        <div className="flex items-center justify-between sm:justify-start gap-3 sm:w-24 sm:shrink-0 mt-1 sm:mt-0">
                          <span className="sm:hidden text-[9px] font-black uppercase text-gray-400">Quantity</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateEditItem(idx, { quantity: Math.max(1, (item.quantity || 1) - 1) })}
                              className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded-sm bg-slate-100 text-gray-500 hover:bg-black hover:text-white transition-all active:scale-90"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                              </svg>
                            </button>
                            <div className="w-10 flex items-center justify-center px-1 py-1 rounded-sm border focus-within:border-black bg-slate-50 focus-within:bg-white transition-all">
                              <input
                                type="number"
                                min={1}
                                placeholder="1"
                                value={item.quantity || ""}
                                onChange={(e) => updateEditItem(idx, { quantity: Math.abs(Number.parseInt(e.target.value) || 0) })}
                                className="w-full bg-transparent outline-none text-[12px] sm:text-[10px] font-black tabular-nums text-center placeholder:text-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => updateEditItem(idx, { quantity: (item.quantity || 1) + 1 })}
                              className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded-sm bg-slate-100 text-gray-500 hover:bg-black hover:text-white transition-all active:scale-90"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {/* Remove */}
                        <div className="absolute top-3 right-3 sm:static sm:w-5 sm:shrink-0">
                          <button
                            type="button"
                            onClick={() => removeEditItem(idx)}
                            className="p-1.5 sm:p-1 rounded-sm text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
                          >
                            <svg className="w-4 h-4 sm:w-3 sm:h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={addEditItem}
                className="w-full py-2.5 bg-white border-t border-dashed border-slate-200 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase hover:bg-slate-50 hover:text-black transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Include Entry
              </button>
            </div>
            {(() => {
              const filled = editItems.filter((i) => i.inventory > 0 && i.quantity > 0);
              if (filled.length === 0) return null;
              const totalQty = filled.reduce((sum, i) => sum + i.quantity, 0);
              return (
                <div className="border border-black border-t-0 bg-slate-50">
                  <div className="grid grid-cols-2 divide-x divide-black/10">
                    <div className="flex flex-col items-center justify-center py-2 gap-0.5">
                      <span className="text-[8px] font-black tracking-[0.2em] uppercase text-gray-400">Items</span>
                      <span className="text-[15px] font-black tabular-nums text-gray-900 leading-none">{filled.length}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-2 gap-0.5">
                      <span className="text-[8px] font-black tracking-[0.2em] uppercase text-gray-400">Quantities</span>
                      <span className="text-[15px] font-black tabular-nums text-gray-900 leading-none">{totalQty}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
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
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="w-30 py-1.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition cursor-pointer">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-8 py-1.5 rounded-sm text-[11px] font-black tracking-widest uppercase text-white bg-black active:scale-[0.98] transition disabled:opacity-60 shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
            >
              {saving ? "Updating..." : "Update Transaction"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

