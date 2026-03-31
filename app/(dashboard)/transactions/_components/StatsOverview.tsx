"use client";

import React from "react";
import type { TransactionStats } from "@/src/services/transaction.service";

type StatsOverviewProps = {
  stats: TransactionStats | null;
};

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const receiveVal = Number(stats?.by_type?.Receive?.total_value || 0);
  const saleVal = Number(stats?.by_type?.Sale?.total_value || 0);
  const netValue = receiveVal - saleVal;

  const receiveCount = stats?.by_type?.Receive?.count || 0;
  const saleCount = stats?.by_type?.Sale?.count || 0;
  const totalMovements = stats?.total_transactions || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-black bg-white overflow-hidden">
      {/* Total Receive — col1 always, right border + bottom at md, right only at lg */}
      <div className="p-3 sm:p-4 flex flex-col justify-between border-b md:border-r lg:border-b-0 border-black transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black bg-orange-500 text-white px-2 py-0.5 inline-block uppercase tracking-[0.15em] mb-1.5 sm:mb-2.5">
              Total Receive
            </p>
            <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-black tabular-nums leading-none">
              {receiveCount.toLocaleString()}
            </h4>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm border border-black bg-slate-50 flex items-center justify-center text-slate-900">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4 pt-2.5 sm:pt-3 border-t border-black/5 flex items-center justify-between text-[10px] font-bold uppercase">
          <span className="text-slate-400 tracking-tighter">Receive Value:</span>
          <span className="text-black">${receiveVal.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      {/* Total Sale — col2 at md/lg, keeps bottom at md (row sep), right only at lg */}
      <div className="p-3 sm:p-4 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-black transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black bg-orange-500 text-white px-2 py-0.5 inline-block uppercase tracking-[0.15em] mb-1.5 sm:mb-2.5">
              Total Sale
            </p>
            <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-black tabular-nums leading-none">
              -{saleCount.toLocaleString()}
            </h4>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm border border-black bg-slate-50 flex items-center justify-center text-slate-900">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4 pt-2.5 sm:pt-3 border-t border-black/5 flex items-center justify-between text-[10px] font-bold uppercase">
          <span className="text-slate-400 tracking-tighter">Sale Value:</span>
          <span className="text-black">-${saleVal.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      {/* Net Movement — col1 row2 at md, right border at md+, no bottom at md */}
      <div className="p-3 sm:p-4 flex flex-col justify-between border-b md:border-b-0 md:border-r border-black transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black bg-orange-500 text-white px-2 py-0.5 inline-block uppercase tracking-[0.15em] mb-1.5 sm:mb-2.5">
              Net Movement
            </p>
            <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-black tabular-nums leading-none">
              {netValue < 0 ? "−" : "+"}${Math.abs(netValue).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </h4>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm border border-black bg-slate-50 flex items-center justify-center text-slate-900">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4 pt-2.5 sm:pt-3 border-t border-black/5 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
          <span className="text-slate-400">Liquidity:</span>
          <span className="text-black">{netValue >= 0 ? "Surplus" : "Deficit"}</span>
        </div>
      </div>

      {/* Total Transactions — last card, no border */}
      <div className="p-3 sm:p-4 flex flex-col justify-between transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black bg-orange-500 text-white px-2 py-0.5 inline-block uppercase tracking-[0.15em] mb-1.5 sm:mb-2.5">
              Total Transactions
            </p>
            <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-black tabular-nums leading-none">
              {totalMovements.toLocaleString()}
            </h4>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm border border-black bg-slate-50 flex items-center justify-center text-slate-900">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4 pt-2.5 sm:pt-3 border-t border-black/5 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
          <span className="text-slate-900 flex items-center tracking-normal">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mr-1.5 animate-pulse" />Live
          </span>
          <span>• Log Sync Active</span>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;

