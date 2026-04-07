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

      {/* ── Desktop ── */}
      <div className="hidden sm:grid grid-cols-10 gap-3 items-stretch">

        {/* ── Transaction Flow & Details (Unified) ── */}
        <div className="group col-span-7 border border-gray-100 rounded-2xl bg-white shadow-sm transition-all duration-300 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5 overflow-hidden flex flex-col">
          {/* Section 1: Progress Bar */}
          <div className="p-4 border-b border-gray-50 bg-slate-50/30">
            <div className="flex items-center gap-4">
               <div className="flex flex-col items-start gap-0.5 shrink-0">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-orange-500 transition-colors">Receive</span>
                  <span className="text-[16px] font-black text-black tabular-nums">{receiveShare}%</span>
               </div>
               <div className="flex-1 h-3 rounded-full overflow-hidden bg-white relative border border-gray-200/50 shadow-inner">
                  <div className="absolute inset-y-0 left-0 bg-orange-500 transition-all duration-1000 ease-out shadow-lg shadow-orange-500/20" style={{ width: `${receiveShare}%` }} />
                  <div className="absolute inset-y-0 right-0 bg-blue-500 transition-all duration-1000 ease-out shadow-lg shadow-blue-500/20" style={{ width: `${saleShare}%` }} />
               </div>
               <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sale</span>
                  <span className="text-[16px] font-black text-black/40 tabular-nums">{saleShare}%</span>
               </div>
            </div>
          </div>

          {/* Section 2: Detailed Metrics */}
          <div className="flex-1 grid grid-cols-2 divide-x divide-gray-50">
             {/* All Receive */}
             <div className="p-5 space-y-4 hover:bg-slate-50/50 transition-colors group/receive">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center transition-all group-hover/receive:bg-orange-500">
                      <svg className="w-5 h-5 text-gray-400 group-hover/receive:text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                      </svg>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover/receive:text-orange-500">All Receive</p>
                      <p className="text-3xl font-black text-black tabular-nums tracking-tighter leading-none">{receiveCount.toLocaleString()}</p>
                   </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-50">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today Tx</span>
                      <span className="text-[13px] font-black text-black tabular-nums group-hover/receive:text-orange-600">+{receiveTodayCount.toLocaleString()}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today Qty</span>
                      <span className="text-[13px] font-black text-black tabular-nums group-hover/receive:text-orange-600">+{receiveTodayQty.toLocaleString()}</span>
                   </div>
                </div>
             </div>

             {/* All Sale */}
             <div className="p-5 space-y-4 hover:bg-slate-50/50 transition-colors group/sale">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center transition-all group-hover/sale:bg-blue-600">
                      <svg className="w-5 h-5 text-gray-400 group-hover/sale:text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                      </svg>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover/sale:text-blue-600">All Sale</p>
                      <p className="text-3xl font-black text-black tabular-nums tracking-tighter leading-none">{saleCount.toLocaleString()}</p>
                   </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-50">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today Tx</span>
                      <span className="text-[13px] font-black text-black tabular-nums group-hover/sale:text-blue-600">-{saleTodayCount.toLocaleString()}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today Qty</span>
                      <span className="text-[13px] font-black text-black tabular-nums group-hover/sale:text-blue-600">-{saleTodayQty.toLocaleString()}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* ── Overview ── */}
        <div className="group col-span-3 border border-gray-100 rounded-2xl bg-white flex flex-col transition-all duration-300 shadow-sm hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/10">
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
               <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Overview</p>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
               </div>
               
               <div className="flex items-start gap-3 pt-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 shadow-lg group-hover:bg-orange-500 transition-all duration-500 group-hover:rotate-6">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0v16.5m0 0h13.5m-13.5 0L6 16.5m12-9h3.75m-3.75 3h3.75m-3.75 3h3.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Lifetime</p>
                    <p className="text-2xl font-black text-black tabular-nums tracking-tighter leading-none">{totalMovements.toLocaleString()}</p>
                  </div>
               </div>
            </div>

            <div className="mt-6 space-y-2 pt-4 border-t border-gray-50">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today Mov.</span>
                  <span className="text-[13px] font-black text-black tabular-nums">{todayMovements.toLocaleString()}</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vol (R/S)</span>
                  <div className="flex items-center gap-1 transition-all duration-300 text-black/50">
                    <span className="text-[12px] font-black tabular-nums text-orange-500">+{receiveTodayQty.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-gray-200">/</span>
                    <span className="text-[12px] font-black tabular-nums text-blue-500">-{saleTodayQty.toLocaleString()}</span>
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
