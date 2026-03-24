import api from "./api";
import type { ScanRecord, SubmitPayload, SubmitResponse } from "@/src/types/barcode.types";

export async function getHistory(): Promise<ScanRecord[]> {
    const res = await api.get<ScanRecord[]>("/api/process-barcode");
    return res.data;
}

export async function submitBarcodes(barcodes: string[]): Promise<SubmitResponse> {
    const payload: SubmitPayload = {
        barcodes,
        timestamp: new Date().toISOString(),
    };
    const res = await api.post<SubmitResponse>("/api/process-barcode", payload);
    return res.data;
}
