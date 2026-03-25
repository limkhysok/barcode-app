import type { Metadata } from "next";
import { fontSans, fontMono } from "@/src/fonts";
import { AuthProvider } from "@/src/context/AuthContext";
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
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
