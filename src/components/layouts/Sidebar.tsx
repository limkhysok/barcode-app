"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  Database,
  ArrowLeftRight,
  ChevronLeft,
} from "lucide-react";

const EXPANDED_W = 210;
const COLLAPSED_W = 68;
const MOBILE_W = 240;
const easing = "0.4s cubic-bezier(0.4, 0, 0.2, 1)";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: <ArrowLeftRight size={20} />,
  },
  {
    label: "Products",
    href: "/products",
    icon: <Package size={20} />,
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: <Database size={20} />,
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// ─── NavItem ─────────────────────────────────────────────────────────────────

function NavItem({
  label, href, icon, isCollapsed, onClick,
}: Readonly<{
  label: string;
  href: string;
  icon: React.ReactNode;
  isCollapsed: boolean;
  onClick?: () => void;
}>) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`
        flex items-center w-full transition-all duration-300 select-none group relative
        ${active
          ? "bg-slate-50 text-orange-600 border-r-2 border-orange-600"
          : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
        }
      `}
      style={{
        padding: isCollapsed ? "12px 0" : "12px 20px",
        justifyContent: isCollapsed ? "center" : "flex-start",
        gap: isCollapsed ? 0 : 12,
        transition: `padding ${easing}, gap ${easing}`,
      }}
    >
      <div className={`shrink-0 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>
        {icon}
      </div>
      <span
        className={`text-[11px] font-black uppercase tracking-[0.15em] leading-none ${active ? "opacity-100" : "opacity-80"}`}
        style={{
          maxWidth: isCollapsed ? 0 : 140,
          opacity: isCollapsed ? 0 : 1,
          overflow: "hidden",
          whiteSpace: "nowrap",
          transition: `max-width ${easing}, opacity ${easing}`,
        }}
      >
        {label}
      </span>
    </Link>
  );
}

// ─── SidebarContent ───────────────────────────────────────────────────────────

function SidebarContent({
  isCollapsed,
  onClose,
}: Readonly<{ isCollapsed: boolean; onClose: () => void }>) {
  return (
    <div className="flex flex-col h-full w-full bg-white">

      {/* ── Brand Section ── */}
      <div
        className="flex items-center px-5 h-18 border-b border-slate-200 overflow-hidden shrink-0 bg-white"
        style={{ 
          justifyContent: isCollapsed ? "center" : "flex-start", 
          padding: isCollapsed ? "0" : "0 20px",
          gap: isCollapsed ? 0 : 12
        }}
      >
        <div className="w-10 h-10 flex items-center justify-center shrink-0 ">
          <Image src="/ctk.svg" alt="CTK" width={24} height={24} priority />
        </div>
        <div
          className="flex flex-col leading-none"
          style={{
            opacity: isCollapsed ? 0 : 1,
            maxWidth: isCollapsed ? 0 : 120,
            transition: `opacity ${easing}, max-width ${easing}`
          }}
        >
          <span className="text-[14px] font-black text-slate-950 uppercase tracking-widest">CTK</span>
          <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest mt-1">Spare Parts</span>
        </div>
      </div>

      {/* ── Navigation List ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none no-scrollbar pt-6">
        <div className="space-y-1">
          <p
            className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 px-5"
            style={{
              maxWidth: isCollapsed ? 0 : 160,
              opacity: isCollapsed ? 0 : 1,
              overflow: "hidden",
              whiteSpace: "nowrap",
              transition: `max-width ${easing}, opacity ${easing}`,
            }}
          >
            Terminal
          </p>
          {navItems.map(({ label, href, icon }) => (
            <NavItem
              key={href}
              label={label}
              href={href}
              icon={icon}
              isCollapsed={isCollapsed}
              onClick={onClose}
            />
          ))}
        </div>
      </div>

      {/* ── Footer / Status ── */}
      <div
        className="p-4 border-t border-slate-50 shrink-0"
        style={{ opacity: isCollapsed ? 0 : 1, transition: `opacity ${easing}` }}
      >
        <div className="bg-slate-50 rounded-sm p-3 border border-slate-100">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Collapse Toggle ──────────────────────────────────────────────────────────

function CollapseToggle({
  isCollapsed,
  onToggleCollapse,
}: Readonly<{ isCollapsed: boolean; onToggleCollapse: () => void }>) {
  return (
    <button
      type="button"
      onClick={onToggleCollapse}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="
        absolute top-18 -right-3.5 z-30 hidden md:flex
        items-center justify-center w-7 h-7 rounded-full
        bg-white text-slate-400 border border-slate-200
        hover:text-orange-600 hover:border-orange-200
        active:scale-95 transition-all duration-300
        shadow-xl group/btn cursor-pointer
      "
    >
      <ChevronLeft
        size={14}
        strokeWidth={3.5}
        style={{
          transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
          transition: `transform ${easing}`,
        }}
      />
    </button>
  );
}

// ─── Sidebar (root) ───────────────────────────────────────────────────────────

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: Readonly<Props>) {
  const desktopW = isCollapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <div
        className="hidden md:block h-full shrink-0 relative z-20"
        style={{ width: desktopW, minWidth: desktopW, transition: `width ${easing}, min-width ${easing}` }}
      >
        <div className="h-full w-full overflow-hidden border-r border-slate-200">
          <SidebarContent isCollapsed={isCollapsed} onClose={onClose} />
        </div>

        <CollapseToggle isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />
      </div>

      {/* ── Mobile drawer ───────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 md:hidden backdrop-blur-sm"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-y-0 left-0 z-50 md:hidden shadow-3xl"
        style={{
          width: MOBILE_W,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: `transform ${easing}`,
        }}
      >
        <SidebarContent isCollapsed={false} onClose={onClose} />
      </div>
    </>
  );
}
