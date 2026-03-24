import Image from "next/image";
import Link from "next/link";
import Navbar from "@/src/components/layouts/Navbar";

export default function LoginPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl flex rounded-3xl overflow-hidden shadow-xl border border-gray-100">

          {/* Left — decorative */}
          <div
            className="hidden md:flex w-2/5 flex-col justify-between p-10 text-white"
            style={{ background: "linear-gradient(160deg, #FA4900 0%, #b91c1c 100%)" }}
          >
            <Image src="/ctk.svg" alt="CTK Logo" width={40} height={56} className="rounded brightness-0 invert" priority />

            <div className="space-y-3">
              <h2 className="text-3xl font-bold leading-snug">
                Good to see<br />you again.
              </h2>
              <p className="text-sm font-normal text-white/65 leading-relaxed">
                Log in and pick up right where you left off.
              </p>
            </div>

            <p className="text-[10px] italic text-white/35 tracking-widest uppercase">
              CTK Spare Parts
            </p>
          </div>

          {/* Right — form */}
          <div className="flex-1 bg-white flex flex-col justify-center px-8 py-10 space-y-7">

            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">Login</h1>
              <p className="text-xs font-normal italic text-gray-400">
                Enter your credentials to continue
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-bold tracking-widest uppercase text-gray-500">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ "--tw-ring-color": "#FA4900" } as React.CSSProperties}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-bold tracking-widest uppercase text-gray-500">
                    Password
                  </label>
                  <Link href="#" className="text-xs font-medium hover:underline" style={{ color: "#FA4900" }}>
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ "--tw-ring-color": "#FA4900" } as React.CSSProperties}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl text-xs font-bold tracking-[0.2em] uppercase text-white flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition shadow-md"
                style={{ background: "linear-gradient(to right, #FA4900, #b91c1c)" }}
              >
                Login
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs italic text-gray-300">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <p className="text-center text-sm text-gray-500">
              {"Don't have an account? "}
              <Link href="/register" className="font-bold hover:underline" style={{ color: "#FA4900" }}>
                Register
              </Link>
            </p>

          </div>
        </div>
      </main>
    </>
  );
}
