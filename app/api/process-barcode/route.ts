import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_FILE = path.join(process.cwd(), "simple.json");

async function getData(): Promise<{ id: string; barcode: string; timestamp: string }[]> {
    try {
        const fileData = await fs.readFile(DATA_FILE, "utf-8");
        return JSON.parse(fileData);
    } catch (error: any) {
        if (error.code !== "ENOENT") {
            console.error("Error reading simple.json:", error);
        }
        return [];
    }
}

export async function GET() {
    const data = await getData();
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const body = await request.json();
    const timestamp = body.timestamp || new Date().toISOString();

    // Support both single barcode (legacy) and batch array
    const incoming: string[] = Array.isArray(body.barcodes)
        ? body.barcodes
        : [body.barcode];

    const currentData = await getData();

    // Dedup: reject any barcode already saved within the last 10 seconds
    const tenSecondsAgo = Date.now() - 10_000;
    const recentBarcodes = new Set(
        currentData
            .filter(item => new Date(item.timestamp).getTime() > tenSecondsAgo)
            .map(item => item.barcode)
    );

    const saved: { id: string; barcode: string; timestamp: string }[] = [];
    const skipped: string[] = [];

    for (const barcode of incoming) {
        if (recentBarcodes.has(barcode)) {
            skipped.push(barcode);
        } else {
            const newItem = {
                id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
                barcode,
                timestamp,
            };
            saved.push(newItem);
            // Add to recentBarcodes so duplicates within the same batch are also caught
            recentBarcodes.add(barcode);
        }
    }

    if (saved.length > 0) {
        currentData.push(...saved);
        await fs.writeFile(DATA_FILE, JSON.stringify(currentData, null, 2));
    }

    return NextResponse.json({
        success: true,
        message: `Saved ${saved.length}, skipped ${skipped.length} duplicate(s).`,
        saved,
        skipped,
    });
}
