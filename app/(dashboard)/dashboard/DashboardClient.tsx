"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Package,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  RefreshCw,
  Boxes,
  Activity,
  ChevronRight,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
} from "recharts";
import { getDashboardStats } from "@/src/services/dashboard.service";
import type { DashboardStats } from "@/src/types/dashboard.types";

type RangeLabel = "today" | "7_days" | "14_days" | "30_days" | "3_months" | "12_months" | "all_time" | "custom";

const RANGE_TABS: { label: string; value: RangeLabel }[] = [
  { label: "Today",     value: "today"     },
  { label: "7 Days",    value: "7_days"    },
  { label: "14 Days",   value: "14_days"   },
  { label: "30 Days",   value: "30_days"   },
  { label: "3 Months",  value: "3_months"  },
  { label: "12 Months", value: "12_months" },
  { label: "All Time",  value: "all_time"  },
  { label: "Custom",    value: "custom"    },
];


function RangeTabs({
  value,
  onChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: Readonly<{
  value: RangeLabel;
  onChange: (v: RangeLabel) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (v: string) => void;
  onCustomEndChange: (v: string) => void;
}>) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLabel = RANGE_TABS.find((t) => t.value === value)?.label ?? "Select Date";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleTriggerClick() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const dropdownW = 220;
    const spaceBelow = window.innerHeight - r.bottom;
    const style: React.CSSProperties = { position: "fixed", zIndex: 9999, width: dropdownW };
    if (spaceBelow < 340) {
      style.bottom = window.innerHeight - r.top + 4;
    } else {
      style.top = r.bottom + 4;
    }
    const rightAligned = r.right - dropdownW;
    style.left = Math.max(8, rightAligned);
    setPos(style);
    setOpen((v) => !v);
  }

  function handleSelect(v: RangeLabel) {
    onChange(v);
    if (v !== "custom") setOpen(false);
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        className="flex items-center gap-2 h-8 px-3 text-[10px] font-black uppercase tracking-widest border border-slate-500 rounded-sm bg-white text-slate-600 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all cursor-pointer active:scale-95"
      >
        <span>{currentLabel}</span>
        <ChevronDown size={11} strokeWidth={3} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          style={pos}
          className="bg-white border border-slate-500 rounded-sm shadow-lg py-1 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {RANGE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleSelect(tab.value)}
              className={`flex items-center justify-between px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-left transition-colors cursor-pointer ${
                value === tab.value
                  ? "bg-orange-50 text-orange-500"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <span>{tab.label}</span>
              {value === tab.value && <Check size={11} strokeWidth={3} className="text-orange-500 shrink-0" />}
            </button>
          ))}

          {value === "custom" && (
            <div className="border-t border-slate-500 mt-1 px-4 pt-3 pb-3 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">From</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => onCustomStartChange(e.target.value)}
                  className="h-8 px-2.5 text-[11px] font-bold border border-slate-500 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-orange-400 cursor-pointer hover:border-slate-500 transition-colors w-full"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">To</span>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  onChange={(e) => onCustomEndChange(e.target.value)}
                  className="h-8 px-2.5 text-[11px] font-bold border border-slate-500 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-orange-400 cursor-pointer hover:border-slate-500 transition-colors w-full"
                />
              </div>
              <button
                type="button"
                disabled={!customStart || !customEnd || customStart > customEnd}
                onClick={() => setOpen(false)}
                className="h-7 text-[10px] font-black uppercase tracking-widest bg-orange-500 text-white rounded-sm hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


interface ChartTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: Readonly<ChartTooltipProps>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-500 rounded-sm shadow-md px-3.5 py-3 min-w-35">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2.5 border-b border-slate-500 pb-2">{label}</p>
      <div className="flex flex-col gap-2">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{entry.name}</span>
            </div>
            <span className="text-[11px] font-black tabular-nums text-slate-800">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTxDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString();
}

interface DashboardClientProps {
  initialStats: DashboardStats | null;
  initialRange?: RangeLabel;
}

export default function DashboardClient({ initialStats, initialRange = "30_days" }: Readonly<DashboardClientProps>) {
  const [range, setRange]             = useState<RangeLabel>(initialRange);
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [stats, setStats]             = useState<DashboardStats | null>(initialStats);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [mounted, setMounted]         = useState(false);
  const skipInitialFetch              = useRef(!!initialStats);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStats = useCallback(async (r: RangeLabel, start?: string, end?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await getDashboardStats(undefined, { range: r, start, end });
      if (data) setStats(data);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "Failed to load stats. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    if (range === "custom") {
      if (customStart && customEnd && customStart <= customEnd) {
        fetchStats("custom", customStart, customEnd);
      }
      return;
    }
    fetchStats(range);
  }, [range, customStart, customEnd, fetchStats]);

  const products     = stats?.products;
  const inventory    = stats?.inventory;
  const transactions = stats?.transactions;

const chartData = useMemo(() => {
    const rangeStart = stats?.range?.start ? stats.range.start.slice(0, 10) : null;
    const rangeEnd   = stats?.range?.end   ? stats.range.end.slice(0, 10)   : null;

    const groups: { [key: string]: { date: string; isoKey: string; receive: number; sale: number } } = {};
    (transactions?.recent_activity ?? []).forEach(tx => {
      const dateObj = new Date(tx.transaction_date);
      const isoKey = dateObj.toISOString().slice(0, 10);
      if (rangeStart && isoKey < rangeStart) return;
      if (rangeEnd   && isoKey > rangeEnd)   return;
      if (!groups[isoKey]) groups[isoKey] = { date: dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }), isoKey, receive: 0, sale: 0 };
      if (tx.transaction_type === "Receive") groups[isoKey].receive += tx.total_quantity;
      else groups[isoKey].sale += tx.total_quantity;
    });
    return Object.values(groups).sort((a, b) => a.isoKey.localeCompare(b.isoKey));
  }, [stats, transactions]);

  return (
    <div className="px-4 py-5 sm:px-5 sm:py-5 space-y-3">
      
      {/* ── HEADER: MOBILE (< sm) — single row ── */}
      <div className="sm:hidden flex items-center justify-between gap-2">
        <div className="flex flex-col border-l-2 border-orange-500 pl-3 shrink-0">
          <h1 className="text-[14px] font-black text-slate-950 uppercase tracking-[0.2em] leading-none">Dashboard</h1>
          <p className="text-[8px] text-orange-500 font-black uppercase tracking-widest mt-0.5">Overview</p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <RangeTabs
            value={range}
            onChange={setRange}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />
          <button
            type="button"
            onClick={() => fetchStats(range, customStart || undefined, customEnd || undefined)}
            disabled={loading}
            className="p-2 border border-slate-500 rounded-sm text-slate-400 active:bg-slate-50 transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw size={14} strokeWidth={3} className={loading ? "animate-spin text-orange-500" : ""} />
          </button>
        </div>
      </div>

      {/* ── HEADER: TABLET / DESKTOP (≥ sm) ── */}
      <div className="hidden sm:flex flex-col gap-4 md:flex-row md:items-center md:justify-between ">
        <div className="flex flex-col border-l-4 border-orange-500 pl-4">
          <h1 className="text-[16px] font-black text-slate-950 uppercase tracking-[0.25em] leading-tight">
            Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Command Center / Integrated Logistics
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <RangeTabs
              value={range}
              onChange={setRange}
              customStart={customStart}
              customEnd={customEnd}
              onCustomStartChange={setCustomStart}
              onCustomEndChange={setCustomEnd}
            />
            <button
              type="button"
              onClick={() => fetchStats(range, customStart || undefined, customEnd || undefined)}
              disabled={loading}
              className="group flex items-center gap-2 px-4 h-8 text-[10px] font-black uppercase tracking-widest border border-slate-500 rounded-sm text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <RefreshCw
                size={12}
                strokeWidth={3}
                className={`transition-transform duration-500 ${loading ? "animate-spin" : "group-hover:rotate-180"}`}
              />
              <span>Sync</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium text-red-500 bg-red-50 border border-red-200 px-4 py-3 rounded-sm uppercase tracking-widest">
          {error}
        </p>
      )}

      {/* ── KPI GRID ── mobile: 3 col compact │ tablet(md): medium │ desktop(lg): full ── */}
      <div className={`grid grid-cols-3 gap-2 md:gap-3 lg:gap-3 transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>

        {/* ── Products ── */}
        <Link href="/products" className="bg-white border border-slate-500 rounded-sm hover:border-orange-300 transition-colors group h-full flex flex-col
          p-2.5 md:p-4 lg:p-5">
          {/* MOBILE: icon top + number centered */}
          <div className="flex flex-col items-center gap-1.5 md:hidden">
            <div className="w-8 h-8 rounded-sm bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:scale-110 group-hover:shadow-md transition-all duration-200">
              <Package className="w-4 h-4 text-orange-500 group-hover:text-white group-hover:-rotate-12 transition-all duration-200" strokeWidth={2} />
            </div>
            <p className="text-base font-black text-slate-900 tabular-nums tracking-tighter group-hover:text-orange-600 transition-colors leading-none">{(products?.total ?? 0).toLocaleString()}</p>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide text-center leading-tight">Products</span>
          </div>
          {/* TABLET + DESKTOP */}
          <div className="hidden md:flex md:flex-col md:gap-2 lg:gap-3 h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover/hdr:text-orange-500 transition-colors duration-200">Total Products</p>
                <p className="font-black text-slate-900 leading-none tabular-nums tracking-tighter mt-1 group-hover:text-orange-600 transition-colors md:text-xl lg:text-2xl">
                  {(products?.total ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-sm bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:scale-110 group-hover:shadow-md transition-all duration-200 md:w-8 md:h-8 lg:w-9 lg:h-9">
                <Package className="text-orange-500 group-hover:text-white group-hover:-rotate-12 transition-all duration-200 md:w-4 md:h-4 lg:w-4.5 lg:h-4.5" strokeWidth={2} />
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-auto pt-2 border-t border-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-400 uppercase tracking-widest md:text-[9px]">All items</span>
                <span className="hidden lg:block text-[10px] font-black text-orange-400 uppercase">Live</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-50 overflow-hidden">
                <div className="h-full bg-orange-300 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        </Link>

        {/* ── Low Stock ── */}
        <Link href="/inventory" className="bg-white border border-slate-500 rounded-sm hover:border-orange-300 transition-colors group h-full flex flex-col
          p-2.5 md:p-4 lg:p-5">
          {/* MOBILE */}
          <div className="flex flex-col items-center gap-1.5 md:hidden">
            <div className={`w-8 h-8 rounded-sm flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-200 ${(inventory?.needs_reorder ?? 0) > 0 ? "bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white" : "bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white"}`}>
              <AlertCircle className="w-4 h-4 group-hover:rotate-12 transition-all duration-200" strokeWidth={2} />
            </div>
            <p className={`text-base font-black tabular-nums tracking-tighter group-hover:text-orange-600 transition-colors leading-none ${(inventory?.needs_reorder ?? 0) > 0 ? "text-red-500" : "text-slate-900"}`}>{(inventory?.needs_reorder ?? 0).toLocaleString()}</p>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide text-center leading-tight">Low Stock</span>
          </div>
          {/* TABLET + DESKTOP */}
          <div className="hidden md:flex md:flex-col md:gap-2 lg:gap-3 h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover/hdr:text-orange-500 transition-colors duration-200">Low Stock</p>
                <p className={`font-black leading-none tabular-nums tracking-tighter mt-1 group-hover:text-orange-600 transition-colors md:text-xl lg:text-2xl ${(inventory?.needs_reorder ?? 0) > 0 ? "text-red-500" : "text-slate-900"}`}>
                  {(inventory?.needs_reorder ?? 0).toLocaleString()}
                </p>
              </div>
              <div className={`rounded-sm flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-md transition-all duration-200 md:w-8 md:h-8 lg:w-9 lg:h-9 ${(inventory?.needs_reorder ?? 0) > 0 ? "bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white" : "bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white"}`}>
                <AlertCircle className="group-hover:rotate-12 transition-all duration-200 md:w-4 md:h-4 lg:w-4.5 lg:h-4.5" strokeWidth={2} />
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-auto pt-2 border-t border-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-400 uppercase tracking-widest md:text-[9px]">Out of stock</span>
                <span className={`hidden lg:block text-[10px] font-black uppercase ${(products?.out_of_stock ?? 0) > 0 ? "text-red-500" : "text-orange-400"}`}>
                  {products?.out_of_stock ?? 0} items
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-50 overflow-hidden flex">
                <div className="bg-red-500" style={{ width: `${products?.total ? Math.min(100, ((products.out_of_stock ?? 0) / products.total) * 100) : 0}%` }} />
                <div className="bg-orange-400 flex-1" />
              </div>
            </div>
          </div>
        </Link>

        {/* ── Transactions ── */}
        <Link href="/transactions" className="bg-white border border-slate-500 rounded-sm hover:border-orange-300 transition-colors group h-full flex flex-col
          p-2.5 md:p-4 lg:p-5">
          {/* MOBILE */}
          <div className="flex flex-col items-center gap-1.5 md:hidden">
            <div className="w-8 h-8 rounded-sm bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:scale-110 group-hover:shadow-md transition-all duration-200">
              <Boxes className="w-4 h-4 text-orange-500 group-hover:text-white group-hover:rotate-12 transition-all duration-200" strokeWidth={2} />
            </div>
            <p className="text-base font-black text-slate-900 tabular-nums tracking-tighter group-hover:text-orange-600 transition-colors leading-none">{(transactions?.total ?? 0).toLocaleString()}</p>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide text-center leading-tight">transactions</span>
          </div>
          {/* TABLET + DESKTOP */}
          <div className="hidden md:flex md:flex-col md:gap-2 lg:gap-3 h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover/hdr:text-orange-500 transition-colors duration-200">Transactions</p>
                <p className="font-black text-slate-900 leading-none tabular-nums tracking-tighter mt-1 group-hover:text-orange-600 transition-colors md:text-xl lg:text-2xl">
                  {(transactions?.total ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-sm bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:scale-110 group-hover:shadow-md transition-all duration-200 md:w-8 md:h-8 lg:w-9 lg:h-9">
                <Boxes className="text-orange-500 group-hover:text-white group-hover:rotate-12 transition-all duration-200 md:w-4 md:h-4 lg:w-4.5 lg:h-4.5" strokeWidth={2} />
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-auto pt-2 border-t border-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-400 uppercase tracking-widest md:text-[9px]">This period</span>
                <span className="hidden lg:block text-[10px] font-black text-slate-500 uppercase">Total</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-50 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        </Link>

      </div>

      {/* ── ANALYTICS + SIGNAL LOG ── */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        <div className="lg:col-span-2 bg-white border border-slate-500 rounded-sm p-5 sm:p-6 lg:p-8 flex flex-col overflow-hidden min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 group/hdr cursor-default">
              <Activity size={12} className="text-orange-500 transition-transform duration-200 group-hover/hdr:scale-125 group-hover/hdr:rotate-12" strokeWidth={3} />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover/hdr:text-orange-500 transition-colors duration-200">Analytics Summary</h2>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Receive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Sale</span>
              </div>
            </div>
          </div>

          <div className="w-full min-w-0 relative">
            {mounted && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 2' }} />
                  <Area type="monotone" dataKey="receive" stroke="#22C55E" strokeWidth={2.5} fill="#22C55E" fillOpacity={0.05} />
                  <Area type="monotone" dataKey="sale" stroke="#F97316" strokeWidth={2.5} fill="#F97316" fillOpacity={0.05} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-75 flex flex-col items-center justify-center gap-4 text-slate-200">
                <Boxes size={48} strokeWidth={1} className="opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No trend data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-500 rounded-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-500 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2 group/hdr cursor-default">
              <Clock size={12} className="text-orange-500 transition-transform duration-200 group-hover/hdr:scale-125 group-hover/hdr:-rotate-12" strokeWidth={3} />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover/hdr:text-orange-500 transition-colors duration-200">Signal Log</h2>
            </div>
            <Link href="/transactions" className="group/hist text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-500 transition-colors flex items-center gap-1">
              History <ChevronRight size={10} strokeWidth={4} className="transition-transform duration-150 group-hover/hist:translate-x-0.5" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-100">
            {(transactions?.recent_activity ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Clock size={36} strokeWidth={1} className="text-slate-200" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No transactions in this period</p>
              </div>
            ) : (transactions?.recent_activity ?? []).map((txn, i) => (
              <Link key={txn.id} href="/transactions" className={`group/row flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors ${i % 2 === 1 ? "bg-slate-50/20" : ""}`}>
                <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center transition-all duration-200 group-hover/row:scale-110 group-hover/row:shadow-sm ${txn.transaction_type === "Receive" ? "bg-green-50 text-green-600 group-hover/row:bg-green-500 group-hover/row:text-white" : "bg-orange-50 text-orange-600 group-hover/row:bg-orange-500 group-hover/row:text-white"}`}>
                  {txn.transaction_type === "Receive" ? <ArrowDownLeft size={16} strokeWidth={3} /> : <ArrowUpRight size={16} strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">#{txn.id}</span>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${txn.transaction_type === "Receive" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{txn.transaction_type}</span>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">By {txn.performed_by ?? "Unknown"} · {txn.item_count} items</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black text-slate-700 tabular-nums">{new Date(txn.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-[9px] font-black text-slate-300 uppercase tabular-nums">{formatTxDate(txn.transaction_date)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
