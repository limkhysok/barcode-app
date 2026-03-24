import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-3">
            <Image src="/ctk.svg" alt="CTK Logo" width={56} height={78} className="rounded-lg shadow" priority />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Sign in to your account</h1>
          <p className="text-xs font-normal italic text-gray-400 mt-1">Welcome back — enter your details below</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-[0.98] transition"
          >
            Sign In
          </button>
        </div>

        {/* Footer link */}
        <p className="mt-4 text-center text-sm text-gray-500">
          {"Don't have an account? "}
          <Link href="/register" className="text-blue-600 font-medium hover:underline">
            Create one
          </Link>
        </p>

      </div>
    </main>
  );
}
