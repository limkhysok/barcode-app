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

  return (
    <div className="space-y-3">
      {/* ── Mobile Overview (Unified Black/Orange Style) ── */}
      <div className="sm:hidden group bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col transition-all duration-300 active:scale-[0.98] hover:border-orange-500/50 shadow-sm">
        <div className="px-3 py-1 bg-slate-900 flex items-center justify-between transition-colors duration-500 group-hover:bg-orange-600">
          <span className="text-[9px] font-black text-white/80 uppercase tracking-[0.2em]">Quick Stats</span>
          <span className="text-[9px] font-bold text-white tabular-nums opacity-60">Real-time</span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-gray-50 bg-white">
          {[
            { label: "Receive", count: receiveCount, icon: "↓", today: receiveTodayCount, color: "text-orange-500" },
            { label: "Sale", count: saleCount, icon: "↑", today: saleTodayCount, color: "text-black" },
            { label: "Total", count: totalMovements, icon: "●", today: todayMovements, color: "text-slate-400" },
          ].map((item) => (
            <div key={item.label} className="px-2 py-4 flex flex-col items-center text-center gap-2 hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 shadow-lg group-hover:bg-orange-500 transition-colors">
                <span className="text-white text-[12px] font-black">{item.icon}</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                <p className={`text-lg font-black tabular-nums tracking-tighter transition-colors leading-none ${item.color}`}>{item.count.toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-center border-t border-gray-50 pt-1.5 w-8">
                <span className="text-[9px] font-black text-black tabular-nums leading-none">+{item.today.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Desktop (High Density Black/Orange) ── */}
      <div className="hidden sm:grid grid-cols-10 gap-2 items-stretch">
        {/* Left Side: Detail Metrics (7 cols) */}
        <div className="col-span-7 grid grid-cols-2 gap-2">
          {/* All Receive */}
          <div className="group/receive bg-white border border-gray-200 rounded-md px-3.5 py-3 transition-all duration-300 hover:border-orange-500/30 hover:shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center shrink-0 transition-all group-hover/receive:bg-orange-500">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 group-hover/receive:text-orange-500 transition-colors">All Receive</p>
                <p className="text-[22px] font-black text-black tabular-nums tracking-tighter leading-none">{receiveCount.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 border-l border-gray-100 pl-3.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Today Tx</span>
                <span className="text-[12px] font-black text-black tabular-nums group-hover/receive:text-orange-600 transition-colors">+{receiveTodayCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Today Qty</span>
                <span className="text-[12px] font-black text-black tabular-nums group-hover/receive:text-orange-600 transition-colors">+{receiveTodayQty.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* All Sale */}
          <div className="group/sale bg-white border border-gray-200 rounded-md px-3.5 py-3 transition-all duration-300 hover:border-orange-500/30 hover:shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center shrink-0 transition-all group-hover/sale:bg-orange-500">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 group-hover/sale:text-orange-500 transition-colors">All Sale</p>
                <p className="text-[22px] font-black text-black tabular-nums tracking-tighter leading-none">{saleCount.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 border-l border-gray-100 pl-3.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Today Tx</span>
                <span className="text-[12px] font-black text-black tabular-nums group-hover/sale:text-orange-600 transition-colors">-{saleTodayCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Today Qty</span>
                <span className="text-[12px] font-black text-black tabular-nums group-hover/sale:text-orange-600 transition-colors">{saleTodayQty.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Lifetime Overview (3 cols) */}
        <div className="col-span-3">
          <div className="group h-full bg-white border border-gray-200 rounded-md px-3.5 py-3 transition-all duration-300 hover:border-orange-500/30 hover:shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-all duration-300">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0v16.5m0 0h13.5m-13.5 0L6 16.5m12-9h3.75m-3.75 3h3.75m-3.75 3h3.75" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 group-hover:text-orange-500 transition-colors">Lifetime</p>
                <p className="text-[22px] font-black text-black tabular-nums tracking-tighter leading-none">{totalMovements.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 border-l border-gray-100 pl-3.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Today Mov.</span>
                <span className="text-[12px] font-black text-black tabular-nums">{todayMovements.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Net Vol</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-black tabular-nums text-orange-500">+{receiveTodayQty.toLocaleString()}</span>
                  <span className="text-[12px] font-black tabular-nums text-black">{saleTodayQty.toLocaleString()}</span>
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
