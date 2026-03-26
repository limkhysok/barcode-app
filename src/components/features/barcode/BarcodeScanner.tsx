"use client";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface Props {
    onScan: (barcode: string) => void;
}

function parseCameraError(err: unknown): string {
    const isErrObj = err instanceof Error;
    const rawMsg   = typeof err === "string" ? err : "";
    const msg      = isErrObj ? err.message : rawMsg;
    const name     = isErrObj ? err.name    : "";
    const low      = msg.toLowerCase();

    if (name === "NotAllowedError" || low.includes("permission") || low.includes("not allowed") || low.includes("denied"))
        return "Camera permission denied. Please allow camera access in your browser settings.";
    if (name === "NotFoundError" || low.includes("not found") || low.includes("no camera") || low.includes("no device"))
        return "No camera found on this device.";
    if (name === "NotReadableError" || low.includes("in use") || low.includes("track"))
        return "Camera in use by another app. Close other apps and try again.";
    return "Camera unavailable. Please try again.";
}

export default function BarcodeScanner({ onScan }: Readonly<Props>) {
    const [scanning, setScanning]       = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [facingMode, setFacingMode]   = useState<"environment" | "user">("environment");
    const html5QrCodeRef                = useRef<Html5Qrcode | null>(null);

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
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.CODE_39,
                ],
            });
            html5QrCodeRef.current = qr;
            await qr.start(
                { facingMode: mode },
                { fps: 10, qrbox: { width: 260, height: 150 } },
                (decoded) => { onScan(decoded); },
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

    return (
        <div className="bg-white rounded-2xl shadow-md border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                <div>
                    <h2 className="text-sm font-bold text-gray-800">Camera</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {scanning ? "Aim at a product barcode" : "Tap Start to open camera"}
                    </p>
                </div>
                <button
                    onClick={switchFacing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 text-white text-xs font-semibold hover:bg-gray-700 transition"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{facingMode === "environment" ? "BACK" : "FRONT"}</span>
                </button>
            </div>

            {/* Camera viewport — 4:3 */}
            <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
                <div id="reader" className="absolute inset-0 w-full h-full" />

                {!scanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-950">
                        {cameraError ? (
                            <>
                                <div className="w-14 h-14 rounded-full bg-red-900/40 flex items-center justify-center">
                                    <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
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
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                    </svg>
                                </div>
                                <p className="text-white/60 text-sm">Camera is off</p>
                                <button
                                    onClick={() => startCamera()}
                                    className="px-6 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition"
                                    style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}
                                >
                                    Start Scanning
                                </button>
                            </>
                        )}
                    </div>
                )}

                {scanning && (
                    <>
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-white text-xs font-medium">Live</span>
                        </div>
                        <button
                            onClick={stopCamera}
                            className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/80 transition"
                        >
                            Stop
                        </button>
                    </>
                )}
            </div>

            <style>{`
                #reader { background: transparent !important; border: none !important; }
                #reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important; }
                #reader img { display: none !important; }
            `}</style>
        </div>
    );
}
