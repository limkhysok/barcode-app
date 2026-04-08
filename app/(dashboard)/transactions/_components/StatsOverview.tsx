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
          <div className="group bg-white border border-gray-100 rounded-md p-3.5 shadow-sm transition-all duration-300 hover:border-orange-500/30 hover:shadow-xl group/receive overflow-hidden flex flex-col justify-between h-full">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center transition-all group-hover/receive:bg-orange-500 shrink-0 shadow-sm border border-gray-100/50">
                <svg className="w-8 h-8 text-gray-400 group-hover/receive:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5 group-hover/receive:text-orange-500">All Receive</p>
                <p className="text-[26px] font-black text-black tabular-nums tracking-tighter leading-none">{receiveCount.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-gray-50">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 grayscale opacity-50">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today Tx</span>
                </div>
                <span className="text-[13px] font-black text-black tabular-nums group-hover/receive:text-orange-600">+{receiveTodayCount.toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 grayscale opacity-50">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M21 7.5V18M15 7.5V18M9 7.5V18M3 7.5V18M3 21h18M3 3h18"/></svg>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today Qty</span>
                </div>
                <span className="text-[13px] font-black text-black tabular-nums group-hover/receive:text-orange-600">+{receiveTodayQty.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* All Sale */}
          <div className="group bg-white border border-gray-100 rounded-md p-3.5 shadow-sm transition-all duration-300 hover:border-orange-500/10 hover:shadow-xl group/sale overflow-hidden flex flex-col justify-between h-full">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center transition-all group-hover/sale:bg-orange-500 shrink-0 shadow-sm border border-gray-100/50">
                <svg className="w-8 h-8 text-gray-400 group-hover/sale:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5 group-hover/sale:text-orange-600 transition-colors">All Sale</p>
                <p className="text-[26px] font-black text-black tabular-nums tracking-tighter leading-none">{saleCount.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-gray-50">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 grayscale opacity-50">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today Tx</span>
                </div>
                <span className="text-[13px] font-black text-black tabular-nums group-hover/sale:text-orange-600">-{saleTodayCount.toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 grayscale opacity-50">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M21 7.5V18M15 7.5V18M9 7.5V18M3 7.5V18M3 21h18M3 3h18"/></svg>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today Qty</span>
                </div>
                <span className="text-[13px] font-black text-black tabular-nums group-hover/sale:text-orange-600">{saleTodayQty.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Lifetime Overview (3 cols) */}
        <div className="col-span-3">
          <div className="group h-full bg-white border border-gray-100 rounded-md p-3.5 shadow-sm transition-all duration-300 hover:border-orange-500/30 hover:shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-4 pt-0.5">
                <div className="w-14 h-14 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 shadow-xl group-hover:bg-orange-500 transition-all duration-500 shadow-black/20 group-hover:shadow-orange-500/20">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0v16.5m0 0h13.5m-13.5 0L6 16.5m12-9h3.75m-3.75 3h3.75m-3.75 3h3.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5 group-hover:text-orange-500 transition-colors">Lifetime</p>
                  <p className="text-[28px] font-black text-black tabular-nums tracking-tighter leading-none">{totalMovements.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3 pt-3 border-t border-gray-50/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 grayscale opacity-50">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Today Mov.</span>
                </div>
                <span className="text-[13px] font-black text-black tabular-nums">{todayMovements.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 grayscale opacity-50">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Net Vol</span>
                </div>
                <div className="flex items-center gap-2 transition-all duration-300">
                  <span className="text-[13px] font-black tabular-nums text-orange-500">+{receiveTodayQty.toLocaleString()}</span>
                  <span className="text-[13px] font-black tabular-nums text-black">{saleTodayQty.toLocaleString()}</span>
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
