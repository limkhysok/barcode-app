"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const EXPANDED_W  = 200;
const COLLAPSED_W = 56;
const MOBILE_W    = 280;
const easing      = "0.3s cubic-bezier(0.4, 0, 0.2, 1)";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    label: "Products",
    href: "/products",
    icon: (
      <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: (
      <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: (
      <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
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
  const active   = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`
        flex items-center
        transition-all duration-150 select-none
        ${active
          ? "bg-orange-50 text-orange-700"
          : "text-black hover:bg-slate-50 hover:text-slate-800"
        }
      `}
      style={{
        padding: isCollapsed ? "9px 0" : "9px 30px",
        justifyContent: isCollapsed ? "center" : "flex-start",
        gap: isCollapsed ? 0 : 10,
        transition: `padding ${easing}, gap ${easing}`,
      }}
    >
      {/* Icon — inherits color from parent */}
      <span className="shrink-0">{icon}</span>

      {/* Label — animated collapse */}
      <span
        className="text-xs font-bold uppercase tracking-wide"
        style={{
          maxWidth: isCollapsed ? 0 : 160,
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
    <div className="flex flex-col h-full w-full bg-white border-r border-black-80">

      {/* ── Brand — mobile only (desktop navbar already shows brand) ── */}
      <div
        className="md:hidden flex items-center shrink-0 h-14 border-b border-slate-100"
        style={{
          padding: isCollapsed ? "0 10px" : "0 30px",
          gap: isCollapsed ? 0 : 10,
          justifyContent: isCollapsed ? "center" : "flex-start",
          transition: `padding ${easing}, gap ${easing}`,
        }}
      >
        {/* Logo mark */}
       
          
       

        {/* Brand text */}
        <div
          style={{
            maxWidth: isCollapsed ? 0 : 160,
            opacity: isCollapsed ? 0 : 1,
            overflow: "hidden",
            whiteSpace: "nowrap",
            transition: `max-width ${easing}, opacity ${easing}`,
          }}
        >
          <p className="text-[13px] font-semibold text-slate-900 leading-tight">C T K</p>
          <p className="text-[10px] text-slate-400 leading-tight">SPARE PARTS</p>
        </div>
      </div>

      {/* ── Nav ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-0 py-3 space-y-0.5">

          {/* Group label */}
          <p
            className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-2"
            style={{
              padding: isCollapsed ? "0 4px" : "0 30px",
              maxWidth: isCollapsed ? 0 : 200,
              opacity: isCollapsed ? 0 : 1,
              overflow: "hidden",
              whiteSpace: "nowrap",
              transition: `max-width ${easing}, opacity ${easing}, padding ${easing}`,
            }}
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
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 border-t border-black-80">
        <div
          className="flex items-center"
          style={{
            padding: isCollapsed ? "12px 10px" : "12px 16px",
            gap: isCollapsed ? 0 : 9,
            justifyContent: isCollapsed ? "center" : "flex-start",
            transition: `padding ${easing}, gap ${easing}`,
          }}
        >
          {/* Company icon */}
          <div className="w-6 h-6  bg-slate-100 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>

          {/* Company name */}
          <span
            className="text-[10px] font-bold uppercase text-black leading-snug"
            style={{
              maxWidth: isCollapsed ? 0 : 180,
              opacity: isCollapsed ? 0 : 1,
              overflow: "hidden",
              whiteSpace: "nowrap",
              transition: `max-width ${easing}, opacity ${easing}`,
            }}
          >
            CTK SPARE PARTS CO., LTD.
          </span>
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
        absolute top-4 -right-3 z-30 hidden md:flex
        items-center justify-center w-6 h-6 rounded-full
        bg-white border border-black 
        text-black hover:text-slate-700 hover:border-black 
        hover:scale-110 active:scale-95 transition-all duration-200
      "
    >
      <svg
        className="w-3 h-3"
        fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
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
        {/* Content wrapper — overflow-hidden keeps nav in bounds */}
        <div className="h-full w-full overflow-hidden border-r border-slate-100">
          <SidebarContent isCollapsed={isCollapsed} onClose={onClose} />
        </div>

        {/* Toggle — outside overflow-hidden so it's never clipped */}
        <CollapseToggle isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />
      </div>

      {/* ── Mobile drawer ───────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-40 bg-black/40 md:hidden"
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
