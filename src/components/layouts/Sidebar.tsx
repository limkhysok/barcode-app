"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const EXPANDED_W = 200;
const COLLAPSED_W = 60;

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
    label: "Products",
    href: "/dashboard/products",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
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

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: Readonly<Props>) {
  const pathname = usePathname();

  const w = isCollapsed ? COLLAPSED_W : EXPANDED_W;

  // Shared fade style for labels/text that disappear when collapsed
  function fadeStyle(delayMs = 0) {
    return {
      maxWidth: isCollapsed ? "0px" : "200px",
      opacity: isCollapsed ? 0 : 1,
      overflow: "hidden" as const,
      whiteSpace: "nowrap" as const,
      transition: `max-width ${easing}, opacity ${easing}`,
      transitionDelay: delayMs ? `${delayMs}ms` : undefined,
    };
  }

  const inner = (
    <aside
      className="relative bg-white border-r border-gray-100 flex flex-col h-full"
      style={{ width: w, transition: `width ${easing}` }}
    >
      {/* Nav */}
      <nav className="flex-1 py-0 space-y-0.5 overflow-y-auto" style={{ overflowX: "clip" }}>

        {navItems.map(({ label, href, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={isCollapsed ? label : undefined}
              className={`flex items-center text-sm font-medium group ${
                active ? "text-white shadow-sm" : "rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
              style={{
                padding: isCollapsed ? "10px 0" : "15px 12px",
                justifyContent: isCollapsed ? "center" : "flex-start",
                gap: isCollapsed ? 0 : 12,
                borderRadius: active ? 0 : undefined,
                transition: `padding ${easing}, gap ${easing}`,
                ...(active ? { background: "linear-gradient(135deg, #FA4900, #b91c1c)" } : {}),
              }}
            >
              <span className={active ? "text-white" : "text-gray-400 group-hover:text-gray-700 transition-colors"}>
                {icon}
              </span>
              <span style={fadeStyle()}>{label}</span>
            </Link>
          );
        })}
      </nav>


      {/* Collapse / expand — centered on right border */}
      <button
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute top-1/2 -right-3.5 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 shadow-md text-gray-400 hover:text-gray-700 hover:border-gray-300 hover:shadow-lg transition-all"
        style={{ transform: "translateY(-50%)" }}
      >
        <svg
          className="w-3.5 h-3.5"
          style={{ transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)", transition: `transform ${easing}` }}
          fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
    </aside>
  );

  return (
    <>
      {/* Desktop — sticky, width driven by aside transition */}
      <div
        className="hidden md:flex h-full shrink-0"
        style={{ width: w, transition: `width ${easing}` }}
      >
        {inner}
      </div>

      {/* Mobile — slide-in drawer */}
      {isOpen && (
        <>
          <button
            aria-label="Close sidebar"
            className="fixed inset-0 z-40 bg-black/40 md:hidden w-full cursor-default"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex md:hidden h-full" style={{ width: w, transition: `width ${easing}` }}>
            {inner}
          </div>
        </>
      )}
    </>
  );
}
