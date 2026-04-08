"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const EXPANDED_W = 200;
const COLLAPSED_W = 65;
const MOBILE_W = 220;
const easing = "0.4s cubic-bezier(0.4, 0, 0.2, 1)";

const navItems = [
  {
    label: "Transactions",
    href: "/transactions",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    label: "Products",
    href: "/products",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
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
        flex items-center w-full transition-all duration-200 select-none group
        ${active
          ? "bg-orange-500 text-white"
          : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
        }
      `}
      style={{
        padding: isCollapsed ? "11px 0" : "11px 20px",
        justifyContent: isCollapsed ? "center" : "flex-start",
        gap: isCollapsed ? 0 : 10,
        transition: `padding ${easing}, gap ${easing}`,
      }}
    >
      <span className="shrink-0">{icon}</span>
      <span
        className="text-[11px] font-black uppercase tracking-widest leading-none"
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
    <div className="flex flex-col h-full w-full bg-white border-r border-gray-200">

      {/* ── Brand ── */}


      {/* ── Nav ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none no-scrollbar">
        <div className="py-4">
          <p
            className="text-[9px] font-black text-slate-300 uppercase tracking-[0.25em] mb-2 px-5"
            style={{
              maxWidth: isCollapsed ? 0 : 160,
              opacity: isCollapsed ? 0 : 1,
              overflow: "hidden",
              whiteSpace: "nowrap",
              transition: `max-width ${easing}, opacity ${easing}`,
            }}
          >
            MENU
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
        absolute top-5 -right-3.5 z-30 hidden md:flex
        items-center justify-center w-7 h-7 rounded-full
        bg-orange-500 text-white border border-gray-100
        hover:bg-orange-500 hover:scale-110 active:scale-95 transition-all duration-200
        shadow-lg
      "
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24"
        style={{
          transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
          transition: `transform ${easing}`,
        }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
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
        <div className="h-full w-full overflow-hidden border-r border-gray-100">
          <SidebarContent isCollapsed={isCollapsed} onClose={onClose} />
        </div>

        <CollapseToggle isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />
      </div>

      {/* ── Mobile drawer ───────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-40 bg-black/60 md:hidden"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-y-0 left-0 z-50 md:hidden shadow-2xl"
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
