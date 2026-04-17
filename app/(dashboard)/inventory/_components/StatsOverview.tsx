"use client";

import React from "react";
import { 
  Database, 
  Package, 
  AlertCircle,
  Hash,
  Box,
  Zap
} from "lucide-react";

interface StatsOverviewProps {
  stats: any;
}

export function StatsOverview({ stats }: Readonly<StatsOverviewProps>) {
  const total = stats.total ?? 0;
  const totalQty = stats.totalQty ?? 0;
  const needsReorder = stats.needsReorder ?? 0;

  return (
    <div className="w-full">
      {/* ── Mobile Overview: Multi-Section Layout ── */}
      <div className="block sm:hidden rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
        
        {/* Top: Summary Stats (Divided) */}
        <div className="px-0 py-0 bg-white border-b border-slate-200">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Inventory Summary</span>
          </div>

          <div className="grid grid-cols-3 gap-0 divide-x divide-slate-100">
            {/* Total */}
            <div className="flex flex-col items-center gap-1 py-4">
              <Database className="h-5 w-5 text-orange-600" strokeWidth={2} />
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none">Total</p>
              <p className="text-base font-black text-slate-950 leading-none tabular-nums">{total.toLocaleString()}</p>
            </div>

            {/* Units */}
            <div className="flex flex-col items-center gap-1 py-4">
              <Package className="h-5 w-5 text-orange-600" strokeWidth={2} />
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none">Units</p>
              <p className="text-base font-black text-slate-950 leading-none tabular-nums">{totalQty.toLocaleString()}</p>
            </div>

            {/* Critical */}
            <div className="flex flex-col items-center gap-1 py-4">
              <AlertCircle className={`h-5 w-5 ${needsReorder > 0 ? "text-red-500" : "text-slate-300"}`} strokeWidth={2} />
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none">Low</p>
              <p className={`text-base font-black leading-none tabular-nums ${needsReorder > 0 ? "text-red-500" : "text-slate-950"}`}>{needsReorder.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Bottom: Modern Info Bar */}
        <div className="bg-slate-50/50 px-4 py-3 border-t border-slate-50">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Zap className="w-3.5 h-3.5 text-orange-500" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Status</span>
              </div>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${needsReorder > 0 ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}>
                 {needsReorder > 0 ? "Needs Review" : "Healthy Stock"}
              </span>
           </div>
        </div>
      </div>

      {/* ── Desktop Overview (3 Card Layout with sub-details) ── */}
      <div className="hidden sm:grid grid-cols-3 gap-3">
        {/* Box: Total Records */}
        <div className="rounded-md border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-orange-500/30">
          <div className="flex items-start justify-between pb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Total Products</p>
            <Database className="h-8 w-8 text-orange-600/80" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter text-slate-950 leading-none tabular-nums">{total.toLocaleString()}</p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-4">
               <div className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unique Entries</span>
               </div>
               <span className="text-[10px] font-bold text-slate-400 uppercase">Tracked</span>
            </div>
          </div>
        </div>

        {/* Box: Unit Volume */}
        <div className="rounded-md border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-orange-500/30">
          <div className="flex items-start justify-between pb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Total Quantity</p>
            <Package className="h-8 w-8 text-orange-600/80" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter text-slate-950 leading-none tabular-nums">{totalQty.toLocaleString()}</p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-4">
               <div className="flex items-center gap-1.5">
                  <Box className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Volume Level</span>
               </div>
               <span className="text-[10px] font-bold text-slate-400 uppercase">Total Qty</span>
            </div>
          </div>
        </div>

        {/* Box: Low Stock */}
        <div className="rounded-md border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-orange-500/30">
          <div className="flex items-start justify-between pb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Critical Stock</p>
            <AlertCircle className={`h-8 w-8 ${needsReorder > 0 ? "text-red-500/80" : "text-green-500/80"}`} strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className={`text-3xl font-black tracking-tighter leading-none tabular-nums ${needsReorder > 0 ? "text-red-600" : "text-slate-950"}`}>
              {needsReorder.toLocaleString()}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-4">
               <div className="flex items-center gap-1.5">
                  <Zap className={`w-3 h-3 ${needsReorder > 0 ? "text-red-500" : "text-green-500"}`} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Health</span>
               </div>
               <span className={`text-[10px] font-black uppercase tracking-widest ${needsReorder > 0 ? "text-red-500" : "text-green-600"}`}>
                  {needsReorder > 0 ? "Reorder" : "Stable"}
               </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
