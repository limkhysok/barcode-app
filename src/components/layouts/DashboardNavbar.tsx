"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/src/context/AuthContext";

interface Props {
  onMenuClick: () => void;
}

export default function DashboardNavbar({ onMenuClick }: Readonly<Props>) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    setOpen(false);
    logout();
    router.push("/login");
  }

  const displayName = user?.name || user?.username || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-black-80">



      <div className="h-14 px-3 md:px-6 flex items-center justify-between gap-4">

        {/* Left — logo + title + mobile hamburger */}
        <div className="flex items-center gap-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Logo + title — always visible */}
          <Link href="/dashboard" className="flex items-center gap-0 shrink-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"

            >
              <Image src="/ctk.svg" alt="CTK" width={18} height={18} priority />
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.2em] uppercase text-gray-900 leading-none">CTK</p>
              <p className="text-[9px] font-medium tracking-[0.15em] uppercase leading-none mt-0.5" style={{ color: "#FA4900" }}>
                Spare Parts
              </p>
            </div>
          </Link>
        </div>

        <div className="flex-1" />

        {/* Right — greeting + user avatar dropdown */}
        <div className="flex items-center gap-2.5" ref={dropdownRef}>
          {/* Greeting text */}
          <p className="hidden sm:block text-xs font-medium text-gray-500">
            Hello, <span className="font-bold text-gray-900">{displayName}</span>
          </p>

          {/* Avatar button */}
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-transparent hover:ring-orange-300 transition"
              style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}
              aria-label="User menu"
            >
              {initial}
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 mt-2 w-38 bg-white rounded-sm border border-gray-800 shadow-xl overflow-hidden z-50">
                {/* Profile */}
                <div className="py-0">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    <span className="text-xs font-medium">Profile</span>
                  </Link>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 py-0">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 transition"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    <span className="text-xs font-bold">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
