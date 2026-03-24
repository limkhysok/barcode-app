"use client";
import { useEffect, useState, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { getHistory, submitBarcodes } from "@/src/services/barcode.service";
import type { ScanRecord } from "@/src/types/barcode.types";

type StatusKind = "idle" | "queued" | "duplicate" | "error" | "submitting" | "done";

function submitLabel(isSubmitting: boolean, count: number): string {
    if (isSubmitting) return "Saving to database...";
    if (count === 0) return "Submit to Database";
    return `Submit ${count} Product${count > 1 ? "s" : ""} to Database`;
}

export default function BarcodeScanner() {
    const [scanning, setScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [statusKind, setStatusKind] = useState<StatusKind>("idle");
    const [statusMsg, setStatusMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [history, setHistory] = useState<ScanRecord[]>([]);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

    // In-memory queue: array for display, Set for O(1) dedup
    const [queue, setQueue] = useState<string[]>([]);
    const scannedSetRef = useRef<Set<string>>(new Set());
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        getHistory()
            .then(data => setHistory(data))
            .catch(err => console.error("Failed to fetch history:", err));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => { stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function startCamera(mode: "environment" | "user" = facingMode) {
        setCameraError(null);
        try {
            const qr = new Html5Qrcode("reader", {
                verbose: false,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.EAN_13,
                ],
            });
            html5QrCodeRef.current = qr;
            await qr.start(
                { facingMode: mode },
                { fps: 10, qrbox: { width: 240, height: 140 } },
                (decodedText) => {
                    if (scannedSetRef.current.has(decodedText)) {
                        setStatusKind("duplicate");
                        setStatusMsg(`Already queued: ${decodedText}`);
                        return;
                    }
                    scannedSetRef.current.add(decodedText);
                    setQueue(prev => [...prev, decodedText]);
                    setStatusKind("queued");
                    setStatusMsg(decodedText);
                },
                () => {} // suppress per-frame NotFoundException
            );
            setScanning(true);
            setStatusKind("idle");
            setStatusMsg("");
        } catch (err: any) {
            const msg = typeof err === "string" ? err : err?.message ?? "Unknown error";
            setCameraError(msg.includes("Permission") || msg.includes("permission")
                ? "Camera permission denied. Please allow camera access in your browser settings."
                : "Camera unavailable. Make sure no other app is using it.");
            html5QrCodeRef.current = null;
        }
    }

    async function stopCamera() {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch {}
            html5QrCodeRef.current = null;
        }
        setScanning(false);
    }

    async function switchFacing() {
        const newMode = facingMode === "environment" ? "user" : "environment";
        setFacingMode(newMode);
        if (scanning) {
            await stopCamera();
            await startCamera(newMode);
        }
    }

    async function handleSubmit() {
        if (queue.length === 0) return;
        try {
            setSubmitting(true);
            setStatusKind("submitting");
            setStatusMsg("Sending to database...");

            const response = await submitBarcodes(queue);

            if (response.success) {
                setHistory(prev => [...prev, ...response.saved]);
                const skipped = response.skipped.length;
                setStatusKind("done");
                setStatusMsg(
                    `Saved ${response.saved.length} product(s)` +
                    (skipped > 0 ? `, skipped ${skipped} duplicate(s)` : "")
                );
                setQueue([]);
                scannedSetRef.current.clear();
            }
        } catch {
            setStatusKind("error");
            setStatusMsg("Submit failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    function handleClearQueue() {
        setQueue([]);
        scannedSetRef.current.clear();
        setStatusKind("idle");
        setStatusMsg("");
    }

    const statusStyle: Record<StatusKind, string> = {
        idle:       "bg-gray-100 text-gray-500",
        queued:     "bg-green-100 text-green-700",
        duplicate:  "bg-yellow-100 text-yellow-700",
        error:      "bg-red-100 text-red-700",
        submitting: "bg-blue-100 text-blue-700",
        done:       "bg-emerald-100 text-emerald-700",
    };

    const statusIcon: Record<StatusKind, string> = {
        idle:       "○",
        queued:     "✓",
        duplicate:  "⚠",
        error:      "✕",
        submitting: "↑",
        done:       "✓",
    };

    return (
        <div className="bg-white rounded-2xl shadow-md border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                <div>
                    <h2 className="text-base font-bold text-gray-800 leading-tight">Product Scanner</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {scanning ? "Aim at a barcode or QR code" : "Tap Start to open camera"}
                    </p>
                </div>

                {/* BACK / FRONT toggle */}
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

            {/* Camera viewport — 4:3 */}
            <div className="relative bg-black aspect-4/3 w-full">
                {/* Library injects video here — styled via global override below */}
                <div id="reader" className="absolute inset-0 w-full h-full" />

                {/* Idle overlay — only shown when camera is off */}
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
                                    Try Again
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
                                <p className="text-white/60 text-sm">Camera is off</p>
                                <button
                                    onClick={() => startCamera()}
                                    className="px-6 py-2.5 rounded-full bg-blue-500 text-white text-sm font-semibold hover:bg-blue-400 active:scale-95 transition"
                                >
                                    Start Scanning
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Scanning indicator — bottom-left badge */}
                {scanning && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-white text-xs font-medium">Live</span>
                    </div>
                )}

                {/* Stop button — bottom-right */}
                {scanning && (
                    <button
                        onClick={stopCamera}
                        className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/80 transition"
                    >
                        Stop
                    </button>
                )}
            </div>

            {/* Status bar */}
            {statusMsg && (
                <div className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium ${statusStyle[statusKind]}`}>
                    <span className="font-mono text-base leading-none">{statusIcon[statusKind]}</span>
                    <span>{statusMsg}</span>
                </div>
            )}

            {/* Queue + Submit */}
            <div className="p-5 space-y-4">
                <div className="rounded-xl border bg-gray-50 overflow-hidden">
                    {/* Queue header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-700">Scan Queue</span>
                            {queue.length > 0 && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                    {queue.length}
                                </span>
                            )}
                        </div>
                        {queue.length > 0 && (
                            <button
                                onClick={handleClearQueue}
                                className="text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Queue items */}
                    {queue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400">
                            <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75V16.5zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                            </svg>
                            <p className="text-sm">No items queued — start scanning</p>
                        </div>
                    ) : (
                        <ul className="divide-y max-h-44 overflow-y-auto">
                            {queue.map((barcode, idx) => (
                                <li key={barcode} className="flex items-center gap-3 px-4 py-2.5">
                                    <span className="text-xs text-gray-400 w-5 text-right shrink-0">{idx + 1}</span>
                                    <span className="flex-1 font-mono text-sm text-gray-800">{barcode}</span>
                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                        queued
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Submit button */}
                <button
                    onClick={handleSubmit}
                    disabled={queue.length === 0 || submitting}
                    className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    {submitLabel(submitting, queue.length)}
                </button>
            </div>

            {/* Scan History */}
            <div className="px-5 pb-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    {"Scan History"}<span className="text-xs font-normal text-gray-400">({history.length} records)</span>
                </h3>
                <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-500 text-xs uppercase">
                                <th className="px-3 py-2 font-semibold">#</th>
                                <th className="px-3 py-2 font-semibold">Product ID</th>
                                <th className="px-3 py-2 font-semibold">Saved At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-3 py-6 text-center text-gray-400 italic text-sm">
                                        No products saved yet
                                    </td>
                                </tr>
                            ) : (
                                history.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition">
                                        <td className="px-3 py-2.5 text-gray-400 text-xs">{index + 1}</td>
                                        <td className="px-3 py-2.5 font-mono text-gray-800 font-medium">{item.barcode}</td>
                                        <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                                            {new Date(item.timestamp).toISOString().replace("T", " ").slice(0, 19)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Override html5-qrcode injected video styles */}
            <style>{`
                #reader { background: transparent !important; border: none !important; }
                #reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important; }
                #reader img { display: none !important; }
            `}</style>
        </div>
    );
}
