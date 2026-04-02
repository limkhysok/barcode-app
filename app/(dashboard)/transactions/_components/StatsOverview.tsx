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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Total Receive */}
      <div className="px-5 py-4 border border-black bg-white rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-black text-gray-700 ">Receive</p>
          <div className="w-7 h-7 rounded-none border border-black bg-slate-50 flex items-center justify-center text-black shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-light text-gray-600 ">Total Count</span>
            <span className="text-sm font-black text-black tabular-nums">{receiveCount.toLocaleString()}</span>
          </div>
          <div className="border-t border-dashed border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-light text-gray-600 ">Total Money</span>
            <span className="text-sm font-bold text-black tabular-nums">+${fmt(receiveVal)}</span>
          </div>
        </div>
      </div>

      {/* Total Sale */}
      <div className="px-5 py-4 border border-black bg-white rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-black text-gray-700 ">Sale</p>
          <div className="w-7 h-7 rounded-none border border-black bg-slate-50 flex items-center justify-center text-black shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-light text-gray-600 ">Total Count</span>
            <span className="text-sm font-black text-black tabular-nums">{saleCount.toLocaleString()}</span>
          </div>
          <div className="border-t border-dashed border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-light text-gray-600 ">Total Money</span>
            <span className="text-sm font-bold text-black tabular-nums">-${fmt(saleVal)}</span>
          </div>
        </div>
      </div>

      {/* Total Transactions */}
      <div className="px-5 py-4 border border-black bg-white rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-black text-gray-700 ">Transactions</p>
          <div className="w-7 h-7 rounded-none border border-black bg-slate-50 flex items-center justify-center text-black shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-light text-gray-600 ">Total Count</span>
            <span className="text-sm font-black text-black tabular-nums">{totalMovements.toLocaleString()}</span>
          </div>
          <div className="border-t border-dashed border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-light text-gray-600 ">All Types</span>
            <span className="text-sm font-bold text-black tabular-nums">
              +{receiveCount.toLocaleString()} / -{saleCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
