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
  const { user, role, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const ROLE_LABEL: Record<string, string> = {
    superadmin: "Super Admin",
    boss: "Boss",
    staff: "Staff",
  };

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

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-50">
      <div className="h-[72px] px-3 sm:px-4 md:px-6 flex items-center justify-between gap-4 border-b border-slate-200">

        {/* Left Section: Handles both Mobile Branding and Hamburger */}
        <div className="flex items-center">
          {/* Hamburger — Mobile ONLY (< md) */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-950 hover:bg-slate-50 transition-colors active:scale-90"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Logo + Brand — Mobile ONLY (< md) */}
          <Link href="/transactions" className="md:hidden flex items-center gap-3 shrink-0 ml-1">
            <div className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0">
              <Image src="/ctk.svg" alt="CTK" width={22} height={22} priority />
            </div>
            <div className="flex flex-col leading-none">
              <p className="text-[12px] font-black tracking-tight uppercase text-slate-950">CTK</p>
              <p className="text-[8px] font-black tracking-widest uppercase text-orange-600 mt-0.5">Spare Parts</p>
            </div>
          </Link>
        </div>

        {/* Center: Flexible Space (Can be used for global search in future) */}
        <div className="flex-1 min-w-0" />

        {/* Right Section: User Profile & Actions */}
        <div className="flex items-center gap-4" ref={dropdownRef}>
          {/* Greeting text — Desktop ONLY (>= sm) */}
          <div className="hidden sm:flex flex-col items-end leading-none gap-1 shrink-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Logged In As</p>
            <p className="text-[11px] font-black text-slate-950 uppercase tracking-tight truncate max-w-[120px]">
              {displayName}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-slate-100 hover:ring-orange-200 transition-all duration-300 cursor-pointer shadow-sm active:scale-95"
              aria-label="User menu"
            >
              <Image src="/albert-einstein.png" alt="Avatar" width={36} height={36} className="w-full h-full object-cover" />
            </button>

            {/* User Dropdown Menu */}
            {open && (
              <div className="absolute right-0 mt-3 w-52 bg-white border border-slate-200 shadow-2xl overflow-hidden z-50 rounded-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0">
                    <Image src="/albert-einstein.png" alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-950 truncate">@{user?.username || "user"}</p>
                    <span className="text-[9px] font-black tracking-widest uppercase text-orange-600">
                      {ROLE_LABEL[role] ?? "Standard Access"}
                    </span>
                  </div>
                </div>

                <div className="p-1.5">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-slate-100 group-hover:bg-white border border-transparent group-hover:border-orange-200 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">User Account</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-red-500 hover:bg-red-50 transition-all group mt-1 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-red-50 group-hover:bg-white border border-transparent group-hover:border-red-200 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Secure Logout</span>
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
