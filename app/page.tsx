import Image from "next/image";
import Link from "next/link";
import Navbar from "@/src/components/layouts/Navbar";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="max-w-xl w-full text-center space-y-6">

          {/* CTK Logo */}
          <div className="flex justify-center">
            <Image
              src="/ctk.svg"
              alt="CTK Logo"
              width={100}
              height={140}
              className="rounded-xl shadow-md"
              priority
            />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              CTK Barcode Scanner
            </h1>
            <p className="text-gray-500 text-base">
              Scan and submit product barcodes instantly using your device camera.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-white border text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
            >
              Create Account
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
