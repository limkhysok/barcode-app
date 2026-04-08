"use client";

import React from "react";
import type { TransactionStats } from "@/src/services/transaction.service";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Layers
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
        <div className="p-2 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-widest text-black">Lifetime</span>
          </div>

          <div className="grid grid-cols-3 gap-0 divide-x divide-slate-200">
            {/* Receive - Left */}
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Receive</p>
              <p className="text-base font-black text-black leading-none">{receiveCount.toLocaleString()}</p>
            </div>

            {/* Sale - Left (With border division) */}
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Sale</p>
              <p className="text-base font-black text-black leading-none">{saleCount.toLocaleString()}</p>
            </div>

            {/* Total - Right (With border division) */}
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Total</p>
              <p className="text-base font-black text-black leading-none">{total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Today's Activity: Horizontal Layout */}
        <div className="p-2 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <span className="text-[10px] font-black text-black uppercase tracking-widest">Today's Activity</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase italic">
              {today} Total
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Today Receive - Horizontal */}
            <div className="flex items-center p-2.5 bg-white rounded-sm border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-orange-50 rounded text-orange-600 shrink-0">
                  <ArrowDownLeft size={14} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-black leading-tight">+{receiveToday}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">Quantity : {receiveTodayQty}</p>
                </div>
              </div>
            </div>

            {/* Today Sale - Horizontal */}
            <div className="flex items-center p-2.5 bg-white rounded-sm border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-slate-50 rounded text-black shrink-0">
                  <ArrowUpRight size={14} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-black leading-tight">-{saleToday}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">Quantity : {saleTodayQty}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop Overview (3 Card Layout) ── */}
      <div className="hidden sm:grid grid-cols-3 gap-4">
        {/* Box: Receive */}
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Receive</p>
            <ArrowDownLeft className="h-4 w-4 text-black" strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter text-black">{receiveCount.toLocaleString()}</p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
              <span className="text-xs font-black text-orange-600">+{receiveToday} Today</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Qty: {receiveTodayQty}</span>
            </div>
          </div>
        </div>

        {/* Box: Sale */}
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Sale</p>
            <ArrowUpRight className="h-4 w-4 text-black" strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter text-black">{saleCount.toLocaleString()}</p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
              <span className="text-xs font-black text-orange-600">-{saleToday} Today</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Qty: {saleTodayQty}</span>
            </div>
          </div>
        </div>

        {/* Box: Total */}
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Activity</p>
            <BarChart3 className="h-4 w-4 text-black" strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter text-black">{total.toLocaleString()}</p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
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