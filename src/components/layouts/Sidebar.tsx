"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  Database,
  ArrowLeftRight,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";

const EXPANDED_W = 180;
const COLLAPSED_W = 50;
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
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="relative group">
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={`
          flex items-center w-full transition-all duration-300 select-none relative
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

// ─── UserFooter ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = { superadmin: "Super Admin", boss: "Boss", staff: "Staff" };

function UserFooter({ isCollapsed }: Readonly<{ isCollapsed: boolean }>) {
  const { user, role, logout } = useAuth();
  const router = useRouter();

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "??";
  const roleLabel = ROLE_LABELS[role] ?? "Staff";

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="border-t border-slate-100 shrink-0">
      {/* User row */}
      <div
        className="flex items-center gap-3 overflow-hidden"
        style={{
          justifyContent: isCollapsed ? "center" : "flex-start",
          padding: isCollapsed ? "12px 0" : "12px 16px",
          transition: `padding ${easing}`,
        }}
      >
        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
          <span className="text-[9px] font-black text-white leading-none">{initials}</span>
        </div>

        <div
          className="flex-1 min-w-0"
          style={{
            opacity: isCollapsed ? 0 : 1,
            maxWidth: isCollapsed ? 0 : 120,
            overflow: "hidden",
            transition: `opacity ${easing}, max-width ${easing}`,
          }}
        >
          <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest truncate leading-none">
            {user?.username ?? "—"}
          </p>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 leading-none">
            {roleLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-sm text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer ${
            isCollapsed ? "hidden" : ""
          }`}
        >
          <LogOut size={13} strokeWidth={2.5} />
        </button>
      </div>

      {/* Collapsed logout */}
      {isCollapsed && (
        <div className="relative group flex justify-center pb-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-8 h-8 flex items-center justify-center rounded-sm text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut size={14} strokeWidth={2.5} />
          </button>
          <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-sm whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {"Logout"}
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
          </div>
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
  return (
    <div className="flex flex-col h-full w-full bg-white">

      {/* ── Brand Section ── */}
      <div
        className="flex items-center px-5 h-12.5 border-b border-slate-200 overflow-hidden shrink-0 bg-white"
        style={{
          justifyContent: isCollapsed ? "center" : "flex-start",
          padding: isCollapsed ? "0" : "0 20px",
          gap: isCollapsed ? 0 : 12,
        }}
      >
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <Image src="/ctk.svg" alt="CTK" width={24} height={24} priority />
        </div>
        <div
          className="flex flex-col leading-none"
          style={{
            opacity: isCollapsed ? 0 : 1,
            maxWidth: isCollapsed ? 0 : 120,
            transition: `opacity ${easing}, max-width ${easing}`,
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

      {/* ── User Footer ── */}
      <UserFooter isCollapsed={isCollapsed} />
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
