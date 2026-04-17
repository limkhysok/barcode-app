"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Database,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Tag,
  MapPin,
  RefreshCw,
  Boxes,
} from "lucide-react";
import { getDashboardStats } from "@/src/services/dashboard.service";
import type { DashboardStats } from "@/src/types/dashboard.types";

type RangeLabel = "today" | "week" | "month" | "all_time" | "custom";

const RANGE_TABS: { label: string; value: RangeLabel }[] = [
  { label: "Today",    value: "today"    },
  { label: "Week",     value: "week"     },
  { label: "Month",    value: "month"    },
  { label: "All Time", value: "all_time" },
  { label: "Custom",   value: "custom"   },
];

function RangeTabs({ value, onChange }: Readonly<{ value: RangeLabel; onChange: (v: RangeLabel) => void }>) {
  return (
    <>
      {RANGE_TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all duration-150 whitespace-nowrap cursor-pointer ${
            value === tab.value
              ? "bg-orange-500 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-600 hover:bg-white/50 active:text-slate-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </>
  );
}

function CustomDateRange({
  start,
  end,
  onStartChange,
  onEndChange,
}: Readonly<{
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}>) {
  return (
    <>
      <input
        type="date"
        value={start}
        onChange={(e) => onStartChange(e.target.value)}
        className="flex-1 md:flex-none h-8 px-2.5 text-[11px] font-bold border border-slate-200 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-orange-400 cursor-pointer hover:border-slate-300 transition-colors"
      />
      <span className="text-[9px] text-slate-400 font-black uppercase">to</span>
      <input
        type="date"
        value={end}
        min={start}
        onChange={(e) => onEndChange(e.target.value)}
        className="flex-1 md:flex-none h-8 px-2.5 text-[11px] font-bold border border-slate-200 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-orange-400 cursor-pointer hover:border-slate-300 transition-colors"
      />
    </>
  );
}

interface DashboardClientProps {
  initialStats: DashboardStats | null;
}

export default function DashboardClient({ initialStats }: Readonly<DashboardClientProps>) {
  const [range, setRange]             = useState<RangeLabel>("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd]     = useState("");
  const [stats, setStats]             = useState<DashboardStats | null>(initialStats);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const fetchStats = useCallback(async (r: RangeLabel, start?: string, end?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await getDashboardStats(undefined, { range: r, start, end });
      if (data) setStats(data);
    } catch {
      setError("Failed to load stats. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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
  const receive      = transactions?.by_type?.Receive;
  const sale         = transactions?.by_type?.Sale;

  return (
    <div className="px-4 py-5 md:px-6 md:py-5 space-y-4">

      {/* ── Mobile Header (< md) ── */}
      <div className="md:hidden flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[14px] font-black text-slate-950 uppercase tracking-[0.2em] leading-none">Dashboard</h1>
            <p className="text-[9px] text-orange-500 font-bold uppercase mt-1">Overview</p>
          </div>
          <button
            type="button"
            onClick={() => fetchStats(range, customStart || undefined, customEnd || undefined)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-sm text-gray-400 active:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            <RefreshCw size={10} strokeWidth={3} className={loading ? "animate-spin text-orange-500" : ""} />
            <span>Sync</span>
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-none -mx-2 px-2">
          <div className="flex items-center bg-slate-100 rounded-sm p-0.5 gap-0.5 w-fit">
            <RangeTabs value={range} onChange={setRange} />
          </div>
        </div>

        {range === "custom" && (
          <div className="flex items-center gap-2">
            <CustomDateRange
              start={customStart}
              end={customEnd}
              onStartChange={setCustomStart}
              onEndChange={setCustomEnd}
            />
          </div>
        )}
      </div>

      {/* ── Desktop / Tablet Header (≥ md) ── */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col border-l-4 border-orange-500 pl-4">
          <h1 className="text-[15px] lg:text-[16px] font-black text-slate-950 uppercase tracking-[0.25em] leading-tight">
            Overview Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden lg:block">
              Command Center / Logistics Intelligence
            </p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest lg:hidden">
              Logistics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100/80 rounded-sm p-0.5 gap-0.5">
            <RangeTabs value={range} onChange={setRange} />
          </div>

          {range === "custom" && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
              <CustomDateRange
                start={customStart}
                end={customEnd}
                onStartChange={setCustomStart}
                onEndChange={setCustomEnd}
              />
            </div>
          )}

          <div className="w-px h-6 bg-slate-200" />

          <button
            type="button"
            onClick={() => fetchStats(range, customStart || undefined, customEnd || undefined)}
            disabled={loading}
            className="group flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-sm text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-all disabled:opacity-50 cursor-pointer shrink-0 active:scale-95"
          >
            <RefreshCw
              size={12}
              strokeWidth={3}
              className={`transition-transform duration-500 ${loading ? "animate-spin" : "group-hover:rotate-180"}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium text-red-500 bg-red-50 border border-red-200 px-4 py-2.5 rounded-sm">
          {error}
        </p>
      )}

      {/* ── Content (dims while loading) ── */}
      <div className={`space-y-4 transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>

        {/* ── KPI Cards ──
            Mobile  : 2 cols
            Tablet  : 2 cols (md)
            Desktop : 4 cols (lg)
        ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Products */}
          <Link href="/products" className="block rounded-md border border-slate-200 bg-white p-3 md:p-4 hover:border-orange-500/30 transition-colors">
            <div className="flex items-start justify-between pb-2">
              <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-slate-400 leading-none">Products</p>
              <Package className="h-6 w-6 md:h-8 md:w-8 text-orange-500/70 shrink-0" strokeWidth={1.5} />
            </div>
            <p className="text-2xl md:text-3xl font-black tracking-tighter text-slate-950 leading-none tabular-nums">
              {(products?.total ?? 0).toLocaleString()}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">In range</span>
              <span className={`text-[9px] md:text-[10px] font-black uppercase ${(products?.low_stock ?? 0) > 0 ? "text-red-500" : "text-slate-300"}`}>
                {products?.low_stock ?? 0} low
              </span>
            </div>
          </Link>

          {/* Stock Value */}
          <Link href="/inventory" className="block rounded-md border border-slate-200 bg-white p-3 md:p-4 hover:border-orange-500/30 transition-colors">
            <div className="flex items-start justify-between pb-2">
              <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-slate-400 leading-none">Stock Value</p>
              <Database className="h-6 w-6 md:h-8 md:w-8 text-orange-500/70 shrink-0" strokeWidth={1.5} />
            </div>
            <p className="text-2xl md:text-3xl font-black tracking-tighter text-slate-950 leading-none tabular-nums">
              ${Number.parseFloat(inventory?.total_stock_value ?? "0").toLocaleString()}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Updated</span>
              <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tabular-nums">
                {(inventory?.total_quantity ?? 0).toLocaleString()} units
              </span>
            </div>
          </Link>

          {/* Low Stock */}
          <Link
            href="/inventory"
            className={`block rounded-md border bg-white p-3 md:p-4 transition-colors ${
              (inventory?.needs_reorder ?? 0) > 0
                ? "border-red-200 hover:border-red-300"
                : "border-slate-200 hover:border-orange-500/30"
            }`}
          >
            <div className="flex items-start justify-between pb-2">
              <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-slate-400 leading-none">Low Stock</p>
              <AlertCircle
                className={`h-6 w-6 md:h-8 md:w-8 shrink-0 ${(inventory?.needs_reorder ?? 0) > 0 ? "text-red-400" : "text-slate-300"}`}
                strokeWidth={1.5}
              />
            </div>
            <p className={`text-2xl md:text-3xl font-black tracking-tighter leading-none tabular-nums ${
              (inventory?.needs_reorder ?? 0) > 0 ? "text-red-600" : "text-slate-950"
            }`}>
              {(inventory?.needs_reorder ?? 0).toLocaleString()}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Out of stock</span>
              <span className={`text-[9px] md:text-[10px] font-black uppercase ${(products?.out_of_stock ?? 0) > 0 ? "text-red-500" : "text-slate-300"}`}>
                {products?.out_of_stock ?? 0}
              </span>
            </div>
          </Link>

          {/* Transactions */}
          <Link href="/transactions" className="block rounded-md border border-slate-200 bg-white p-3 md:p-4 hover:border-orange-500/30 transition-colors">
            <div className="flex items-start justify-between pb-2">
              <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-slate-400 leading-none">Transactions</p>
              <Boxes className="h-6 w-6 md:h-8 md:w-8 text-orange-500/70 shrink-0" strokeWidth={1.5} />
            </div>
            <p className="text-2xl md:text-3xl font-black tracking-tighter text-slate-950 leading-none tabular-nums">
              {(transactions?.total ?? 0).toLocaleString()}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">In range</span>
              <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tabular-nums">
                {(receive?.count ?? 0) + (sale?.count ?? 0)} total
              </span>
            </div>
          </Link>
        </div>

        {/* ── Middle Row ──
            Mobile  : 1 col
            Tablet  : 2 cols (Category + Transactions side by side, By Site full-width below)
            Desktop : 3 equal cols
        ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* By Category */}
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag size={11} className="text-orange-500" strokeWidth={3} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">By Category</h2>
              </div>
              <Link href="/products" className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors">
                View all
              </Link>
            </div>
            <div className="space-y-1">
              {(products?.by_category ?? []).length === 0 ? (
                <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest py-6 text-center">No data</p>
              ) : (
                (products?.by_category ?? []).map((cat) => {
                  const pct = products?.total ? (cat.count / products.total) * 100 : 0;
                  return (
                    <Link
                      key={cat.category}
                      href="/products"
                      className="block py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 rounded-sm transition-colors -mx-1 px-1"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 truncate pr-2">
                          {cat.category}
                        </span>
                        <span className="text-[11px] font-black text-slate-950 tabular-nums shrink-0">
                          {cat.count}
                        </span>
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low stock alerts</span>
              <span className={`text-[10px] font-black uppercase ${(products?.low_stock ?? 0) > 0 ? "text-red-500" : "text-green-600"}`}>
                {products?.low_stock ?? 0} items
              </span>
            </div>
          </div>

          {/* Transaction Breakdown */}
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Boxes size={11} className="text-orange-500" strokeWidth={3} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">Transactions</h2>
              </div>
              <Link href="/transactions" className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              <Link href="/transactions" className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-sm hover:bg-green-100/60 transition-colors">
                <div className="w-8 h-8 rounded-sm bg-green-500 flex items-center justify-center shrink-0">
                  <ArrowDownLeft size={13} className="text-white" strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-700">Receive</p>
                  <p className="text-[9px] text-green-600 font-bold uppercase tracking-widest tabular-nums">
                    {(receive?.total_quantity ?? 0).toLocaleString()} units
                  </p>
                </div>
                <p className="text-2xl font-black text-green-700 tabular-nums shrink-0">
                  {(receive?.count ?? 0).toLocaleString()}
                </p>
              </Link>

              <Link href="/transactions" className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-sm hover:bg-orange-100/60 transition-colors">
                <div className="w-8 h-8 rounded-sm bg-orange-500 flex items-center justify-center shrink-0">
                  <ArrowUpRight size={13} className="text-white" strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-700">Sale</p>
                  <p className="text-[9px] text-orange-600 font-bold uppercase tracking-widest tabular-nums">
                    {(sale?.total_quantity ?? 0).toLocaleString()} units
                  </p>
                </div>
                <p className="text-2xl font-black text-orange-700 tabular-nums shrink-0">
                  {(sale?.count ?? 0).toLocaleString()}
                </p>
              </Link>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {(transactions?.total ?? 0).toLocaleString()} total in range
              </span>
            </div>
          </div>

          {/* Inventory by Site
              Tablet  : col-span-2 (full width below Category + Transactions)
              Desktop : normal col */}
          <div className="rounded-md border border-slate-200 bg-white p-4 md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin size={11} className="text-orange-500" strokeWidth={3} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">By Site</h2>
              </div>
              <Link href="/inventory" className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors">
                View all
              </Link>
            </div>

            {(inventory?.by_site ?? []).length === 0 ? (
              <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest py-6 text-center">No data</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-x-6">
                {(inventory?.by_site ?? []).map((site) => (
                  <Link
                    key={site.site}
                    href="/inventory"
                    className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 rounded-sm transition-colors -mx-1 px-1"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-700 truncate">
                        {site.site}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {site.records} records
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-black text-slate-950 tabular-nums">
                        {site.total_quantity.toLocaleString()}{" "}
                        <span className="font-medium text-slate-400 text-[9px]">units</span>
                      </p>
                      <p className="text-[9px] font-black text-orange-500 tabular-nums">
                        ${Number.parseFloat(site.total_stock_value).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Recent Activity ──
            Mobile  : 1 col list
            Tablet  : 2 col grid
            Desktop : 2 col grid
        ── */}
        <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={11} className="text-orange-500" strokeWidth={3} />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">Recent Activity</h2>
            </div>
            <Link href="/transactions" className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors">
              View all
            </Link>
          </div>

          {(transactions?.recent_activity ?? []).length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                No transactions in this range
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 md:grid md:grid-cols-2 md:divide-y-0 md:divide-x md:divide-slate-100">
              {transactions?.recent_activity.map((txn, i) => (
                <Link
                  key={txn.id}
                  href="/transactions"
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors ${
                    i >= 2 ? "md:border-t md:border-slate-50" : ""
                  }`}
                >
                  <div className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 ${
                    txn.transaction_type === "Receive" ? "bg-green-100" : "bg-orange-100"
                  }`}>
                    {txn.transaction_type === "Receive"
                      ? <ArrowDownLeft size={11} className="text-green-600" strokeWidth={3} />
                      : <ArrowUpRight  size={11} className="text-orange-600" strokeWidth={3} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${
                        txn.transaction_type === "Receive"
                          ? "bg-green-50 text-green-700"
                          : "bg-orange-50 text-orange-700"
                      }`}>
                        {txn.transaction_type}
                      </span>
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                        #{txn.id}
                      </span>
                      {txn.performed_by && (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                          by {txn.performed_by}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {txn.item_count} item{txn.item_count === 1 ? "" : "s"} · {txn.total_quantity.toLocaleString()} units
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-slate-500 tabular-nums">
                      {new Date(txn.transaction_date).toLocaleDateString()}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold tabular-nums">
                      {new Date(txn.transaction_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
