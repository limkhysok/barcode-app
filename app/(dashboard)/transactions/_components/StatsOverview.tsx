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
    <div className="space-y-3">
      {/* Mobile: single combined box */}
      <div className="sm:hidden border border-black bg-white rounded-xl overflow-hidden">
        <div className="flex divide-x divide-black/10">
          <div className="flex-1 flex flex-col items-center gap-1.5 px-3 py-3">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider text-center">Receive</p>
            <span className="text-[13px] font-black text-black tabular-nums">+{receiveCount}</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1.5 px-3 py-3">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider text-center">Sale</p>
            <span className="text-[13px] font-black text-black tabular-nums">-{saleCount}</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1.5 px-3 py-3">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider text-center">Transactions</p>
            <span className="text-[13px] font-black text-black tabular-nums">{totalMovements.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Desktop View: Separate cards */}
      <div className="hidden sm:grid grid-cols-3 gap-3">
        {/* Total Receive */}
        <div className="px-5 py-4 border border-black bg-white rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-black text-gray-700 ">Receive</p>
            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
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
            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
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
            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white shrink-0">
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
    </div>
  );
};

export default StatsOverview;
