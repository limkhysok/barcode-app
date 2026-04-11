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

interface DashboardClientProps {
  initialStats: DashboardStats | null;
}

export default function DashboardClient({ initialStats }: Readonly<DashboardClientProps>) {
  const [range, setRange]             = useState<RangeLabel>("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd]     = useState("");
  const [stats, setStats]             = useState<DashboardStats | null>(initialStats);
  const [loading, setLoading]         = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchStats = useCallback(async (r: RangeLabel, start?: string, end?: string) => {
    setLoading(true);
    const data = await getDashboardStats(undefined, { range: r, start, end });
    if (data) {
      setStats(data);
      setLastUpdated(new Date());
    }
    setLoading(false);
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
    <div className="px-4 py-5 sm:px-5 sm:py-5 space-y-3">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[12px] font-black text-slate-950 uppercase tracking-[0.2em] leading-none">
            Dashboard
          </h1>
          <p className="text-[9px] font-medium text-slate-400 mt-0.5 uppercase tracking-widest">
            Overview · {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Range tabs — scrollable strip on small screens */}
          <div className="overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center bg-slate-100 rounded-sm p-0.5 gap-0.5 w-fit">
              {RANGE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setRange(tab.value)}
                  className={`px-2.5 h-6 sm:h-7 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-sm transition-all duration-150 whitespace-nowrap cursor-pointer ${
                    range === tab.value
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date pickers */}
          {range === "custom" && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-7 px-2.5 text-[11px] font-bold border border-slate-200 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-orange-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 font-black uppercase text-center">to</span>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-7 px-2.5 text-[11px] font-bold border border-slate-200 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-orange-400 cursor-pointer"
              />
            </div>
          )}

          {/* Refresh */}
          <button
            type="button"
            onClick={() => fetchStats(range, customStart || undefined, customEnd || undefined)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 h-7 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-sm text-slate-400 hover:text-orange-500 hover:border-orange-200 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            <RefreshCw size={10} strokeWidth={3} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Content (dims while loading) ── */}
      <div className={`space-y-3 transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

          {/* Products → /products */}
          <Link href="/products" className="block rounded-md border border-slate-200 bg-white p-4 hover:border-orange-500/30 transition-colors">
            <div className="flex items-start justify-between pb-2">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Products</p>
              <Package className="h-8 w-8 text-orange-500/70 shrink-0" strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-black tracking-tighter text-slate-950 leading-none tabular-nums">
              {(products?.total ?? 0).toLocaleString()}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In range</span>
              <span className={`text-[10px] font-black uppercase ${(products?.low_stock ?? 0) > 0 ? "text-red-500" : "text-slate-300"}`}>
                {products?.low_stock ?? 0} low
              </span>
            </div>
          </Link>

          {/* Stock Value → /inventory */}
          <Link href="/inventory" className="block rounded-md border border-slate-200 bg-white p-4 hover:border-orange-500/30 transition-colors">
            <div className="flex items-start justify-between pb-2">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Stock Value</p>
              <Database className="h-8 w-8 text-orange-500/70 shrink-0" strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-black tracking-tighter text-slate-950 leading-none tabular-nums">
              ${Number.parseFloat(inventory?.total_stock_value ?? "0").toLocaleString()}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Updated</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tabular-nums">
                {(inventory?.total_quantity ?? 0).toLocaleString()} units
              </span>
            </div>
          </Link>

          {/* Low Stock → /inventory */}
          <Link
            href="/inventory"
            className={`block rounded-md border bg-white p-4 transition-colors ${
              (inventory?.needs_reorder ?? 0) > 0
                ? "border-red-200 hover:border-red-300"
                : "border-slate-200 hover:border-orange-500/30"
            }`}
          >
            <div className="flex items-start justify-between pb-2">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Low Stock</p>
              <AlertCircle
                className={`h-8 w-8 shrink-0 ${(inventory?.needs_reorder ?? 0) > 0 ? "text-red-400" : "text-slate-300"}`}
                strokeWidth={1.5}
              />
            </div>
            <p className={`text-3xl font-black tracking-tighter leading-none tabular-nums ${
              (inventory?.needs_reorder ?? 0) > 0 ? "text-red-600" : "text-slate-950"
            }`}>
              {(inventory?.needs_reorder ?? 0).toLocaleString()}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Out of stock</span>
              <span className={`text-[10px] font-black uppercase ${(products?.out_of_stock ?? 0) > 0 ? "text-red-500" : "text-slate-300"}`}>
                {products?.out_of_stock ?? 0}
              </span>
            </div>
          </Link>

          {/* Transactions → /transactions */}
          <Link href="/transactions" className="block rounded-md border border-slate-200 bg-white p-4 hover:border-orange-500/30 transition-colors">
            <div className="flex items-start justify-between pb-2">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Transactions</p>
              <Boxes className="h-8 w-8 text-orange-500/70 shrink-0" strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-black tracking-tighter text-slate-950 leading-none tabular-nums">
              {(transactions?.total ?? 0).toLocaleString()}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In range</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tabular-nums">
                {(receive?.count ?? 0) + (sale?.count ?? 0)} total
              </span>
            </div>
          </Link>
        </div>

        {/* ── Middle Row ──
            Mobile  : 1 col stack
            Tablet  : 2 cols (Category + Transactions), By Site full-width below
            Desktop : 3 equal cols
        ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

          {/* By Category → /products */}
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
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">
                          {cat.category}
                        </span>
                        <span className="text-[11px] font-black text-slate-950 tabular-nums">
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

          {/* Transaction Breakdown → /transactions */}
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
              {/* Receive */}
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

              {/* Sale */}
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

          {/* Inventory by Site → /inventory
              Tablet : col-span-2 (sits below Category + Transactions)
              Desktop: normal 1 col */}
          <div className="rounded-md border border-slate-200 bg-white p-4 sm:col-span-2 lg:col-span-1">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-6">
                {(inventory?.by_site ?? []).map((site) => (
                  <Link
                    key={site.site}
                    href="/inventory"
                    className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 rounded-sm transition-colors -mx-1 px-1"
                  >
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                        {site.site}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {site.records} records
                      </p>
                    </div>
                    <div className="text-right">
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

        {/* ── Recent Activity → /transactions ── */}
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
            <div className="divide-y divide-slate-50 sm:grid sm:grid-cols-2 sm:divide-y-0 sm:divide-x sm:divide-slate-100">
              {transactions?.recent_activity.map((txn, i) => (
                <Link
                  key={txn.id}
                  href="/transactions"
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors ${
                    i >= 2 ? "sm:border-t sm:border-slate-50" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 ${
                    txn.transaction_type === "Receive" ? "bg-green-100" : "bg-orange-100"
                  }`}>
                    {txn.transaction_type === "Receive"
                      ? <ArrowDownLeft size={11} className="text-green-600" strokeWidth={3} />
                      : <ArrowUpRight  size={11} className="text-orange-600" strokeWidth={3} />
                    }
                  </div>

                  {/* Info */}
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

                  {/* Date */}
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
