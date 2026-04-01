"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router    = useRouter();

  const [username, setUsername]         = useState("");
  const [password, setPassword]         = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ username, password });
      router.push("/transactions");
    } catch {
      setError("Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-none shadow-lg overflow-hidden">

        {/* Top — orange header */}
        <div
          className="flex flex-col items-center justify-center gap-3 px-8 py-4 bg-orange-700"
        
        >
          <Image src="/ctk_logo.jpg" alt="CTK Logo" width={77} height={77} className="rounded-none object-cover border-none border-white/30" priority />
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/70">Spare Parts</p>
        </div>

        {/* Bottom — form */}
        <div className="bg-white px-8 py-8 space-y-2">

          <h1 className="text-xl font-bold text-gray-900">Login</h1>

          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-bold tracking-widest uppercase text-gray-500">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-none border border-gray-300 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                suppressHydrationWarning
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold tracking-widest uppercase text-gray-500">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-11 rounded-none border border-gray-300 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-700 transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs font-medium text-red-500 bg-red-50 border border-red-200 px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-xs font-bold tracking-[0.2em] bg-orange-500 uppercase text-white flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed rounded-none"
              
            >
              {loading ? "Logging in…" : "Login"}
              {!loading && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              )}
            </button>
          </form>

        </div>
      </div>
    </main>
  );
}
