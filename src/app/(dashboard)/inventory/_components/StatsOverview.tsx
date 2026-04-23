"use client";

import React, { useMemo } from "react";
import { 
  Database, 
  Package, 
  AlertCircle,
  Zap
} from "lucide-react";

interface StatsOverviewProps {
  stats: {
    total: number;
    totalQty: number;
    needsReorder: number;
  };
}

function fmt(n: number) {
  return n.toLocaleString();
}

export function StatsOverview({ stats }: Readonly<StatsOverviewProps>) {
  const { total, totalQty, needsReorder } = stats;
  
  const s = useMemo(() => {
    const lowShare = total > 0 ? Math.round((needsReorder / total) * 100) : 0;
    const healthyShare = 100 - lowShare;
    const healthyCount = total - needsReorder;
    return { lowShare, healthyShare, healthyCount };
  }, [total, needsReorder]);

  return (
    <div className="w-full">
      {/* ── MOBILE (< sm) ── */}
      <div className="sm:hidden bg-white border border-slate-500 rounded-sm overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="group/icon cursor-default">
              <Database size={14} className="text-orange-500 transition-all duration-200 group-hover/icon:text-orange-700 group-hover/icon:scale-125" strokeWidth={2} />
            </div>
            <p className="text-[18px] font-black text-slate-900 leading-none tabular-nums">{fmt(total)}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Products</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="group/icon cursor-default">
              <Package size={14} className="text-orange-500 transition-all duration-200 group-hover/icon:text-orange-700 group-hover/icon:scale-125" strokeWidth={2} />
            </div>
            <p className="text-[18px] font-black text-slate-900 leading-none tabular-nums">{fmt(totalQty)}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Qty</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="group/icon cursor-default">
              <AlertCircle size={14} className={`transition-all duration-200 group-hover/icon:scale-125 ${needsReorder > 0 ? "text-orange-600 group-hover/icon:text-orange-800" : "text-orange-300 group-hover/icon:text-orange-500"}`} strokeWidth={2} />
            </div>
            <p className={`text-[18px] font-black leading-none tabular-nums ${needsReorder > 0 ? "text-orange-600" : "text-slate-900"}`}>{fmt(needsReorder)}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Low Stock</p>
          </div>
        </div>
        <div className="px-3 pb-3 flex flex-col gap-1">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100">
            <div className="bg-orange-600 transition-all duration-700" style={{ width: `${s.lowShare}%` }} />
            <div className="bg-orange-300 transition-all duration-700" style={{ width: `${s.healthyShare}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest">LOW {s.lowShare}%</span>
            <span className="text-[8px] font-black text-orange-300 uppercase tracking-widest">HEALTHY {s.healthyShare}%</span>
          </div>
        </div>
      </div>

      {/* ── TABLET (sm → lg) ── */}
      <div className="hidden sm:grid lg:hidden grid-cols-3 gap-2">
        <div className="bg-white border border-slate-500 rounded-sm p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="group/icon w-7 h-7 rounded-sm bg-orange-50 flex items-center justify-center transition-all duration-200 hover:bg-orange-100 hover:scale-110 cursor-default">
                <Database size={14} className="text-orange-500 transition-all duration-200 group-hover/icon:text-orange-700 group-hover/icon:scale-110" strokeWidth={2} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracked Products</p>
            </div>
          </div>
          <p className="text-[26px] font-black text-slate-900 leading-none tabular-nums tracking-tighter">{fmt(total)}</p>
          <div className="h-1 rounded-full bg-orange-100 overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        <div className="bg-white border border-slate-500 rounded-sm p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="group/icon w-7 h-7 rounded-sm bg-orange-50 flex items-center justify-center transition-all duration-200 hover:bg-orange-100 hover:scale-110 cursor-default">
                <Package size={14} className="text-orange-500 transition-all duration-200 group-hover/icon:text-orange-700 group-hover/icon:scale-110" strokeWidth={2} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Quantity</p>
            </div>
          </div>
          <p className="text-[26px] font-black text-slate-900 leading-none tabular-nums tracking-tighter">{fmt(totalQty)}</p>
          <div className="h-1 rounded-full bg-orange-100 overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        <div className="bg-white border border-slate-500 rounded-sm p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="group/icon w-7 h-7 rounded-sm bg-orange-50 flex items-center justify-center transition-all duration-200 hover:bg-orange-100 hover:scale-110 cursor-default">
                <AlertCircle size={14} className={`transition-all duration-200 group-hover/icon:scale-110 ${needsReorder > 0 ? "text-orange-600 group-hover/icon:text-orange-800" : "text-orange-300 group-hover/icon:text-orange-500"}`} strokeWidth={2} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Stock</p>
            </div>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${needsReorder > 0 ? "bg-orange-100 text-orange-600" : "bg-orange-50 text-orange-400"}`}>
               {s.lowShare}%
            </span>
          </div>
          <p className={`text-[26px] font-black leading-none tabular-nums tracking-tighter ${needsReorder > 0 ? "text-orange-600" : "text-slate-900"}`}>{fmt(needsReorder)}</p>
          <div className="h-1 rounded-full bg-slate-100 overflow-hidden flex">
            <div className="h-full bg-orange-600 transition-all duration-700" style={{ width: `${s.lowShare}%` }} />
            <div className="h-full bg-orange-300 transition-all duration-700" style={{ width: `${s.healthyShare}%` }} />
          </div>
        </div>
      </div>

      {/* ── DESKTOP (≥ lg) ── */}
      <div className="hidden lg:grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-500 rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover/hdr:text-orange-500 transition-colors duration-200">Total Products</p>
              <p className="text-3xl font-black text-slate-900 leading-none tabular-nums tracking-tighter mt-1">{fmt(total)}</p>
            </div>
            <div className="group/icon w-9 h-9 rounded-sm bg-orange-50 flex items-center justify-center transition-all duration-200 hover:bg-orange-100 hover:scale-110 cursor-default">
              <Database size={18} className="text-orange-500 transition-all duration-200 group-hover/icon:text-orange-700 group-hover/icon:scale-110" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto">
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                <span className="text-[10px] font-black text-orange-400 uppercase">Live Database</span>
             </div>
             <div className="h-1.5 rounded-full bg-orange-50 overflow-hidden">
                <div className="h-full bg-orange-300 rounded-full" style={{ width: "100%" }} />
             </div>
          </div>
        </div>

        <div className="bg-white border border-slate-500 rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover/hdr:text-orange-500 transition-colors duration-200">Total Quantity</p>
              <p className="text-3xl font-black text-slate-900 leading-none tabular-nums tracking-tighter mt-1">{fmt(totalQty)}</p>
            </div>
            <div className="group/icon w-9 h-9 rounded-sm bg-orange-50 flex items-center justify-center transition-all duration-200 hover:bg-orange-100 hover:scale-110 cursor-default">
              <Package size={18} className="text-orange-500 transition-all duration-200 group-hover/icon:text-orange-700 group-hover/icon:scale-110" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto">
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stock Level</span>
                <span className="text-[10px] font-black text-orange-600 uppercase">Tracked Volume</span>
             </div>
             <div className="h-1.5 rounded-full bg-orange-100 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: "100%" }} />
             </div>
          </div>
        </div>

        <div className="bg-white border border-slate-500 rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover/hdr:text-orange-500 transition-colors duration-200">Critical Stock</p>
              <p className={`text-3xl font-black leading-none tabular-nums tracking-tighter mt-1 ${needsReorder > 0 ? "text-orange-600" : "text-slate-900"}`}>{fmt(needsReorder)}</p>
            </div>
            <div className="group/icon w-9 h-9 rounded-sm bg-orange-50 flex items-center justify-center transition-all duration-200 hover:bg-orange-100 hover:scale-110 cursor-default">
              <Zap size={18} className={`transition-all duration-200 group-hover/icon:scale-110 ${needsReorder > 0 ? "text-orange-600 group-hover/icon:text-orange-800" : "text-orange-300 group-hover/icon:text-orange-500"}`} strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Health Split</span>
              <span className={`text-[9px] font-black ${needsReorder > 0 ? "text-orange-600" : "text-orange-300"}`}>
                {s.lowShare}% Low · {s.healthyShare}% Healthy
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-slate-100 flex">
              <div className="h-full bg-orange-600 transition-all duration-700" style={{ width: `${s.lowShare}%` }} />
              <div className="h-full bg-orange-300 transition-all duration-700" style={{ width: `${s.healthyShare}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
