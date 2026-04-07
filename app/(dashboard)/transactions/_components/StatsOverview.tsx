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
  const qtyTotal = (receiveTodayQty + saleTodayQty) || 1;
  const receiveQtyShare = Math.round((receiveTodayQty / qtyTotal) * 100);



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

        {/* ── Receive vs Sale ── */}
        <div className="group col-span-7 border border-gray-800 rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/10">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-black shrink-0 transition-colors duration-500 group-hover:bg-orange-600">

            <div className="flex-1 flex items-center gap-3">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                <span className="text-[11px] font-bold text-white tabular-nums">{receiveShare}%</span>
              </div>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/20 relative">
                <div className="absolute inset-y-0 left-0 bg-white transition-all duration-700" style={{ width: `${receiveShare}%` }} />
                <div className="absolute inset-y-0 right-0 bg-white/40 transition-all duration-700" style={{ width: `${saleShare}%` }} />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-bold text-white/50 tabular-nums">{saleShare}%</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
              </div>
            </div>
          </div>

          <div className="bg-white flex-1 flex flex-col">
            {/* Two-column stats */}
            <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
              {/* Receive */}
              <div className="px-4 py-2.5 space-y-2 transition-colors duration-300 hover:bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="group cursor-pointer w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-black/20 ring-1 ring-white/10 transition-all duration-300 hover:bg-orange-500 hover:scale-110 hover:-rotate-3 hover:shadow-orange-500/20 group-hover:bg-orange-500 group-hover:scale-105 group-hover:-rotate-3">
                      <svg className="w-5 h-5 text-white transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none transition-colors duration-300 group-hover:text-orange-400">All Receive</p>
                      <p className="text-3xl font-black text-black tabular-nums tracking-tighter leading-tight transition-all duration-300 group-hover:text-orange-600 group-hover:scale-105 origin-left">{receiveCount.toLocaleString()}</p>
                    </div>
                  </div>

                </div>

                <div className="flex flex-col gap-2 pt-1 border-t border-gray-100 mt-2">
                  {/* Today */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gray-800 flex items-center justify-center shrink-0 border border-white/5 transition-all duration-300 hover:bg-orange-500 hover:scale-110 cursor-pointer group-hover:bg-orange-500 group-hover:scale-110">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none transition-colors duration-300 group-hover:text-orange-400">Today</p>
                    </div>
                  </div>
                  {/* Transactions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gray-800 flex items-center justify-center shrink-0 border border-white/5 transition-all duration-300 hover:bg-orange-500 hover:scale-110 cursor-pointer group-hover:bg-orange-500 group-hover:scale-110">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m9-6L12 15m0 0l-4.5-4.5M12 15V3.75" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none transition-colors duration-300 group-hover:text-orange-500">Transactions :</p>
                    </div>
                    <span className="text-[12px] font-black text-black tabular-nums tracking-tighter transition-all duration-300 group-hover:text-orange-600 group-hover:scale-105">{receiveTodayCount.toLocaleString()}</span>
                  </div>
                  {/* Quantity */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gray-800 flex items-center justify-center shrink-0 border border-white/5 transition-all duration-300 hover:bg-orange-500 hover:scale-110 cursor-pointer group-hover:bg-orange-500 group-hover:scale-110">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none transition-colors duration-300 group-hover:text-orange-500">Quantity :</p>
                    </div>
                    <span className="text-[12px] font-black text-black tabular-nums tracking-tighter transition-all duration-300 group-hover:text-orange-600 group-hover:scale-105">{receiveTodayQty.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Sale */}
              <div className="px-4 py-2.5 space-y-2 transition-colors duration-300 hover:bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="group cursor-pointer w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-black/20 ring-1 ring-white/10 transition-all duration-300 hover:bg-orange-500 hover:scale-110 hover:rotate-3 hover:shadow-orange-500/20 group-hover:bg-orange-500 group-hover:scale-105 group-hover:rotate-3">
                      <svg className="w-5 h-5 text-white transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none transition-colors duration-300 group-hover:text-orange-400">All Sale</p>
                      <p className="text-3xl font-black text-black tabular-nums tracking-tighter leading-tight transition-all duration-300 group-hover:text-orange-600 group-hover:scale-105 origin-left">{saleCount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1 border-t border-gray-100 mt-2">
                  {/* Today */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gray-800 flex items-center justify-center shrink-0 border border-white/5 transition-all duration-300 hover:bg-orange-500 hover:scale-110 cursor-pointer group-hover:bg-orange-500 group-hover:scale-110">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none transition-colors duration-300 group-hover:text-orange-400">Today</p>
                    </div>
                  </div>
                  {/* Transactions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gray-800 flex items-center justify-center shrink-0 border border-white/5 transition-all duration-300 hover:bg-orange-500 hover:scale-110 cursor-pointer group-hover:bg-orange-500 group-hover:scale-110">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m9-6L12 15m0 0l-4.5-4.5M12 15V3.75" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none transition-colors duration-300 group-hover:text-orange-500">Transactions :</p>
                    </div>
                    <span className="text-[12px] font-black text-black tabular-nums tracking-tighter transition-all duration-300 group-hover:text-orange-600 group-hover:scale-105">-{saleTodayCount.toLocaleString()}</span>
                  </div>
                  {/* Quantity */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gray-800 flex items-center justify-center shrink-0 border border-white/5 transition-all duration-300 hover:bg-orange-500 hover:scale-110 cursor-pointer group-hover:bg-orange-500 group-hover:scale-110">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none transition-colors duration-300 group-hover:text-orange-500">Quantity :</p>
                    </div>
                    <span className="text-[12px] font-black text-black tabular-nums tracking-tighter transition-all duration-300 group-hover:text-orange-600 group-hover:scale-105">{saleTodayQty.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* ── Overview ── */}
        <div className="group col-span-3 border border-gray-800 rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/10">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-black shrink-0 transition-colors duration-500 group-hover:bg-orange-600">
            <p className="text-[11px] font-semibold text-white/70">Overview</p>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white shrink-0" />

            </div>
          </div>

          <div className="bg-white flex-1 flex flex-col">
            <div className="grid grid-cols-1 border-b border-gray-100 transition-colors duration-300 hover:bg-slate-50/50">
              {/* All time */}
              <div className="px-4 py-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="group cursor-pointer w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-black/20 ring-1 ring-white/10 transition-all duration-300 hover:bg-orange-500 hover:scale-110 hover:-rotate-3 hover:shadow-orange-500/20 group-hover:bg-orange-500 group-hover:scale-105 group-hover:-rotate-3">
                    <svg className="w-5 h-5 text-white transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0v16.5m0 0h13.5m-13.5 0L6 16.5m12-9h3.75m-3.75 3h3.75m-3.75 3h3.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none transition-colors duration-300 group-hover:text-orange-400">All time</p>
                    <p className="text-3xl font-black text-black tabular-nums tracking-tighter leading-tight transition-all duration-300 group-hover:text-orange-600 group-hover:scale-105 origin-left">{totalMovements.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1 border-t border-gray-100 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gray-800 flex items-center justify-center shrink-0 border border-white/5 transition-all duration-300 hover:bg-orange-500 hover:scale-110 cursor-pointer group-hover:bg-orange-500 group-hover:scale-110">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none transition-colors duration-300 group-hover:text-orange-400">Today</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gray-800 flex items-center justify-center shrink-0 border border-white/5 transition-all duration-300 hover:bg-orange-500 hover:scale-110 cursor-pointer group-hover:bg-orange-500 group-hover:scale-110">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m9-6L12 15m0 0l-4.5-4.5M12 15V3.75" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none transition-colors duration-300 group-hover:text-orange-500">Transactions :</p>
                    </div>
                    <span className="text-[12px] font-black text-black tabular-nums tracking-tighter transition-all duration-300 group-hover:text-orange-600 group-hover:scale-105">{todayMovements.toLocaleString()}</span>
                  </div>
                  {/* Quantity */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gray-800 flex items-center justify-center shrink-0 border border-white/5 transition-all duration-300 hover:bg-orange-500 hover:scale-110 cursor-pointer group-hover:bg-orange-500 group-hover:scale-110">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none transition-colors duration-300 group-hover:text-orange-500">QUANTITY :</p>
                    </div>
                    <div className="flex items-center gap-1.5 transition-all duration-300 group-hover:text-orange-600 group-hover:scale-105">
                      <span className="text-[12px] font-black tabular-nums tracking-tighter">+{receiveTodayQty.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-gray-300 group-hover:text-orange-300">/</span>
                      <span className="text-[12px] font-black tabular-nums tracking-tighter">-{saleTodayQty.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Donut chart */}

          </div>
        </div>

      </div>
    </div>
  );
};

export default StatsOverview;
