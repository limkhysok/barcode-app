"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { label: "Home",     href: "/"         },
  { label: "Products", href: "#products" },
  { label: "About",    href: "#about"    },
  { label: "Contact",  href: "#contact"  },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      {/* Brand accent line */}
      <div className="h-0.5 w-full" style={{ background: "linear-gradient(to right, #FA4900, #b91c1c)" }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
            style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}
          >
            <Image src="/ctk.svg" alt="CTK Logo" width={18} height={25} priority />
          </div>
          <div>
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-gray-900 leading-none">CTK</p>
            <p className="text-[9px] font-medium tracking-[0.15em] uppercase leading-none mt-0.5" style={{ color: "#FA4900" }}>
              Spare Parts
            </p>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map(({ label, href }) => (
            <Link key={label} href={href} className="relative px-4 py-2 rounded-lg text-xs font-semibold tracking-widest uppercase text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 group">
              {label}
              <span className="absolute bottom-1 left-4 right-4 h-0.5 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" style={{ backgroundColor: "#FA4900" }} />
            </Link>
          ))}
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Link href="/login" className="px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200">
            Login
          </Link>
          <Link href="/register" className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold tracking-widest uppercase text-white hover:opacity-90 active:scale-[0.97] transition-all duration-200 shadow-sm" style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
            Register
          </Link>
        </div>

        {/* Mobile: Login link + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/login" className="px-3 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase text-gray-600 hover:bg-gray-100 transition">
            Login
          </Link>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className="md:hidden overflow-hidden border-t border-gray-100"
        style={{
          maxHeight: mobileOpen ? 320 : 0,
          opacity: mobileOpen ? 1 : 0,
          transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
        }}
      >
        <div className="px-4 py-3 space-y-1">
          {navLinks.map(({ label, href }) => (
            <Link key={label} href={href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100">
            <Link href="/register" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold tracking-widest uppercase text-white hover:opacity-90 active:scale-[0.98] transition shadow-sm" style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
