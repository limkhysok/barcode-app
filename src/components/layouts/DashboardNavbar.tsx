"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/src/context/AuthContext";
import { User, LogOut, Menu } from "lucide-react";

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
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="h-12.5 px-4 md:px-6 flex items-center justify-between gap-4">

        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-md text-slate-500 hover:text-slate-950 hover:bg-slate-50 transition-all active:scale-90"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} strokeWidth={2.5} />
          </button>

          <Link href="/dashboard" className="md:hidden flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <Image src="/ctk.svg" alt="CTK" width={22} height={22} priority />
            </div>
            <div className="flex flex-col leading-none">
              <p className="text-[12px] font-black tracking-tighter uppercase text-slate-950">CTK</p>
              <p className="text-[7px] font-black tracking-[0.2em] uppercase text-orange-600 mt-0.5">Spare Parts</p>
            </div>
          </Link>
        </div>

        <div className="flex-1" />

        {/* Right Section */}
        <div className="flex items-center gap-4" ref={dropdownRef}>
          <div className="hidden sm:flex flex-col items-end leading-none gap-1 shrink-0">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Live Session</p>
            <p className="text-[11px] font-black text-slate-950 uppercase tracking-tight truncate max-w-40">
              {displayName}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="group flex items-center gap-1 p-0.5 rounded-full hover:bg-slate-50 transition-all duration-300 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-white shadow-sm border border-slate-200">
                {user?.image ? (
                  <Image src={user.image} alt="Avatar" width={32} height={32} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <User size={16} />
                  </div>
                )}
              </div>
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 shadow-2xl overflow-hidden z-50 rounded-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-white shadow-lg shrink-0">
                    <span className="text-xs font-black uppercase">{user?.username?.[0] || "?"}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-black text-slate-950 truncate leading-none mb-1">@{user?.username || "user"}</p>
                    <span className="text-[8px] font-black tracking-widest uppercase text-orange-600">
                      {ROLE_LABEL[role] ?? "Standard Access"}
                    </span>
                  </div>
                </div>

                <div className="p-1.5">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-sm text-slate-600 hover:bg-slate-50 hover:text-slate-950 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-sm flex items-center justify-center bg-slate-100 group-hover:bg-white border border-transparent group-hover:border-slate-200 transition-all">
                      <User size={14} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Account Details</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-red-500 hover:bg-red-50 transition-all group mt-0.5 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-sm flex items-center justify-center bg-red-50 group-hover:bg-white border border-transparent group-hover:border-red-200 transition-all">
                      <LogOut size={14} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
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
