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

  // Mini chart percentages
  const receivePercent = receiveCount > 0 ? (receiveTodayCount / receiveCount) * 100 : 0;
  const salePercent = saleCount > 0 ? (saleTodayCount / saleCount) * 100 : 0;
  const lifetimePercent = totalMovements > 0 ? (todayMovements / totalMovements) * 100 : 0;
  // Receive vs Sale proportion for lifetime stacked bar
  const totalTyped = receiveCount + saleCount;
  const receiveRatio = totalTyped > 0 ? (receiveCount / totalTyped) * 100 : 50;

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
          <div className="group/receive bg-white border border-gray-200 rounded-md px-3.5 pt-3 pb-2.5 transition-all duration-300 hover:border-orange-500/30 hover:shadow-md flex flex-col gap-2">
            {/* Header row: label + icon */}
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover/receive:text-orange-500 transition-colors">All Receive</p>
              <svg className="w-8 h-8 text-gray-300 group-hover/receive:text-orange-400 transition-colors shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M6.912 3a3 3 0 00-2.868 2.118l-2.411 7.838a3 3 0 00-.133.882V18a3 3 0 003 3h15a3 3 0 003-3v-4.162c0-.299-.045-.596-.133-.882l-2.412-7.838A3 3 0 0017.088 3H6.912zm13.823 9.75l-2.213-7.191A1.5 1.5 0 0017.088 4.5H6.912a1.5 1.5 0 00-1.434 1.059L3.265 12.75H6.11a3 3 0 012.684 1.658l.256.513a1.5 1.5 0 001.342.829h3.218a1.5 1.5 0 001.342-.83l.256-.512a3 3 0 012.684-1.658h2.844z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v6.44l1.72-1.72a.75.75 0 111.06 1.06l-3 3a.75.75 0 01-1.06 0l-3-3a.75.75 0 011.06-1.06l1.72 1.72V3a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
            </div>
            {/* Main row: big number + today stats */}
            <div className="flex items-center justify-between">
              <p className="text-[22px] font-black text-black tabular-nums tracking-tighter leading-none">{receiveCount.toLocaleString()}</p>
              <div className="flex flex-col items-end gap-1.5 border-l border-gray-100 pl-3.5">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Today Receive</span>
                  <span className="text-[11px] font-black text-black tabular-nums group-hover/receive:text-orange-600 transition-colors">+{receiveTodayCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Today Quantity</span>
                  <span className="text-[11px] font-black text-black tabular-nums group-hover/receive:text-orange-600 transition-colors">+{receiveTodayQty.toLocaleString()}</span>
                </div>
              </div>
            </div>
            {/* Mini progress bar: today / total */}
            <div className="space-y-0.5 mt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Today vs Total</span>
                <span className="text-[9px] font-black text-gray-400 tabular-nums">{receivePercent.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-700 group-hover/receive:bg-orange-400"
                  style={{ width: `${Math.min(receivePercent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* All Sale */}
          <div className="group/sale bg-white border border-gray-200 rounded-md px-3.5 pt-3 pb-2.5 transition-all duration-300 hover:border-orange-500/30 hover:shadow-md flex flex-col gap-2">
            {/* Header row: label + icon */}
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover/sale:text-orange-500 transition-colors">All Sale</p>
              <svg className="w-8 h-8 text-gray-300 group-hover/sale:text-orange-400 transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
              </svg>
            </div>
            {/* Main row: big number + today stats */}
            <div className="flex items-center justify-between">
              <p className="text-[22px] font-black text-black tabular-nums tracking-tighter leading-none">{saleCount.toLocaleString()}</p>
              <div className="flex flex-col items-end gap-1.5 border-l border-gray-100 pl-3.5">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Today Sale</span>
                  <span className="text-[11px] font-black text-black tabular-nums group-hover/sale:text-orange-600 transition-colors">-{saleTodayCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Today Quantity</span>
                  <span className="text-[11px] font-black text-black tabular-nums group-hover/sale:text-orange-600 transition-colors">{saleTodayQty.toLocaleString()}</span>
                </div>
              </div>
            </div>
            {/* Mini progress bar: today / total */}
            <div className="space-y-0.5 mt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Today vs Total</span>
                <span className="text-[9px] font-black text-gray-400 tabular-nums">{salePercent.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800 rounded-full transition-all duration-700 group-hover/sale:bg-orange-400"
                  style={{ width: `${Math.min(salePercent, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Lifetime Overview (3 cols) */}
        <div className="col-span-3">
          <div className="group h-full bg-white border border-gray-200 rounded-md px-3.5 pt-3 pb-2.5 transition-all duration-300 hover:border-orange-500/30 hover:shadow-md flex flex-col gap-2">
            {/* Header row: label + icon */}
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover:text-orange-500 transition-colors">Lifetime</p>
              <svg className="w-8 h-8 text-gray-300 group-hover:text-orange-400 transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            {/* Main row: big number + today stats */}
            <div className="flex items-center justify-between">
              <p className="text-[22px] font-black text-black tabular-nums tracking-tighter leading-none">{totalMovements.toLocaleString()}</p>
              <div className="flex flex-col items-end gap-1.5 border-l border-gray-100 pl-3.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Today Trans</span>
                  <span className="text-[12px] font-black text-black tabular-nums">{todayMovements.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">IN/OUT</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-black tabular-nums text-orange-500">+{receiveTodayQty.toLocaleString()}</span>
                    <span className="text-[12px] font-black tabular-nums text-black">{saleTodayQty.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Stacked bar: Receive (orange) vs Sale (slate) proportion */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-sm bg-orange-500" />
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Rcv</span>
                  <span className="inline-block w-2 h-2 rounded-sm bg-slate-800 ml-1" />
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Sale</span>
                </div>
                <span className="text-[9px] font-black text-gray-400 tabular-nums">{lifetimePercent.toFixed(1)}% today</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-orange-500 transition-all duration-700"
                  style={{ width: `${receiveRatio}%` }}
                />
                <div
                  className="h-full bg-slate-800 transition-all duration-700"
                  style={{ width: `${100 - receiveRatio}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
