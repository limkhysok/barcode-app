"use client";

import React from "react";
import type { Transaction } from "@/src/types/transaction.types";
import type { TransactionStats } from "@/src/services/transaction.service";

type StatsOverviewProps = {
  transactions: Transaction[];
  stats: TransactionStats | null;
};

const StatsOverview: React.FC<StatsOverviewProps> = ({ transactions, stats }) => {

  const receiveVal = Number(stats?.by_type?.Receive?.total_value || 0);
  const saleVal = Number(stats?.by_type?.Sale?.total_value || 0);
  const netValue = receiveVal - saleVal;

  const receiveCount = stats?.by_type?.Receive?.count || 0;
  const saleCount = stats?.by_type?.Sale?.count || 0;
  const totalMovements = stats?.total_transactions || 0;

  return (
    <div className="border border-black rounded-sm bg-white overflow-hidden shadow-sm">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-black/10">
        {/* Net Movement Value */}
        <div className="p-4 lg:p-5 flex flex-col justify-center gap-1">
          <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Inventory Liquidity</p>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-xl lg:text-2xl font-black tabular-nums tracking-tighter ${netValue >= 0 ? "text-green-600" : "text-red-500"}`}>
              {netValue < 0 ? "-" : "+"}${Math.abs(netValue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[9px] font-bold text-slate-300 uppercase">Net</span>
          </div>
        </div>

        {/* Global Throughput */}
        <div className="p-4 lg:p-5 flex flex-col justify-center gap-1">
          <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Total Lifecycle</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl lg:text-2xl font-black text-slate-900 tabular-nums tracking-tighter">{totalMovements}</h3>
            <span className="text-[9px] font-bold text-slate-300 uppercase">VerOps</span>
          </div>
        </div>

        {/* Receive Dynamics */}
        <div className="p-4 lg:p-5 flex flex-col justify-center gap-1">
          <p className="text-[10px] font-black tracking-widest uppercase text-green-600">Stock Intake</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl lg:text-2xl font-black text-slate-900 tabular-nums tracking-tighter">{receiveCount}</h3>
            <span className="text-[10px] font-black text-green-600 tabular-nums">${receiveVal.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Sale Dynamics */}
        <div className="p-4 lg:p-5 flex flex-col justify-center gap-1">
          <p className="text-[10px] font-black tracking-widest uppercase text-red-500">Stock Release</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl lg:text-2xl font-black text-slate-900 tabular-nums tracking-tighter">{saleCount}</h3>
            <span className="text-[10px] font-black text-red-500 tabular-nums">${saleVal.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
