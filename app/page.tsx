import BarcodeScanner from "@/src/components/features/barcode/BarcodeScanner";
import Navbar from "@/src/components/layouts/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Page content */}
      <main className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <BarcodeScanner />
        </div>
      </main>
    </>
  );
}
