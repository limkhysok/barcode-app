"use client";

import React from "react";
import { isToday } from "../utils/helpers";
import type { Transaction } from "@/src/types/transaction.types";

type StatsOverviewProps = {
  transactions: Transaction[];
};

const StatsOverview: React.FC<StatsOverviewProps> = ({ transactions }) => {
  const total = transactions.length;
  const receives = transactions.filter((t) => t.transaction_type === "Receive").length;
  const sales = transactions.filter((t) => t.transaction_type === "Sale").length;
  const todayCount = transactions.filter((t) => isToday(t.transaction_date)).length;

  return (
    <div className="flex flex-col sm:flex-row rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
      {/* Today */}
      <div className="flex-1 bg-white p-4 sm:p-5 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <span className="flex items-center gap-1.5 text-[9px] font-semibold tracking-widest uppercase border border-black px-2 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />Today
          </span>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{todayCount}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Transactions today</p>
        </div>
      </div>

      {/* Total */}
      <div className="flex-1 bg-white p-4 sm:p-5 flex flex-col justify-between gap-3">
        <div className="w-8 h-8 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 text-slate-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{total}</p>
          <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">Total</p>
        </div>
      </div>

      {/* Receive */}
      <div className="flex-1 bg-white p-4 sm:p-5 flex flex-col justify-between gap-3">
        <div className="w-8 h-8 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 text-slate-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{receives}</p>
            {total > 0 && (
              <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md">
                {Math.round((receives / total) * 100)}%
              </span>
            )}
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">Receive</p>
        </div>
      </div>

      {/* Sale */}
      <div className="flex-1 bg-white p-4 sm:p-5 flex flex-col justify-between gap-3">
        <div className="w-8 h-8 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 text-slate-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{sales}</p>
            {total > 0 && (
              <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md">
                {Math.round((sales / total) * 100)}%
              </span>
            )}
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">Sale</p>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
