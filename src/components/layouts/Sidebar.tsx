"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const EXPANDED_W = 220;
const COLLAPSED_W = 64;
const MOBILE_W = 280;
const easing = "0.3s cubic-bezier(0.4, 0, 0.2, 1)";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    label: "Scan",
    href: "/dashboard/scan",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
      </svg>
    ),
  },
  {
    label: "Products",
    href: "/dashboard/products",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    label: "Inventory",
    href: "/dashboard/inventory",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
  },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
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

function NavItem({
  label, href, icon, isCollapsed, onClick,
}: Readonly<{ label: string; href: string; icon: React.ReactNode; isCollapsed: boolean; onClick?: () => void }>) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`
        group flex items-center relative rounded-xl text-sm font-medium
        transition-colors duration-150
        ${active
          ? "text-white"
          : "text-slate-400 hover:text-white hover:bg-white/5"
        }
      `}
      style={{
        padding: isCollapsed ? "10px 0" : "10px 12px",
        justifyContent: isCollapsed ? "center" : "flex-start",
        gap: isCollapsed ? 0 : 11,
        background: active ? "rgba(250,73,0,0.13)" : undefined,
        transition: `padding ${easing}, gap ${easing}`,
      }}
    >
      {/* Active left bar */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
          style={{ width: 3, height: 20, background: "#FA4900" }}
        />
      )}
      <span style={{ color: active ? "#FA4900" : "inherit", flexShrink: 0 }}>
        {icon}
      </span>
      {/* Label — animated fade/collapse */}
      <span
        className="truncate"
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

function SidebarInner({
  isCollapsed,
  onClose,
  onToggleCollapse,
  showCollapseToggle,
}: Readonly<{
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  showCollapseToggle: boolean;
}>) {
  return (
    <aside
      className="relative flex flex-col h-full"
      style={{ background: "#0f172a" }}
    >
      {/* Section label */}
      <div
        style={{
          maxWidth: isCollapsed ? 0 : 220,
          opacity: isCollapsed ? 0 : 1,
          overflow: "hidden",
          whiteSpace: "nowrap",
          padding: isCollapsed ? "0" : "18px 16px 8px",
          transition: `max-width ${easing}, opacity ${easing}, padding ${easing}`,
        }}
      >
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase"
          style={{ color: "rgba(148,163,184,0.45)" }}>
          Navigation
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        <div className="space-y-0.5 px-2">
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
      </nav>

      {/* Footer */}
      <div
        className="shrink-0 border-t"
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          padding: isCollapsed ? "12px 0" : "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "flex-start",
          transition: `padding ${easing}`,
        }}
      >
        <span
          style={{
            maxWidth: isCollapsed ? 0 : 180,
            opacity: isCollapsed ? 0 : 1,
            overflow: "hidden",
            whiteSpace: "nowrap",
            transition: `max-width ${easing}, opacity ${easing}`,
            fontSize: 9,
            fontWeight: 500,
            color: "rgba(148,163,184,0.3)",
          }}
        >
          CTK Barcode System
        </span>
        {isCollapsed && (
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "rgba(148,163,184,0.2)" }}
          />
        )}
      </div>

      {/* Collapse toggle — desktop only */}
      {showCollapseToggle && (
        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-1/2 -translate-y-1/2 -right-3.5 z-10 hidden md:flex
            items-center justify-center w-7 h-7 rounded-full shadow-lg
            hover:scale-110 transition-transform"
          style={{
            background: "#1e293b",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(148,163,184,0.7)",
          }}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
            style={{
              transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
              transition: `transform ${easing}`,
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}
    </aside>
  );
}

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: Readonly<Props>) {
  const desktopW = isCollapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <>
      {/* ── Desktop / Tablet sidebar (md+) ── */}
      <div
        className="hidden md:flex h-full shrink-0"
        style={{ width: desktopW, transition: `width ${easing}` }}
      >
        <SidebarInner
          isCollapsed={isCollapsed}
          onClose={onClose}
          onToggleCollapse={onToggleCollapse}
          showCollapseToggle
        />
      </div>

      {/* ── Mobile drawer (< md) ── */}
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <div
        className="fixed inset-y-0 left-0 z-50 md:hidden"
        style={{
          width: MOBILE_W,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: `transform ${easing}`,
        }}
      >
        <SidebarInner
          isCollapsed={false}
          onClose={onClose}
          onToggleCollapse={onToggleCollapse}
          showCollapseToggle={false}
        />
      </div>
    </>
  );
}
