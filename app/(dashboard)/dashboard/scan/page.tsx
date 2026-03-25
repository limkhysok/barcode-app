"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { scanBarcode } from "@/src/services/inventory.service";
import { createTransaction, getTransactions } from "@/src/services/transaction.service";
import type { ScanResult, InventoryRecord } from "@/src/types/inventory.types";
import type { Transaction } from "@/src/types/transaction.types";

type TxType = "Receive" | "Sale";
type SubmitStatus = { kind: "success" | "error"; msg: string } | null;

// ── Top-level helpers ────────────────────────────────────────────────────────

function parseCameraError(err: unknown): string {
    const msg = err instanceof Error ? err.message : "Camera error";
    if (msg.toLowerCase().includes("permission"))
        return "Camera permission denied. Please allow camera access in your browser settings.";
    return "Camera unavailable. Make sure no other app is using it.";
}

function parseLookupError(err: unknown): string {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return "No product found for this barcode.";
    if (status === 400) return "Invalid barcode value.";
    return "Lookup failed. Please try again.";
}

function extractApiError(err: unknown): string {
    const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
    return detail ?? "Failed to create transaction. Please try again.";
}

// ── Sub-components ───────────────────────────────────────────────────────────

function CameraIdleOverlay({ cameraError, onStart }: Readonly<{ cameraError: string | null; onStart: () => void }>) {
    if (cameraError) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-950">
                <div className="w-14 h-14 rounded-full bg-red-900/40 flex items-center justify-center">
                    <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <p className="text-sm text-red-300 text-center max-w-xs px-4">{cameraError}</p>
                <button onClick={onStart} className="px-5 py-2 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition">
                    Try Again
                </button>
            </div>
        );
    }
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-950">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
            </div>
            <p className="text-white/60 text-sm">Camera is off</p>
            <button
                onClick={onStart}
                className="px-6 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition"
                style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}
            >
                Start Scanning
            </button>
        </div>
    );
}

function TransactionForm({ inventory, selectedInventory, txType, quantity, submitting, onSelectInventory, onTxType, onQuantity, onSubmit }: Readonly<{
    inventory: InventoryRecord[];
    selectedInventory: InventoryRecord | null;
    txType: TxType;
    quantity: string;
    submitting: boolean;
    onSelectInventory: (inv: InventoryRecord) => void;
    onTxType: (t: TxType) => void;
    onQuantity: (q: string) => void;
    onSubmit: (e: React.SyntheticEvent) => void;
}>) {
    const qtyInvalid = !quantity || Number.parseInt(quantity, 10) <= 0;
    const canSubmit = !!selectedInventory && !qtyInvalid && !submitting;
    const txLabel = txType === "Receive" ? "Stock In" : "Stock Out";

    return (
        <form onSubmit={onSubmit} className="p-5 space-y-4">
            {/* Multi-site picker */}
            {inventory.length > 1 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold tracking-widest uppercase text-gray-500">Select Site / Location</p>
                    <div className="space-y-2">
                        {inventory.map((inv) => {
                            const sel = selectedInventory?.id === inv.id;
                            return (
                                <button key={inv.id} type="button" onClick={() => onSelectInventory(inv)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition ${sel ? "border-[#FA4900] bg-orange-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                                    <div className="text-left">
                                        <p className={`font-semibold ${sel ? "text-[#FA4900]" : "text-gray-800"}`}>{inv.site}</p>
                                        <p className="text-xs text-gray-400">{inv.location}</p>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                        <p className={`text-sm font-black ${inv.quantity_on_hand > 0 ? "text-green-600" : "text-red-500"}`}>{inv.quantity_on_hand}</p>
                                        <p className="text-[10px] text-gray-400">on hand</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Auto-selected single site */}
            {inventory.length === 1 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div>
                        <p className="text-xs font-bold text-gray-700">{inventory[0].site}</p>
                        <p className="text-xs text-gray-400">{inventory[0].location}</p>
                    </div>
                    <div className="text-right">
                        <p className={`text-sm font-black ${inventory[0].quantity_on_hand > 0 ? "text-green-600" : "text-red-500"}`}>
                            {inventory[0].quantity_on_hand}
                        </p>
                        <p className="text-[10px] text-gray-400">units on hand</p>
                    </div>
                </div>
            )}

            {/* Type toggle */}
            <div className="space-y-1.5">
                <p className="text-xs font-bold tracking-widest uppercase text-gray-500">Transaction Type</p>
                <fieldset className="flex rounded-xl border border-gray-200 overflow-hidden p-0 m-0">
                    <legend className="sr-only">Transaction type</legend>
                    <button type="button" onClick={() => onTxType("Receive")} className="flex-1 py-2.5 text-sm font-semibold transition"
                        style={txType === "Receive" ? { background: "linear-gradient(135deg, #FA4900, #b91c1c)", color: "#fff" } : { background: "#f9fafb", color: "#6b7280" }}>
                        ↑ Stock In
                    </button>
                    <button type="button" onClick={() => onTxType("Sale")} className="flex-1 py-2.5 text-sm font-semibold transition"
                        style={txType === "Sale" ? { background: "linear-gradient(135deg, #1d4ed8, #1e40af)", color: "#fff" } : { background: "#f9fafb", color: "#6b7280" }}>
                        ↓ Stock Out
                    </button>
                </fieldset>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
                <label htmlFor="scan-quantity" className="text-xs font-bold tracking-widest uppercase text-gray-500">Quantity</label>
                <input
                    id="scan-quantity"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => onQuantity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-lg font-bold text-gray-900 outline-none focus:ring-2 focus:border-transparent transition text-center"
                    style={{ "--tw-ring-color": "#FA4900" } as React.CSSProperties}
                />
            </div>

            {/* Submit */}
            <button type="submit" disabled={!canSubmit}
                className="w-full py-3 rounded-xl text-white text-sm font-bold tracking-widest uppercase hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}>
                {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Saving…</span>
                    </span>
                ) : `Confirm ${txLabel}`}
            </button>
        </form>
    );
}

function ScanResultPanel({ result, scanLoading, scanError, scannedBarcode, selectedInventory, txType, quantity, submitting, onSelectInventory, onTxType, onQuantity, onSubmit, onReset }: Readonly<{
    result: ScanResult | null;
    scanLoading: boolean;
    scanError: string | null;
    scannedBarcode: string;
    selectedInventory: InventoryRecord | null;
    txType: TxType;
    quantity: string;
    submitting: boolean;
    onSelectInventory: (inv: InventoryRecord) => void;
    onTxType: (t: TxType) => void;
    onQuantity: (q: string) => void;
    onSubmit: (e: React.SyntheticEvent) => void;
    onReset: () => void;
}>) {
    if (scanLoading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center gap-3">
                <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: "#FA4900", borderTopColor: "transparent" }} />
                <p className="text-sm font-medium text-gray-600">Looking up barcode…</p>
                <p className="text-xs font-mono text-gray-400 bg-gray-50 px-3 py-1 rounded-lg">{scannedBarcode}</p>
            </div>
        );
    }

    if (scanError) {
        return (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-red-800">Barcode Not Recognised</p>
                    <p className="text-xs text-red-600 mt-0.5">{scanError}</p>
                    <p className="text-xs font-mono text-red-400 mt-1.5 bg-red-100 px-2 py-0.5 rounded inline-block">{scannedBarcode}</p>
                </div>
                <button onClick={onReset} className="text-xs text-red-400 hover:text-red-600 font-medium transition shrink-0">✕ Clear</button>
            </div>
        );
    }

    if (result) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Product banner */}
                <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ background: "linear-gradient(135deg,#fff7f4,#fff)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
                        style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Product Found</p>
                        <p className="text-base font-bold text-gray-900 truncate">{result.product?.product_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {result.product?.category}
                            <span className="mx-1.5 text-gray-300">·</span>
                            <span className="font-mono">{result.product?.barcode}</span>
                        </p>
                    </div>
                    <button onClick={onReset} className="text-xs text-gray-400 hover:text-gray-600 font-medium transition shrink-0">✕ Clear</button>
                </div>

                {result.found ? (
                    <TransactionForm
                        inventory={result.inventory}
                        selectedInventory={selectedInventory}
                        txType={txType}
                        quantity={quantity}
                        submitting={submitting}
                        onSelectInventory={onSelectInventory}
                        onTxType={onTxType}
                        onQuantity={onQuantity}
                        onSubmit={onSubmit}
                    />
                ) : (
                    <div className="flex items-start gap-3 px-5 py-5">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-800">Not in Inventory</p>
                            <p className="text-xs text-amber-600 mt-0.5">This product has no inventory record. Add it in the Inventory section first.</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center gap-3 text-gray-400">
            <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75V16.5zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
            <p className="text-sm font-medium">Scan a barcode to begin</p>
        </div>
    );
}

function SubmitStatusBanner({ status, onDismiss }: Readonly<{ status: SubmitStatus; onDismiss: () => void }>) {
    if (!status) return null;
    const ok = status.kind === "success";
    return (
        <div className={`rounded-2xl border p-5 flex items-start gap-3 ${ok ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ok ? "bg-green-500" : "bg-red-500"}`}>
                {ok ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )}
            </div>
            <div className="flex-1">
                <p className={`text-sm font-bold ${ok ? "text-green-800" : "text-red-800"}`}>
                    {ok ? "Transaction Recorded!" : "Transaction Failed"}
                </p>
                <p className={`text-xs mt-0.5 ${ok ? "text-green-600" : "text-red-600"}`}>{status.msg}</p>
            </div>
            {ok && (
                <button onClick={onDismiss} className="shrink-0 text-xs font-bold text-green-700 hover:text-green-900 transition">
                    Scan Next →
                </button>
            )}
        </div>
    );
}

const TYPE_CFG = {
    Receive: { bg: "bg-green-50", text: "text-green-600", dot: "bg-green-500" },
    Sale:    { bg: "bg-red-50",   text: "text-red-600",   dot: "bg-red-500"   },
};

function fmtDate(ts: string) {
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
function fmtTime(ts: string) {
    return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function RecentTransactionsPanel({ transactions, loading }: Readonly<{ transactions: Transaction[]; loading: boolean }>) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                <div>
                    <h2 className="text-sm font-bold text-gray-800">Recent Transactions</h2>
                    <p className="text-xs text-gray-400 mt-0.5">All stock movements — latest first</p>
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                    {loading ? "—" : transactions.length} records
                </span>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-14">
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: "#FA4900", borderTopColor: "transparent" }} />
                </div>
            )}

            {!loading && transactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
                    <svg className="w-9 h-9 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                    <p className="text-sm font-medium">No transactions yet.</p>
                </div>
            )}

            {!loading && transactions.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {["#", "Type", "Barcode", "Product", "Site", "Qty", "By", "Date", "Time"].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-gray-400 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {transactions.map((t) => {
                                const cfg = TYPE_CFG[t.transaction_type];
                                const qtyColor = t.transaction_type === "Receive" ? "text-green-600" : "text-red-500";
                                const qtySign  = t.transaction_type === "Receive" ? "+" : "";
                                return (
                                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-xs font-bold text-gray-400">#{t.id}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                                                {t.transaction_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                                                {t.barcode ?? "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-gray-800 whitespace-nowrap">{t.product_name ?? "—"}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{t.site ?? "—"}</td>
                                        <td className={`px-4 py-3 font-bold text-base ${qtyColor}`}>
                                            {qtySign}{t.quantity}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{t.performed_by_username}</td>
                                        <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap" suppressHydrationWarning>{fmtDate(t.transaction_date)}</td>
                                        <td className="px-4 py-3 text-gray-400 text-xs font-mono whitespace-nowrap" suppressHydrationWarning>{fmtTime(t.transaction_date)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ScanPage() {
    const [scanning, setScanning]       = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [facingMode, setFacingMode]   = useState<"environment" | "user">("environment");

    const [scannedBarcode, setScannedBarcode]       = useState<string>("");
    const [scanResult, setScanResult]               = useState<ScanResult | null>(null);
    const [scanLoading, setScanLoading]             = useState(false);
    const [scanError, setScanError]                 = useState<string | null>(null);

    const [selectedInventory, setSelectedInventory] = useState<InventoryRecord | null>(null);
    const [txType, setTxType]                       = useState<TxType>("Receive");
    const [quantity, setQuantity]                   = useState<string>("1");
    const [submitting, setSubmitting]               = useState(false);
    const [submitStatus, setSubmitStatus]           = useState<SubmitStatus>(null);

    const [recentTxs, setRecentTxs]   = useState<Transaction[]>([]);
    const [txsLoading, setTxsLoading] = useState(true);

    const html5QrCodeRef  = useRef<Html5Qrcode | null>(null);
    const lastScannedRef  = useRef<string>("");

    function fetchTxs() {
        setTxsLoading(true);
        getTransactions().then(setRecentTxs).catch(() => {}).finally(() => setTxsLoading(false));
    }

    useEffect(() => {
        fetchTxs();
        return () => { stopCamera(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!scannedBarcode) return;
        setScanLoading(true);
        setScanError(null);
        setScanResult(null);
        setSelectedInventory(null);
        setSubmitStatus(null);

        scanBarcode(scannedBarcode)
            .then((res) => {
                setScanResult(res);
                if (res.found && res.inventory.length === 1) setSelectedInventory(res.inventory[0]);
            })
            .catch((err: unknown) => setScanError(parseLookupError(err)))
            .finally(() => setScanLoading(false));
    }, [scannedBarcode]);

    async function startCamera(mode: "environment" | "user" = facingMode) {
        setCameraError(null);
        try {
            const qr = new Html5Qrcode("scan-reader", { verbose: false, formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.CODE_39] });
            html5QrCodeRef.current = qr;
            await qr.start({ facingMode: mode }, { fps: 10, qrbox: { width: 260, height: 150 } },
                (decoded) => {
                    if (decoded === lastScannedRef.current) return;
                    lastScannedRef.current = decoded;
                    setScannedBarcode(decoded);
                },
                () => {}
            );
            setScanning(true);
        } catch (err: unknown) {
            setCameraError(parseCameraError(err));
            html5QrCodeRef.current = null;
        }
    }

    async function stopCamera() {
        const qr = html5QrCodeRef.current;
        html5QrCodeRef.current = null;
        setScanning(false);
        if (!qr) return;
        try { await qr.stop(); qr.clear(); } catch { /* ignore */ }
    }

    async function switchFacing() {
        const newMode = facingMode === "environment" ? "user" : "environment";
        setFacingMode(newMode);
        if (scanning) { await stopCamera(); await startCamera(newMode); }
    }

    async function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        if (!selectedInventory) return;
        const qty = Number.parseInt(quantity, 10);
        if (!qty || qty <= 0) return;
        setSubmitting(true);
        setSubmitStatus(null);
        try {
            const signedQty = txType === "Sale" ? -Math.abs(qty) : Math.abs(qty);
            await createTransaction({ inventory: selectedInventory.id, transaction_type: txType, quantity: signedQty });
            setSubmitStatus({ kind: "success", msg: `${txType === "Receive" ? "Stock In" : "Stock Out"} ×${qty} recorded for ${selectedInventory.site}.` });
            handleReset();
            fetchTxs();
        } catch (err: unknown) {
            setSubmitStatus({ kind: "error", msg: extractApiError(err) });
        } finally {
            setSubmitting(false);
        }
    }

    function handleReset() {
        lastScannedRef.current = "";
        setScannedBarcode("");
        setScanResult(null);
        setScanError(null);
        setSelectedInventory(null);
        setSubmitStatus(null);
        setQuantity("1");
        setTxType("Receive");
    }

    return (
        <div className="px-6 py-8 space-y-8">
        <div className="max-w-xl space-y-6">
            <div className="space-y-0.5">
                <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>Barcode Scanner</p>
                <h1 className="text-2xl font-bold text-gray-900">Scan</h1>
            </div>

            {/* Camera card */}
            <div className="bg-white rounded-2xl shadow-md border overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                    <div>
                        <h2 className="text-sm font-bold text-gray-800">Camera</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{scanning ? "Aim at a product barcode" : "Tap Start to open camera"}</p>
                    </div>
                    <button onClick={switchFacing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 text-white text-xs font-semibold hover:bg-gray-700 transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{facingMode === "environment" ? "BACK" : "FRONT"}</span>
                    </button>
                </div>

                <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
                    <div id="scan-reader" className="absolute inset-0 w-full h-full" />
                    {!scanning && <CameraIdleOverlay cameraError={cameraError} onStart={() => startCamera()} />}
                    {scanning && (
                        <>
                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-white text-xs font-medium">Live</span>
                            </div>
                            <button onClick={stopCamera} className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/80 transition">
                                Stop
                            </button>
                        </>
                    )}
                </div>
            </div>

            <ScanResultPanel
                result={scanResult}
                scanLoading={scanLoading}
                scanError={scanError}
                scannedBarcode={scannedBarcode}
                selectedInventory={selectedInventory}
                txType={txType}
                quantity={quantity}
                submitting={submitting}
                onSelectInventory={setSelectedInventory}
                onTxType={setTxType}
                onQuantity={setQuantity}
                onSubmit={handleSubmit}
                onReset={handleReset}
            />

            <SubmitStatusBanner status={submitStatus} onDismiss={() => setSubmitStatus(null)} />
        </div>

            <RecentTransactionsPanel transactions={recentTxs} loading={txsLoading} />

            <style>{`
                #scan-reader { background: transparent !important; border: none !important; }
                #scan-reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important; }
                #scan-reader img { display: none !important; }
                #scan-reader * { font-size: 0 !important; }
                #scan-reader__scan_region { width: 100% !important; height: 100% !important; }
            `}</style>
        </div>
    );
}

