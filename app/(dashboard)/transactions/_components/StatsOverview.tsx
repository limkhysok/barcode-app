"use client";

import React, { useMemo } from "react";
import type { TransactionStats } from "@/src/services/transaction.service";
import {
  TrendingDown,
  TrendingUp,
  Zap,
  Activity,
} from "lucide-react";

type StatsOverviewProps = {
  stats: TransactionStats | null;
};

function fmt(n: number) {
  return n.toLocaleString();
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const receiveCount = stats?.by_type?.Receive?.total_count || 0;
  const receiveToday = stats?.by_type?.Receive?.today_count || 0;
  const receiveTodayQty = stats?.by_type?.Receive?.today_total_quantity || 0;

  const saleCount = stats?.by_type?.Sale?.total_count || 0;
  const saleToday = stats?.by_type?.Sale?.today_count || 0;
  const saleTodayQty = stats?.by_type?.Sale?.today_total_quantity || 0;

  const total = stats?.total_transactions || 0;
  const today = stats?.today_transactions || 0;

  const s = useMemo(() => {
    const totalCount = receiveCount + saleCount;
    const receiveShare = totalCount > 0 ? Math.round((receiveCount / totalCount) * 100) : 0;
    const saleShare = 100 - receiveShare;
    return { receiveShare, saleShare };
  }, [receiveCount, saleCount]);

  return (
    <div className="w-full">
      {/* ── MOBILE (< sm) ── */}
      <div className="sm:hidden bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          <div className="flex flex-col items-center gap-0.5 py-3">
            <Zap size={14} className="text-orange-500" strokeWidth={2} />
            <p className="text-[18px] font-black text-slate-900 leading-none tabular-nums">{fmt(total)}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Activity</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <TrendingDown size={14} className="text-orange-600 scale-x-[-1]" strokeWidth={2} />
            <p className="text-[18px] font-black text-slate-900 leading-none tabular-nums">{fmt(receiveCount)}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Receive</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <TrendingUp size={14} className="text-orange-300" strokeWidth={2} />
            <p className="text-[18px] font-black text-slate-900 leading-none tabular-nums">{fmt(saleCount)}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sales</p>
          </div>
        </div>
        <div className="px-3 pb-3 flex flex-col gap-1">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100">
            <div className="bg-orange-600 transition-all duration-700" style={{ width: `${s.receiveShare}%` }} />
            <div className="bg-orange-300 transition-all duration-700" style={{ width: `${s.saleShare}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest">REC {s.receiveShare}%</span>
            <span className="text-[8px] font-black text-orange-300 uppercase tracking-widest">SALE {s.saleShare}%</span>
          </div>
        </div>
      </div>

      {/* ── TABLET (sm → lg) ── */}
      <div className="hidden sm:grid lg:hidden grid-cols-3 gap-2">
        <div className="bg-white border border-slate-200 rounded-sm p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-orange-50 flex items-center justify-center">
                <TrendingDown size={14} className="text-orange-600 scale-x-[-1]" strokeWidth={2} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Received</p>
            </div>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600">
              +{receiveToday}
            </span>
          </div>
          <p className="text-[26px] font-black text-slate-900 leading-none tabular-nums tracking-tighter">{fmt(receiveCount)}</p>
          <div className="h-1 rounded-full bg-orange-100 overflow-hidden">
            <div className="h-full bg-orange-600 rounded-full" style={{ width: `${s.receiveShare}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-orange-50 flex items-center justify-center">
                <TrendingUp size={14} className="text-orange-500" strokeWidth={2} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sold out</p>
            </div>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-500">
              -{saleToday}
            </span>
          </div>
          <p className="text-[26px] font-black text-slate-900 leading-none tabular-nums tracking-tighter">{fmt(saleCount)}</p>
          <div className="h-1 rounded-full bg-orange-100 overflow-hidden">
            <div className="h-full bg-orange-400 rounded-full" style={{ width: `${s.saleShare}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-orange-50 flex items-center justify-center">
                <Zap size={14} className="text-orange-500" strokeWidth={2} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity</p>
            </div>
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Live</span>
          </div>
          <p className="text-[26px] font-black text-slate-900 leading-none tabular-nums tracking-tighter">{fmt(total)}</p>
          <div className="h-1 rounded-full bg-slate-100 overflow-hidden flex">
            <div className="h-full bg-orange-600 transition-all duration-700" style={{ width: `${s.receiveShare}%` }} />
            <div className="h-full bg-orange-300 transition-all duration-700" style={{ width: `${s.saleShare}%` }} />
          </div>
        </div>
      </div>

      {/* ── DESKTOP (≥ lg) ── */}
      <div className="hidden lg:grid grid-cols-3 gap-3">
        {/* Card: Receive */}
        <div className="bg-white border border-slate-500 rounded-sm p-4 flex flex-col gap-3 group transition-all duration-300 hover:border-orange-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover/hdr:text-orange-500 transition-colors duration-200">Lifetime Receive</p>
              <p className="text-3xl font-black text-slate-900 leading-none tabular-nums tracking-tighter mt-1">{fmt(receiveCount)}</p>
            </div>
            <div className="w-9 h-9 rounded-sm bg-orange-50 flex items-center justify-center group-hover:bg-orange-600 group-hover:rotate-12 transition-all">
              <TrendingDown size={18} className="text-orange-600 scale-x-[-1] group-hover:text-white transition-colors" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Today's Entry</span>
              <span className="text-[10px] font-black text-orange-400 uppercase">+{receiveToday} Tx · {receiveTodayQty} Qty</span>
            </div>
            <div className="h-1.5 rounded-full bg-orange-50 overflow-hidden relative">
              <div className="h-full bg-orange-600 rounded-full" style={{ width: `${s.receiveShare}%` }} />
            </div>
          </div>
        </div>

        {/* Card: Sales */}
        <div className="bg-white border border-slate-500 rounded-sm p-4 flex flex-col gap-3 group transition-all duration-300 hover:border-orange-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover/hdr:text-orange-500 transition-colors duration-200">Lifetime Sales</p>
              <p className="text-3xl font-black text-slate-900 leading-none tabular-nums tracking-tighter mt-1">{fmt(saleCount)}</p>
            </div>
            <div className="w-9 h-9 rounded-sm bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:-rotate-12 transition-all">
              <TrendingUp size={18} className="text-orange-500 group-hover:text-white transition-colors" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Today's Exit</span>
              <span className="text-[10px] font-black text-orange-300 uppercase">-{saleToday} Tx · {saleTodayQty} Qty</span>
            </div>
            <div className="h-1.5 rounded-full bg-orange-50 overflow-hidden relative">
              <div className="h-full bg-orange-300 rounded-full" style={{ width: `${s.saleShare}%` }} />
            </div>
          </div>
        </div>

        {/* Card: Overall Activity */}
        <div className="bg-white border border-slate-500 rounded-sm p-4 flex flex-col gap-3 group transition-all duration-300 hover:border-orange-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover/hdr:text-orange-500 transition-colors duration-200">Live Activity</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-black text-slate-900 leading-none tabular-nums tracking-tighter">{fmt(total)}</p>
                <div className="flex items-center gap-1 animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{today} Today</span>
                </div>
              </div>
            </div>
            <div className="w-9 h-9 rounded-sm bg-orange-50 flex items-center justify-center group-hover:bg-orange-600 group-hover:scale-110 transition-all duration-200">
              <Activity size={18} className="text-orange-600 group-hover:text-white transition-colors duration-200" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Market Split</span>
              <span className="text-[9px] font-black text-orange-600">
                {s.receiveShare}% Rec · {s.saleShare}% Sale
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-slate-100 flex">
              <div className="h-full bg-orange-600 transition-all duration-700" style={{ width: `${s.receiveShare}%` }} />
              <div className="h-full bg-orange-300 transition-all duration-700" style={{ width: `${s.saleShare}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;