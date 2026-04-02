"use client";

import React from "react";
import type { TransactionStats } from "@/src/services/transaction.service";

type StatsOverviewProps = {
  stats: TransactionStats | null;
};

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const receiveVal = Number(stats?.by_type?.Receive?.total_value || 0);
  const saleVal = Number(stats?.by_type?.Sale?.total_value || 0);
  const receiveCount = stats?.by_type?.Receive?.count || 0;
  const saleCount = stats?.by_type?.Sale?.count || 0;
  const totalMovements = stats?.total_transactions || 0;

  const fmt = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 border border-black bg-white overflow-hidden rounded-xl">
      {/* Total Receive */}
      <div className="px-4 py-3 flex items-center justify-between border-b sm:border-b-0 sm:border-r border-black">
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-0.5">Total Receive</p>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-black text-black tabular-nums">{receiveCount.toLocaleString()}</span>
            <span className="text-[12px] font-bold text-gray-800 tabular-nums">/ +${fmt(receiveVal)}</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-sm border border-black bg-slate-50 flex items-center justify-center text-black shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
      </div>

      {/* Total Sale */}
      <div className="px-4 py-3 flex items-center justify-between border-b sm:border-b-0 sm:border-r border-black">
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-0.5">Total Sale</p>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-black text-black tabular-nums">{saleCount.toLocaleString()}</span>
            <span className="text-[12px] font-bold text-gray-800 tabular-nums">/ -${fmt(saleVal)}</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-sm border border-black bg-slate-50 flex items-center justify-center text-black shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
          </svg>
        </div>
      </div>

      {/* Total Transactions */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-0.5">Transactions</p>
          <span className="text-xl font-black text-black tabular-nums">{totalMovements.toLocaleString()}</span>
        </div>
        <div className="w-8 h-8 rounded-sm border border-black bg-slate-50 flex items-center justify-center text-black shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
