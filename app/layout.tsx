import type { Metadata } from "next";
import { fontSans, fontMono } from "@/src/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "CTK Spare Parts",
  description: "Your trusted source for quality spare parts — browse, scan, and order fast.",
  icons: {
    icon: "/ctk.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
