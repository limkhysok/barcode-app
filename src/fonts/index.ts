import { Roboto, Geist_Mono } from "next/font/google";

/**
 * Primary UI font — Roboto with all needed weights + italic.
 * weights: 400 (regular) | 500 (medium) | 700 (bold)
 * styles:  normal | italic
 *
 * Usage via Tailwind:
 *   font-normal   → 400 Regular
 *   font-medium   → 500 Medium
 *   font-bold     → 700 Bold
 *   italic        → Italic variant of any weight
 */
export const fontSans = Roboto({
    variable: "--font-roboto",
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    style: ["normal", "italic"],
    display: "swap",
});

/**
 * Monospace font — used for barcode values, IDs, and code snippets.
 */
export const fontMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
});
