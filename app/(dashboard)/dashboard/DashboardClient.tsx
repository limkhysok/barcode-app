"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Activity,
  ChevronRight,
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Area,
  BarChart,
  Bar,
  Rectangle
} from "recharts";
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

const COLORS = ['#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFEDD5'];

function RangeTabs({ value, onChange }: Readonly<{ value: RangeLabel; onChange: (v: RangeLabel) => void }>) {
  return (
    <div className="flex items-center bg-slate-100/80 rounded-sm p-0.5 gap-0.5 w-fit">
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
    </div>
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
    <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
      <input
        type="date"
        value={start}
        onChange={(e) => onStartChange(e.target.value)}
        className="flex-1 sm:flex-none h-8 px-2.5 text-[11px] font-bold border border-slate-200 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-orange-400 cursor-pointer hover:border-slate-300 transition-colors"
      />
      <span className="text-[9px] text-slate-400 font-black uppercase">to</span>
      <input
        type="date"
        value={end}
        min={start}
        onChange={(e) => onEndChange(e.target.value)}
        className="flex-1 sm:flex-none h-8 px-2.5 text-[11px] font-bold border border-slate-200 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-orange-400 cursor-pointer hover:border-slate-300 transition-colors"
      />
    </div>
  );
}

function DistributionBar(props: any) {
  const { x, y, width, height, payload } = props;
  return <Rectangle x={x} y={y} width={width} height={height} fill={payload.color} radius={[0, 2, 2, 0]} />;
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
  const [mounted, setMounted]         = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const categoryData = useMemo(() => {
    return (products?.by_category ?? [])
      .map((cat, index) => ({ 
        name: cat.category.toUpperCase(), 
        value: cat.count,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [products]);

  const chartData = useMemo(() => {
    const groups: { [key: string]: { date: string, receive: number, sale: number } } = {};
    (transactions?.recent_activity ?? []).forEach(tx => {
      const d = new Date(tx.transaction_date).toLocaleDateString();
      if (!groups[d]) groups[d] = { date: d, receive: 0, sale: 0 };
      if (tx.transaction_type === "Receive") groups[d].receive += tx.total_quantity;
      else groups[d].sale += tx.total_quantity;
    });
    return Object.values(groups).reverse();
  }, [transactions]);

  return (
    <div className="px-4 py-5 md:px-6 md:py-6 space-y-6 max-w-[1600px] mx-auto">
      
      {/* ── HEADER: MOBILE (< sm) ── */}
      <div className="sm:hidden flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col border-l-2 border-orange-500 pl-3">
             <h1 className="text-[14px] font-black text-slate-950 uppercase tracking-[0.2em] leading-none">Dashboard</h1>
             <p className="text-[8px] text-orange-500 font-black uppercase tracking-widest mt-0.5">Overview</p>
          </div>
          <button
            type="button"
            onClick={() => fetchStats(range, customStart || undefined, customEnd || undefined)}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-sm text-slate-400 active:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} strokeWidth={3} className={loading ? "animate-spin text-orange-500" : ""} />
          </button>
        </div>
        <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
          <RangeTabs value={range} onChange={setRange} />
        </div>
        {range === "custom" && (
          <CustomDateRange 
            start={customStart} 
            end={customEnd} 
            onStartChange={setCustomStart} 
            onEndChange={setCustomEnd} 
          />
        )}
      </div>

      {/* ── HEADER: TABLET / DESKTOP (≥ sm) ── */}
      <div className="hidden sm:flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6">
        <div className="flex flex-col border-l-4 border-orange-500 pl-4">
          <h1 className="text-[16px] lg:text-[18px] font-black text-slate-950 uppercase tracking-[0.25em] leading-tight">
            Dashboard Overview
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Command Center / Integrated Logistics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <RangeTabs value={range} onChange={setRange} />
          {range === "custom" && (
            <CustomDateRange 
              start={customStart} 
              end={customEnd} 
              onStartChange={setCustomStart} 
              onEndChange={setCustomEnd} 
            />
          )}
          <button
            type="button"
            onClick={() => fetchStats(range, customStart || undefined, customEnd || undefined)}
            disabled={loading}
            className="group flex items-center gap-2 px-4 h-8 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-sm text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
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

      {error && (
        <p className="text-xs font-medium text-red-500 bg-red-50 border border-red-200 px-4 py-3 rounded-sm uppercase tracking-widest font-black">
          {error}
        </p>
      )}

      {/* ── KPI GRID: 1 col on Mobile, 2 on Tablet, 4 on Desktop ── */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        {/* Products */}
        <Link href="/products" className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col gap-3 hover:border-orange-300 transition-colors group h-full">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Asset Count</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900 leading-none tabular-nums tracking-tighter mt-1 group-hover:text-orange-600 transition-colors">
                {(products?.total ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="w-9 h-9 rounded-sm bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
              <Package size={18} className="text-orange-500 group-hover:text-white transition-colors" strokeWidth={2} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t border-slate-50">
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Database</span>
                <span className="text-[10px] font-black text-orange-400 uppercase">Live</span>
             </div>
             <div className="h-1.5 rounded-full bg-slate-50 overflow-hidden">
                <div className="h-full bg-orange-300 rounded-full" style={{ width: "100%" }} />
             </div>
          </div>
        </Link>
        {/* Stock Value */}
        <Link href="/inventory" className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col gap-3 hover:border-orange-300 transition-colors group h-full">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Net Valuation</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900 leading-none tabular-nums tracking-tighter mt-1 group-hover:text-orange-600 transition-colors">
                ${Number.parseFloat(inventory?.total_stock_value ?? "0").toLocaleString()}
              </p>
            </div>
            <div className="w-9 h-9 rounded-sm bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
              <Database size={18} className="text-orange-500 group-hover:text-white transition-colors" strokeWidth={2} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t border-slate-50">
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Capacity</span>
                <span className="text-[10px] font-black text-orange-500 uppercase">{(inventory?.total_quantity ?? 0).toLocaleString()}</span>
             </div>
             <div className="h-1.5 rounded-full bg-slate-50 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: "100%" }} />
             </div>
          </div>
        </Link>
        {/* Low Stock */}
        <Link href="/inventory" className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col gap-3 hover:border-orange-300 transition-colors group h-full">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Stock Alerts</p>
              <p className={`text-2xl md:text-3xl font-black leading-none tabular-nums tracking-tighter mt-1 group-hover:text-orange-600 transition-colors ${
                (inventory?.needs_reorder ?? 0) > 0 ? "text-red-500" : "text-slate-900"
              }`}>
                {(inventory?.needs_reorder ?? 0).toLocaleString()}
              </p>
            </div>
            <div className={`w-9 h-9 rounded-sm flex items-center justify-center transition-colors ${
              (inventory?.needs_reorder ?? 0) > 0 ? "bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white" : "bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white"
            }`}>
              <AlertCircle size={18} strokeWidth={2} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t border-slate-50">
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Critical Ratio</span>
                <span className={`text-[10px] font-black uppercase ${(products?.out_of_stock ?? 0) > 0 ? "text-red-500" : "text-orange-400"}`}>
                   {products?.out_of_stock ?? 0} out
                </span>
             </div>
             <div className="h-1.5 rounded-full bg-slate-50 overflow-hidden flex">
                <div className="bg-red-500" style={{ width: `${Math.min(100, (products?.out_of_stock ?? 0) * 10)}%` }} />
                <div className="bg-orange-400 flex-1" />
             </div>
          </div>
        </Link>
        {/* Transactions */}
        <Link href="/transactions" className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col gap-3 hover:border-orange-300 transition-colors group h-full">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Throughput</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900 leading-none tabular-nums tracking-tighter mt-1 group-hover:text-orange-600 transition-colors">
                {(transactions?.total ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="w-9 h-9 rounded-sm bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
              <Boxes size={18} className="text-orange-500 group-hover:text-white transition-colors" strokeWidth={2} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t border-slate-50">
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">In Range</span>
                <span className="text-[10px] font-black text-slate-500 uppercase">Tracked Signals</span>
             </div>
             <div className="h-1.5 rounded-full bg-slate-50 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: "100%" }} />
             </div>
          </div>
        </Link>
      </div>

      {/* ── ANALYTICS ROW: Stack on Mobile, split on Desktop ── */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm p-5 sm:p-6 lg:p-8 flex flex-col overflow-hidden min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-orange-500" strokeWidth={3} />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">Analytics Summary</h2>
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
          
          <div className="w-full min-w-0 min-h-[250px] sm:min-h-[300px] relative">
            {mounted && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '2px', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="receive" stroke="#22C55E" strokeWidth={2.5} fill="#22C55E" fillOpacity={0.05} />
                  <Area type="monotone" dataKey="sale" stroke="#F97316" strokeWidth={2.5} fill="#F97316" fillOpacity={0.05} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-200">
                 <Boxes size={48} strokeWidth={1} className="opacity-20" />
                 <p className="text-[10px] font-black uppercase tracking-widest">No trend data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-6 flex flex-col min-w-0">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Tag size={12} className="text-orange-500" strokeWidth={3} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">Distribution</h2>
              </div>
           </div>
           <div className="flex-1 min-h-[250px] min-w-0 relative">
              {mounted && categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250} minWidth={0}>
                  <BarChart data={categoryData} layout="vertical" margin={{ left: -10, right: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 900 }} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ fontSize: '10px', borderRadius: '2px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={14} shape={<DistributionBar />} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-200">
                   <Tag size={48} strokeWidth={1} className="opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-center">No category signals</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* ── LOWER GRID ── */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        <div className="bg-white border border-slate-200 rounded-sm p-5 sm:p-6 lg:p-8 flex flex-col h-fit">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2">
               <MapPin size={12} className="text-orange-500" strokeWidth={3} />
               <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">Global Sites</h2>
             </div>
             <Link href="/inventory" className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:text-orange-600 transition-colors flex items-center gap-1">
                View All <ChevronRight size={10} strokeWidth={4} />
             </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            {(inventory?.by_site ?? []).map((site) => (
              <Link key={site.site} href="/inventory" className="py-3 border-b border-slate-50 hover:bg-slate-50/50 transition-colors px-2 rounded-sm group flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest group-hover:text-orange-600 transition-colors block truncate">{site.site}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block mt-0.5">{site.records} Nodes</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[12px] font-black text-slate-950 tabular-nums block">{site.total_quantity.toLocaleString()}</span>
                  <span className="text-[10px] font-black text-orange-500 tabular-nums block">${Number.parseFloat(site.total_stock_value).toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm flex flex-col overflow-hidden h-fit">
           <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-orange-500" strokeWidth={3} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">Signal Log</h2>
              </div>
              <Link href="/transactions" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-500 transition-colors flex items-center gap-1">
                 History <ChevronRight size={10} strokeWidth={4} />
              </Link>
           </div>
           <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-[400px]">
              {(transactions?.recent_activity ?? []).map((txn, i) => (
                <Link key={txn.id} href="/transactions" className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors ${i % 2 === 1 ? "bg-slate-50/20" : ""}`}>
                  <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${txn.transaction_type === "Receive" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}>
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
                     <p className="text-[9px] font-black text-slate-300 uppercase tabular-nums">{new Date(txn.transaction_date).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
