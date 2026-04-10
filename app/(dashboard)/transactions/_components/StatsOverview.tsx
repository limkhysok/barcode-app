"use client";

import React from "react";
import type { TransactionStats } from "@/src/services/transaction.service";
import {
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

type StatsOverviewProps = {
  stats: TransactionStats | null;
};

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const receiveCount = stats?.by_type?.Receive?.total_count || 0;
  const receiveToday = stats?.by_type?.Receive?.today_count || 0;
  const receiveTodayQty = stats?.by_type?.Receive?.today_total_quantity || 0;

  const saleCount = stats?.by_type?.Sale?.total_count || 0;
  const saleToday = stats?.by_type?.Sale?.today_count || 0;
  const saleTodayQty = stats?.by_type?.Sale?.today_total_quantity || 0;

  const total = stats?.total_transactions || 0;
  const today = stats?.today_transactions || 0;

  return (
    <div className="w-full">
      {/* ── Mobile Overview ── */}
      <div className="block sm:hidden rounded-md border border-slate-200 bg-white overflow-hidden">

        {/* Header: Lifetime Stats (With Vertical Dividers) */}
        <div className="px-0 py-0 bg-white border-b border-slate-200">
          <div className="px-3 py-2 border-b border-slate-200 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-black">Overview</span>
          </div>

          <div className="grid grid-cols-3 gap-0 divide-x divide-slate-200">
            {/* Receive */}
            <div className="flex flex-col items-center gap-1 py-4">
              <TrendingDown className="h-6 w-6 text-orange-600 scale-x-[-1]" strokeWidth={2} />
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none">Receive</p>
              <p className="text-base font-black text-black leading-none">{receiveCount.toLocaleString()}</p>
            </div>

            {/* Sale */}
            <div className="flex flex-col items-center gap-1 py-4">
              <TrendingUp className="h-6 w-6 text-orange-600" strokeWidth={2} />
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none">Sale</p>
              <p className="text-base font-black text-black leading-none">{saleCount.toLocaleString()}</p>
            </div>

            {/* Total */}
            <div className="flex flex-col items-center gap-1 py-4">
              <Zap className="h-6 w-6 text-orange-600" strokeWidth={2} />
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none">Total</p>
              <p className="text-base font-black text-black leading-none">{total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Today's Activity: Horizontal Layout */}
        <div className="bg-white">
          <div className="px-3 py-2  flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
              <span className="text-[10px] font-black text-black uppercase tracking-widest">Today</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none" suppressHydrationWarning>
                {new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Phnom_Penh" })}
              </p>
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase">{today} Total</span>
          </div>

          <div className="grid grid-cols-2 division-y division-slate-300">
            {/* Today Receive - Horizontal */}
            <div className="flex items-center py-2.5 px-7 bg-white border-r border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 text-black shrink-0">
                  <TrendingDown size={18} strokeWidth={2.5} className="scale-x-[-1]" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase leading-tight">Item : +{receiveToday}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight">Quantity : {receiveTodayQty}</p>
                </div>
              </div>
            </div>

            {/* Today Sale - Horizontal */}
            <div className="flex items-center py-2.5 px-7 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 text-black shrink-0">
                  <TrendingUp size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase leading-tight">Item : -{saleToday}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight">Quantity : {saleTodayQty}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop Overview (3 Card Layout) ── */}
      <div className="hidden sm:grid grid-cols-3 gap-3">
        {/* Box: Receive */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between pb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Total Receive</p>
            <TrendingDown className="h-8 w-8 text-orange-600 scale-x-[-1]" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter text-black">{receiveCount.toLocaleString()}</p>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-3">
              <span className="text-xs font-black text-orange-600">+{receiveToday} Today</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Quantity {receiveTodayQty}</span>
            </div>
          </div>
        </div>

        {/* Box: Sale */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between pb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Total Sale</p>
            <TrendingUp className="h-8 w-8 text-orange-600" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter text-black">{saleCount.toLocaleString()}</p>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-3">
              <span className="text-xs font-black text-orange-600">-{saleToday} Today</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Quantity {saleTodayQty}</span>
            </div>
          </div>
        </div>

        {/* Box: Total */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between pb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Total Activity</p>
            <Zap className="h-8 w-8 text-orange-600" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter text-black">{total.toLocaleString()}</p>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-3">
              <span className="text-xs font-black text-black uppercase tracking-widest">{today} Today</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;