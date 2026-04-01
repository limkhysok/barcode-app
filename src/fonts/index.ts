import { Roboto, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

/**
 * Primary UI font — Roboto with all needed weights + italic.
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

/**
 * Khmer display font — used for Khmer-language print templates.
 * Maps to the `font-khmer` Tailwind utility via --font-kantumruy.
 */
export const fontKhmer = localFont({
    src: "../fonts/KantumruyPro-Regular.ttf",
    variable: "--font-kantumruy",
    display: "swap",
});
