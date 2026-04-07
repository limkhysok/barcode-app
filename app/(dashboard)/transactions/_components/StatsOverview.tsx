"use client";

import React from "react";
import type { TransactionStats } from "@/src/services/transaction.service";

type StatsOverviewProps = {
  stats: TransactionStats | null;
};





const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const receiveCount = stats?.by_type?.Receive?.total_count || 0;
  const receiveTodayCount = stats?.by_type?.Receive?.today_count || 0;
  const receiveTodayQty = stats?.by_type?.Receive?.today_total_quantity ?? 0;
  const saleCount = stats?.by_type?.Sale?.total_count || 0;
  const saleTodayCount = stats?.by_type?.Sale?.today_count || 0;
  const saleTodayQty = stats?.by_type?.Sale?.today_total_quantity ?? 0;
  const totalMovements = stats?.total_transactions || 0;
  const todayMovements = stats?.today_transactions || 0;

  const totalTyped = receiveCount + saleCount || 1;
  const receiveShare = Math.round((receiveCount / totalTyped) * 100);
  const saleShare = 100 - receiveShare;




  return (
    <div className="space-y-3">

      {/* ── Mobile Overview (Unified Style) ── */}
      <div className="sm:hidden group bg-white border border-gray-800 rounded-xl overflow-hidden flex flex-col transition-all duration-300 active:scale-[0.98] hover:border-orange-500/50">
        {/* Compact Header */}
        <div className="px-3 py-1 bg-black flex items-center justify-between transition-colors duration-500 group-hover:bg-orange-600">
          <span className="text-[9px] font-black text-white/80 uppercase tracking-[0.2em]">Quick Stats</span>
          <span className="text-[9px] font-bold text-white tabular-nums opacity-60">Today Overview</span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-gray-100 bg-white">
          {[
            { label: "Receive", count: receiveCount, icon: "↓", today: receiveTodayCount },
            { label: "Sale", count: saleCount, icon: "↑", today: saleTodayCount },
            { label: "Total", count: totalMovements, icon: "●", today: todayMovements },
          ].map((item) => (
            <div key={item.label} className="px-2 py-3 flex flex-col items-center text-center gap-1.5 hover:bg-slate-50/50 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center shrink-0 shadow-md ring-1 ring-white/10 group-hover:bg-orange-500 transition-colors">
                <span className="text-white text-[11px] font-black">{item.icon}</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest group-hover:text-orange-400 truncate">{item.label}</p>
                <p className="text-lg font-black text-black tabular-nums tracking-tighter group-hover:text-orange-600 transition-colors leading-none">{item.count.toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[7.5px] font-black text-gray-300 uppercase leading-none">Today</span>
                <span className="text-[10px] font-black text-black tabular-nums group-hover:text-orange-600 leading-none">+{item.today.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* ── Desktop (High Density) ── */}
      <div className="hidden sm:grid grid-cols-10 gap-2 items-stretch">
        {/* Left Side: Stats & Metrics */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-2">
           {/* Card: Flow Overview (Integrated) */}
           <div className="group border border-gray-100 rounded-xl bg-white p-2.5 shadow-sm transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg">
              <div className="flex items-center gap-3">
                 <div className="flex flex-col items-start shrink-0">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover:text-orange-500 transition-colors">Receive</span>
                    <span className="text-[14px] font-black text-black tabular-nums">{receiveShare}%</span>
                 </div>
                 <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-50 relative border border-gray-100/50">
                    <div className="absolute inset-y-0 left-0 bg-orange-500 transition-all duration-700 shadow-md shadow-orange-500/20" style={{ width: `${receiveShare}%` }} />
                    <div className="absolute inset-y-0 right-0 bg-blue-500 transition-all duration-700 shadow-md shadow-blue-500/20" style={{ width: `${saleShare}%` }} />
                 </div>
                 <div className="flex flex-col items-end shrink-0">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Sale</span>
                    <span className="text-[14px] font-black text-black/40 tabular-nums">{saleShare}%</span>
                 </div>
              </div>
           </div>

           {/* Card: Detailed Metrics (Compressed Grid) */}
           <div className="grid grid-cols-2 gap-2">
              {/* All Receive */}
              <div className="group bg-white border border-gray-100 rounded-xl p-3 shadow-sm transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg group/receive overflow-hidden">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center transition-all group-hover/receive:bg-orange-500 shrink-0">
                       <svg className="w-4 h-4 text-gray-400 group-hover/receive:text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                       </svg>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5 group-hover/receive:text-orange-500">All Receive</p>
                       <p className="text-xl font-black text-black tabular-nums tracking-tighter leading-none">{receiveCount.toLocaleString()}</p>
                    </div>
                 </div>
                 <div className="mt-2.5 grid grid-cols-2 gap-2 pt-2 border-t border-gray-50/50">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Today Tx</span>
                       <span className="text-[11px] font-black text-black tabular-nums group-hover/receive:text-orange-600">+{receiveTodayCount.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Today Qty</span>
                       <span className="text-[11px] font-black text-black tabular-nums group-hover/receive:text-orange-600">+{receiveTodayQty.toLocaleString()}</span>
                    </div>
                 </div>
              </div>

              {/* All Sale */}
              <div className="group bg-white border border-gray-100 rounded-xl p-3 shadow-sm transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg group/sale overflow-hidden">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center transition-all group-hover/sale:bg-blue-600 shrink-0">
                       <svg className="w-4 h-4 text-gray-400 group-hover/sale:text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                       </svg>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5 group-hover/sale:text-blue-600">All Sale</p>
                       <p className="text-xl font-black text-black tabular-nums tracking-tighter leading-none">{saleCount.toLocaleString()}</p>
                    </div>
                 </div>
                 <div className="mt-2.5 grid grid-cols-2 gap-2 pt-2 border-t border-gray-50/50">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Today Tx</span>
                       <span className="text-[11px] font-black text-black tabular-nums group-hover/sale:text-blue-600">-{saleTodayCount.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Today Qty</span>
                       <span className="text-[11px] font-black text-black tabular-nums group-hover/sale:text-blue-600">-{saleTodayQty.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Side: High-Density Overview */}
        <div className="col-span-12 lg:col-span-3">
           <div className="group h-full bg-white border border-gray-100 rounded-xl p-3 shadow-sm transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg flex flex-col justify-between">
              <div className="space-y-3">
                 <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Overview</p>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                 </div>
                 
                 <div className="flex items-center gap-3 pt-1">
                    <div className="w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center shrink-0 shadow-lg group-hover:bg-orange-500 transition-all duration-500">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0v16.5m0 0h13.5m-13.5 0L6 16.5m12-9h3.75m-3.75 3h3.75m-3.75 3h3.75" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Lifetime</p>
                      <p className="text-xl font-black text-black tabular-nums tracking-tighter leading-none">{totalMovements.toLocaleString()}</p>
                    </div>
                 </div>
              </div>

              <div className="mt-4 space-y-2 pt-3 border-t border-gray-50">
                 <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Today Mov.</span>
                    <span className="text-[11px] font-black text-black tabular-nums">{todayMovements.toLocaleString()}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">R/S Vol</span>
                    <div className="flex items-center gap-1.5 transition-all duration-300">
                      <span className="text-[11px] font-black tabular-nums text-orange-500">+{receiveTodayQty.toLocaleString()}</span>
                      <span className="text-[11px] font-black tabular-nums text-blue-500">-{saleTodayQty.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
