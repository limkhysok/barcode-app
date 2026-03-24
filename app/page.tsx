import Image from "next/image";
import Navbar from "@/src/components/layouts/Navbar";

export default function LandingPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <main className="min-h-screen bg-linear-to-br from-orange-50 via-white to-red-50 flex flex-col">

        {/* Hero section */}
        <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="max-w-2xl w-full space-y-8">

            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-200 rounded-2xl blur-xl opacity-50 scale-110" />
                <Image
                  src="/ctk.svg"
                  alt="CTK Logo"
                  width={110}
                  height={154}
                  className="relative rounded-2xl shadow-xl"
                  priority
                />
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-3">
              {/* bold */}
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
                CTK{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-red-700">
                  Spare Parts
                </span>
              </h1>
              {/* regular + italic tagline */}
              <p className="text-gray-400 text-sm font-normal italic max-w-md mx-auto leading-relaxed">
                Your trusted source for quality spare parts.
              </p>
              {/* medium description */}
              <p className="text-gray-500 text-base font-medium max-w-md mx-auto leading-relaxed">
                Browse, scan, and order the parts you need — fast and hassle-free.
              </p>
            </div>

          </div>
        </section>

       

        {/* Footer */}
        <footer className="border-t bg-white px-4 py-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} CTK. All rights reserved.
        </footer>

      </main>
    </>
  );
}
