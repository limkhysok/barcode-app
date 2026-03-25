"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { createTransaction } from "@/src/services/transaction.service";

type TxType = "Receive" | "Sale";
type SubmitStatus = { kind: "success" | "error"; msg: string } | null;

function buildPayload(inventoryId: number, txType: TxType, qty: number) {
    const quantity = txType === "Sale" ? -Math.abs(qty) : Math.abs(qty);
    return { inventory: inventoryId, transaction_type: txType, quantity };
}

function parseCameraError(err: unknown): string {
    const msg = err instanceof Error ? err.message : "Camera error";
    if (msg.toLowerCase().includes("permission")) {
        return "Camera permission denied. Please allow camera access in your browser settings.";
    }
    return "Camera unavailable. Make sure no other app is using it.";
}

type ParsedForm =
    | { ok: false; error: string }
    | { ok: true; inventoryId: number; qty: number };

function parseFormInput(scannedId: string, quantity: string): ParsedForm {
    const qty = Number.parseInt(quantity, 10);
    if (!scannedId || Number.isNaN(qty) || qty <= 0) {
        return { ok: false, error: "Please scan a barcode and enter a valid quantity." };
    }
    const inventoryId = Number.parseInt(scannedId, 10);
    if (Number.isNaN(inventoryId)) {
        return { ok: false, error: `"${scannedId}" is not a valid inventory ID.` };
    }
    return { ok: true, inventoryId, qty };
}

export default function ScanPage() {
    const [scanning, setScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

    // Scanned inventory ID (raw string from barcode)
    const [scannedId, setScannedId] = useState<string>("");

    // Transaction form
    const [txType, setTxType] = useState<TxType>("Receive");
    const [quantity, setQuantity] = useState<string>("1");

    // Submit state
    const [submitting, setSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(null);

    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const lastScannedRef = useRef<string>("");

    // Cleanup on unmount
    useEffect(() => {
        return () => { stopCamera(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function startCamera(mode: "environment" | "user" = facingMode) {
        setCameraError(null);
        try {
            const qr = new Html5Qrcode("scan-reader", {
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
                { facingMode: mode },
                { fps: 10, qrbox: { width: 260, height: 150 } },
                (decoded) => {
                    if (decoded === lastScannedRef.current) return;
                    lastScannedRef.current = decoded;
                    setScannedId(decoded);
                    setSubmitStatus(null);
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
        try {
            await qr.stop();
            qr.clear();
        } catch { /* ignore */ }
    }

    async function switchFacing() {
        const newMode = facingMode === "environment" ? "user" : "environment";
        setFacingMode(newMode);
        if (scanning) {
            await stopCamera();
            await startCamera(newMode);
        }
    }

    async function handleSubmit(e: { preventDefault(): void }) {
        e.preventDefault();
        const parsed = parseFormInput(scannedId, quantity);
        if (!parsed.ok) {
            setSubmitStatus({ kind: "error", msg: parsed.error });
            return;
        }
        const { inventoryId, qty } = parsed;

        setSubmitting(true);
        setSubmitStatus(null);
        try {
            await createTransaction(buildPayload(inventoryId, txType, qty));
            setSubmitStatus({
                kind: "success",
                msg: `${submitTypeLabel} ×${qty} recorded for inventory #${inventoryId}.`,
            });
            // Reset for next scan
            lastScannedRef.current = "";
            setScannedId("");
            setQuantity("1");
            setTxType("Receive");
        } catch {
            setSubmitStatus({ kind: "error", msg: "Failed to create transaction. Please try again." });
        } finally {
            setSubmitting(false);
        }
    }

    function handleScanAnother() {
        lastScannedRef.current = "";
        setScannedId("");
        setSubmitStatus(null);
        setQuantity("1");
        setTxType("Receive");
    }

    const submitTypeLabel = txType === "Receive" ? "Stock In" : "Stock Out";
    const showPlaceholder = !scanning && !submitStatus;
    const qtyInvalid = !quantity || Number.parseInt(quantity, 10) <= 0;
    const isSuccess = submitStatus?.kind === "success";
    const statusWrapCls = isSuccess ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100";
    const statusIconCls = isSuccess ? "bg-green-500" : "bg-red-500";
    const statusTitle = isSuccess ? "Transaction recorded!" : "Transaction failed";
    const statusTitleCls = isSuccess ? "text-green-800" : "text-red-800";
    const statusMsgCls = isSuccess ? "text-green-600" : "text-red-600";

    return (
        <div className="px-8 py-8 space-y-6 max-w-xl">
            {/* Page header */}
            <div className="space-y-0.5">
                <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>
                    {"Barcode Scanner"}
                </p>
                <h1 className="text-2xl font-bold text-gray-900">{"Scan"}</h1>
            </div>

            {/* Camera card */}
            <div className="bg-white rounded-2xl shadow-md border overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                    <div>
                        <h2 className="text-sm font-bold text-gray-800 leading-tight">{"Camera"}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {scanning ? "Aim at a barcode or QR code" : "Tap Start to open camera"}
                        </p>
                    </div>
                    <button
                        onClick={switchFacing}
                        title="Switch camera"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 text-white text-xs font-semibold hover:bg-gray-700 transition"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {facingMode === "environment" ? "BACK" : "FRONT"}
                    </button>
                </div>

                {/* Camera viewport */}
                <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
                    <div id="scan-reader" className="absolute inset-0 w-full h-full" />

                    {/* Idle overlay */}
                    {!scanning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-950">
                            {cameraError ? (
                                <>
                                    <div className="w-14 h-14 rounded-full bg-red-900/40 flex items-center justify-center">
                                        <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-red-300 text-center max-w-xs px-4">{cameraError}</p>
                                    <button
                                        onClick={() => startCamera()}
                                        className="px-5 py-2 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition"
                                    >
                                        {"Try Again"}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                        </svg>
                                    </div>
                                    <p className="text-white/60 text-sm">{"Camera is off"}</p>
                                    <button
                                        onClick={() => startCamera()}
                                        className="px-6 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition"
                                        style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}
                                    >
                                        {"Start Scanning"}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Live badge */}
                    {scanning && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-white text-xs font-medium">{"Live"}</span>
                        </div>
                    )}

                    {/* Stop button */}
                    {scanning && (
                        <button
                            onClick={stopCamera}
                            className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/80 transition"
                        >
                            {"Stop"}
                        </button>
                    )}
                </div>
            </div>

            {/* Transaction form — shown after scan */}
            {scannedId ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Scanned ID banner */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ background: "linear-gradient(135deg,#fff7f4,#fff)" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
                            style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">{"Scanned"}</p>
                            <p className="text-base font-bold font-mono text-gray-900">{scannedId}</p>
                        </div>
                        <button
                            onClick={handleScanAnother}
                            className="ml-auto text-xs text-gray-400 hover:text-gray-600 font-medium transition"
                        >
                            {"✕ Clear"}
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {/* Type toggle */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {"Transaction Type"}
                            </label>
                            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setTxType("Receive")}
                                    className="flex-1 py-2.5 text-sm font-semibold transition"
                                    style={txType === "Receive"
                                        ? { background: "linear-gradient(135deg, #FA4900, #b91c1c)", color: "#fff" }
                                        : { background: "#f9fafb", color: "#6b7280" }}
                                >
                                    {"↑ Stock In"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTxType("Sale")}
                                    className="flex-1 py-2.5 text-sm font-semibold transition"
                                    style={txType === "Sale"
                                        ? { background: "linear-gradient(135deg, #1d4ed8, #1e40af)", color: "#fff" }
                                        : { background: "#f9fafb", color: "#6b7280" }}
                                >
                                    {"↓ Stock Out"}
                                </button>
                            </div>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {"Quantity"}
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-lg font-bold text-gray-900 outline-none focus:ring-2 focus:border-transparent transition text-center"
                                style={{ "--tw-ring-color": "#FA4900" } as React.CSSProperties}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting || qtyInvalid}
                            className="w-full py-3 rounded-xl text-white text-sm font-bold tracking-widest uppercase hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                            style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                    {"Saving…"}
                                </span>
                            ) : (
                                `Confirm ${submitTypeLabel}`
                            )}
                        </button>
                    </form>
                </div>
            ) : (
                /* Waiting for scan placeholder */
                showPlaceholder && (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center gap-3 text-gray-400">
                        <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75V16.5zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                        </svg>
                        <p className="text-sm font-medium">{"Scan a barcode to begin"}</p>
                    </div>
                )
            )}

            {/* Status feedback */}
            {submitStatus && (
                <div className={`rounded-2xl border p-5 flex items-start gap-3 ${statusWrapCls}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${statusIconCls}`}>
                        {isSuccess ? (
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
                        <p className={`text-sm font-semibold ${statusTitleCls}`}>{statusTitle}</p>
                        <p className={`text-xs mt-0.5 ${statusMsgCls}`}>{submitStatus.msg}</p>
                    </div>
                    {isSuccess && (
                        <button
                            onClick={handleScanAnother}
                            className="shrink-0 text-xs font-bold text-green-700 hover:text-green-900 transition"
                        >
                            {"Scan Next →"}
                        </button>
                    )}
                </div>
            )}

            {/* html5-qrcode style overrides */}
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
