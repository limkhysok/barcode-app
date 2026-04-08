"use client";

import { 
  Database, 
  Package, 
  AlertCircle 
} from "lucide-react";

interface StatsOverviewProps {
  stats: any;
}

export function StatsOverview({ stats }: Readonly<StatsOverviewProps>) {
  return (
    <div className="w-full">
      {/* Mobile Overview */}
      <div className="sm:hidden rounded-sm border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="flex h-1 w-full bg-gray-100">
          <div className="h-full bg-orange-500 transition-all duration-700" style={{ width: '40%' }} />
          <div className="h-full bg-slate-950 transition-all duration-700" style={{ width: '60%' }} />
        </div>
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          <div className="flex-1 flex flex-col gap-0.5 px-4 py-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Total Records</p>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-black text-slate-950 tabular-nums leading-none">●</span>
              <span className="text-[16px] font-black text-slate-950 tabular-nums tracking-tight leading-none">{stats.total.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-0.5 px-4 py-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Unit Volume</p>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-black text-orange-600 tabular-nums leading-none">↗</span>
              <span className="text-[16px] font-black text-slate-950 tabular-nums tracking-tight leading-none">{stats.totalQty.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Overview (3 Card Layout) */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3">
        {/* Total Records */}
        <div className="px-5 py-4 border border-gray-200 bg-white rounded-sm transition-all duration-300 hover:border-orange-500/30">
          <div className="flex items-start justify-between mb-2">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Records</p>
              <p className="text-3xl font-black text-slate-950 tabular-nums tracking-tighter leading-none">{stats.total.toLocaleString()}</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-400">
              <Database size={20} strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Unique Entries</p>
        </div>

        {/* Unit Volume */}
        <div className="px-5 py-4 border border-gray-200 bg-white rounded-sm transition-all duration-300 hover:border-orange-500/30">
          <div className="flex items-start justify-between mb-2">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">Unit Volume</p>
              <p className="text-3xl font-black text-slate-950 tabular-nums tracking-tighter leading-none">{stats.totalQty.toLocaleString()}</p>
            </div>
            <div className="p-2.5 bg-orange-50 border border-orange-100 rounded-lg text-orange-600">
              <Package size={20} strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Stock Level</p>
        </div>

        {/* Needs Reorder */}
        <div className="px-5 py-4 border border-gray-200 bg-white rounded-sm transition-all duration-300 hover:border-orange-500/30">
          <div className="flex items-start justify-between mb-2">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">Low Stock</p>
              <p className="text-3xl font-black text-slate-950 tabular-nums tracking-tighter leading-none">{stats.needsReorder.toLocaleString()}</p>
            </div>
            <div className={`p-2.5 border rounded-lg ${stats.needsReorder > 0 ? "bg-red-50 border-red-100 text-red-600" : "bg-green-50 border-green-100 text-green-600"}`}>
              <AlertCircle size={20} strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Items for Review</p>
        </div>
      </div>
    </div>
  );
}
