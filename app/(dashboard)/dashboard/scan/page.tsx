"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { scanBarcode } from "@/src/services/inventory.service";
import { scanTransaction, getTransactions } from "@/src/services/transaction.service";
import type { ScanResult, InventoryRecord } from "@/src/types/inventory.types";
import type { Transaction } from "@/src/types/transaction.types";
import BarcodeScanner from "@/src/components/features/barcode/BarcodeScanner";

type TxType = "Receive" | "Sale";
type SubmitStatus = { kind: "success" | "error"; msg: string; totalValue?: string } | null;

// ── Top-level helpers ────────────────────────────────────────────────────────

function parseLookupError(err: unknown): string {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return "No product found for this barcode.";
    if (status === 400) return "Invalid barcode value.";
    return "Lookup failed. Please try again.";
}

function extractApiError(err: unknown): string {
    type ApiErr = { response?: { data?: { detail?: string; items?: Array<{ quantity?: string }> } } };
    const data = (err as ApiErr)?.response?.data;
    return data?.detail ?? data?.items?.[0]?.quantity ?? "Failed to create transaction. Please try again.";
}

// ── Sub-components ───────────────────────────────────────────────────────────

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
        <div className={`rounded-2xl border overflow-hidden ${ok ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
            <div className="flex items-start gap-3 p-5">
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
                <div className="flex-1 min-w-0">
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
            {ok && status.totalValue && (
                <div className="flex items-center justify-between px-5 py-3 bg-green-100/60 border-t border-green-100">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-green-600">Transaction Value</p>
                    <p className="text-sm font-black text-green-700 tabular-nums">
                        +${Number.parseFloat(status.totalValue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            )}
        </div>
    );
}

const TYPE_CFG = {
    Receive: { bg: "bg-green-50", text: "text-green-600", dot: "bg-green-500" },
    Sale: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
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
                                {["#", "Type", "Product", "Items", "Total Value", "By", "Date", "Time"].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-gray-400 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {transactions.map((t) => {
                                const cfg = TYPE_CFG[t.transaction_type];
                                const valCol = t.transaction_type === "Receive" ? "text-green-600" : "text-red-500";
                                const sign = t.transaction_type === "Receive" ? "+" : "−";
                                const first = t.items[0];
                                const more = t.items.length - 1;
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
                                            <p className="font-semibold text-gray-800 whitespace-nowrap">
                                                {first?.product_name ?? "—"}
                                                {more > 0 && <span className="text-gray-400 font-normal text-xs"> & {more} more</span>}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{t.items.length} item{t.items.length === 1 ? "" : "s"}</td>
                                        <td className={`px-4 py-3 font-bold text-sm tabular-nums ${valCol}`}>
                                            {t.total_transaction_value
                                                ? `${sign}$${Number.parseFloat(t.total_transaction_value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                : "—"}
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
    const [scannedBarcode, setScannedBarcode] = useState<string>("");
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [scanLoading, setScanLoading] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);

    const [selectedInventory, setSelectedInventory] = useState<InventoryRecord | null>(null);
    const [txType, setTxType] = useState<TxType>("Receive");
    const [quantity, setQuantity] = useState<string>("1");
    const [submitting, setSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(null);

    const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
    const [txsLoading, setTxsLoading] = useState(true);

    const lastScannedRef = useRef<string>("");

    function fetchTxs() {
        setTxsLoading(true);
        getTransactions().then((res) => setRecentTxs(res.results)).catch(() => { }).finally(() => setTxsLoading(false));
    }

    useEffect(() => { fetchTxs(); }, []);

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

    async function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        if (!selectedInventory || !scannedBarcode) return;
        const qty = Number.parseInt(quantity, 10);
        if (!qty || qty <= 0) return;
        setSubmitting(true);
        setSubmitStatus(null);
        try {
            const signedQty = txType === "Sale" ? -Math.abs(qty) : Math.abs(qty);
            const result = await scanTransaction({
                barcode: scannedBarcode,
                transaction_type: txType,
                quantity: signedQty,
                inventory_id: selectedInventory.id,
            });
            const label = txType === "Receive" ? "Receive" : "Sale";
            const valueStr = result.total_transaction_value
                ? ` · Value: $${Number.parseFloat(result.total_transaction_value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "";
            setSubmitStatus({
                kind: "success",
                msg: `${label} ×${qty} recorded for ${selectedInventory.site}.${valueStr}`,
                totalValue: result.total_transaction_value,
            });
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

                <BarcodeScanner onScan={(decoded) => {
                    if (decoded === lastScannedRef.current) return;
                    lastScannedRef.current = decoded;
                    setScannedBarcode(decoded);
                }} />

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

