"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/src/context/AuthContext";
import {
  LayoutDashboard,
  Package,
  Database,
  ArrowLeftRight,
  ChevronLeft,
  Users,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",    href: "/dashboard",    icon: <LayoutDashboard size={17} /> },
  { label: "Transactions", href: "/transactions", icon: <ArrowLeftRight size={17} /> },
  { label: "Products",     href: "/products",     icon: <Package size={17} /> },
  { label: "Inventory",    href: "/inventory",    icon: <Database size={17} /> },
];

const bossItems = [
  { label: "Staff",        href: "/staff",        icon: <Users size={17} /> },
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
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="relative group">
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={`
          flex items-center w-full select-none relative
          transition-all duration-400 ease-in-out
          ${isCollapsed ? "py-2.5 px-0 justify-center gap-0" : "py-3 px-4 justify-start gap-2.5"}
          ${active
            ? "bg-slate-50 text-orange-600 border-r-2 border-orange-600"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }
        `}
      >
        <div className={`shrink-0 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>
          {icon}
        </div>
        <span
          className={`
            text-[11px] font-black uppercase tracking-[0.15em] leading-none
            overflow-hidden whitespace-nowrap
            transition-all duration-400 ease-in-out
            ${isCollapsed ? "max-w-0 opacity-0" : "max-w-35 opacity-100"}
          `}
        >
          {label}
        </span>
      </Link>

      {/* Tooltip — shown only when collapsed */}
      {isCollapsed && (
        <div className="
          pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
          px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest
          rounded-sm whitespace-nowrap shadow-lg
          opacity-0 group-hover:opacity-100 transition-opacity duration-150
        ">
          {label}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
        </div>
      )}
    </div>
  );
}

// ─── SidebarContent ───────────────────────────────────────────────────────────

function SidebarContent({
  isCollapsed,
  onClose,
}: Readonly<{ isCollapsed: boolean; onClose: () => void }>) {
  const { user } = useAuth();
  const showManagement = user?.is_boss === true || user?.is_superuser === true;

  return (
    <div className="flex flex-col h-full w-full bg-white">

      {/* ── Brand Section ── */}
      <div
        className={`
          flex items-center h-12.5 border-b border-slate-400 overflow-hidden shrink-0 bg-white
          transition-all duration-400 ease-in-out
          ${isCollapsed ? "justify-center px-0 gap-0" : "justify-start px-4 gap-2"}
        `}
      >
        <div className="flex items-center justify-center shrink-0 w-6">
          <Image src="/ctk.svg" alt="CTK" width={16} height={22} priority className="h-auto" />
        </div>
        <div
          className={`
            flex flex-col leading-none overflow-hidden
            transition-all duration-400 ease-in-out
            ${isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-30"}
          `}
        >
          <p className="text-[17px] font-black tracking-tight uppercase text-slate-950">CTK</p>
          <p className="text-[7px] font-bold tracking-[0.4em] uppercase text-orange-600 mt-0.1 opacity-90">Spare Parts</p>
        </div>
      </div>

      {/* ── Navigation List ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none no-scrollbar pt-3">
        <div className="space-y-0">
          <p
            className={`
              text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-4 px-5
              overflow-hidden whitespace-nowrap
              transition-all duration-400 ease-in-out
              ${isCollapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"}
            `}
          >
            Menu
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

          {showManagement && (
            <>
              <p
                className={`
                  text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-4 mt-8 px-5
                  overflow-hidden whitespace-nowrap
                  transition-all duration-400 ease-in-out
                  ${isCollapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"}
                `}
              >
                Management
              </p>
              {bossItems.map(({ label, href, icon }) => (
                <NavItem
                  key={href}
                  label={label}
                  href={href}
                  icon={icon}
                  isCollapsed={isCollapsed}
                  onClick={onClose}
                />
              ))}
            </>
          )}
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
        absolute top-12.5 -right-3 z-30 hidden md:flex
        items-center justify-center w-6 h-6 rounded-full
        bg-white text-slate-800 border border-slate-500
        hover:text-orange-600 hover:border-orange-200
        active:scale-95 transition-all duration-300
        shadow-xl group/btn cursor-pointer
      "
    >
      <ChevronLeft
        size={14}
        strokeWidth={3.5}
        className={`transition-transform duration-400 ease-in-out ${isCollapsed ? "rotate-180" : "rotate-0"}`}
      />
    </button>
  );
}

// ─── Sidebar (root) ───────────────────────────────────────────────────────────

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: Readonly<Props>) {
  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <div
        className={`
          hidden md:block h-full shrink-0 relative z-20
          transition-all duration-400 ease-in-out
          ${isCollapsed ? "w-12.5 min-w-12.5" : "w-45 min-w-45"}
        `}
      >
        <div className="h-full w-full overflow-hidden border-r border-slate-500">
          <SidebarContent isCollapsed={isCollapsed} onClose={onClose} />
        </div>

        <CollapseToggle isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />
      </div>

      {/* ── Mobile drawer ───────────────────────────────────────────────────── */}
      <div
        className={`
          fixed inset-0 z-40 bg-slate-900/40 md:hidden backdrop-blur-sm
          transition-opacity duration-250 ease
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`
          fixed inset-y-0 left-0 z-50 md:hidden shadow-3xl w-60
          transition-transform duration-400 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <SidebarContent isCollapsed={false} onClose={onClose} />
      </div>
    </>
  );
}
