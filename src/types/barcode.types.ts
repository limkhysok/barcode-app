export interface ScanRecord {
    id: string;
    barcode: string;
    timestamp: string;
}

export interface SubmitPayload {
    barcodes: string[];
    timestamp: string;
}

export interface SubmitResponse {
    success: boolean;
    message: string;
    saved: ScanRecord[];
    skipped: string[];
}
