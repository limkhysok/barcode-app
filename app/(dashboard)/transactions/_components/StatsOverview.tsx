"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, LabelList } from "recharts";
import type { TransactionStats } from "@/src/services/transaction.service";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/src/components/ui/chart";

type StatsOverviewProps = {
  stats: TransactionStats | null;
};

const barConfig: ChartConfig = {
  receive: { label: "Receive", color: "#000000" },
  sale:    { label: "Sale",    color: "#9ca3af" },
};

const pieConfig: ChartConfig = {
  receive: { label: "Receive", color: "#000000" },
  sale:    { label: "Sale",    color: "#e5e7eb" },
};

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const receiveCount      = stats?.by_type?.Receive?.total_count          || 0;
  const receiveTodayCount = stats?.by_type?.Receive?.today_count          || 0;
  const receiveTodayQty   = stats?.by_type?.Receive?.today_total_quantity ?? 0;
  const saleCount         = stats?.by_type?.Sale?.total_count             || 0;
  const saleTodayCount    = stats?.by_type?.Sale?.today_count             || 0;
  const saleTodayQty      = stats?.by_type?.Sale?.today_total_quantity    ?? 0;
  const totalMovements    = stats?.total_transactions                     || 0;
  const todayMovements    = stats?.today_transactions                     || 0;

  const totalTyped      = receiveCount + saleCount || 1;
  const receiveShare    = Math.round((receiveCount / totalTyped) * 100);
  const saleShare       = 100 - receiveShare;
  const netQtyToday     = receiveTodayQty - saleTodayQty;
  const qtyTotal        = receiveTodayQty + saleTodayQty || 1;
  const receiveQtyShare = Math.round((receiveTodayQty / qtyTotal) * 100);

  const barData = [
    { period: "All Time", receive: receiveCount,      sale: saleCount      },
    { period: "Today",    receive: receiveTodayCount, sale: saleTodayCount },
  ];

  const pieData = [
    { name: "receive", value: receiveCount, fill: "var(--color-receive)" },
    { name: "sale",    value: saleCount,    fill: "var(--color-sale)"    },
  ];

  return (
    <div className="space-y-3">

      {/* ── Mobile ── */}
      <div className="sm:hidden bg-white border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex h-0.75 w-full">
          <div className="h-full bg-black" style={{ width: `${receiveShare}%` }} />
          <div className="h-full bg-gray-400" style={{ width: `${saleShare}%` }} />
        </div>
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {[
            { label: "Receive", count: receiveCount,   today: `+${receiveTodayCount}` },
            { label: "Sale",    count: saleCount,      today: `-${saleTodayCount}` },
            { label: "Total",   count: totalMovements, today: `${todayMovements}` },
          ].map(({ label, count, today }) => (
            <div key={label} className="flex flex-col gap-1 px-3 py-2.5">
              <p className="text-[9px] font-medium text-gray-400">{label}</p>
              <span className="text-sm font-black text-black tabular-nums">{count.toLocaleString()}</span>
              <span className="text-[9px] text-gray-500 tabular-nums">{today} today</span>
            </div>
          ))}
        </div>
        <div className="px-3 pb-2.5 pt-1.5 space-y-1.5 border-t border-gray-100">
          <p className="text-[9px] font-medium text-gray-400">Qty today</p>
          <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-100">
            <div className="h-full bg-black transition-all duration-700" style={{ width: `${receiveQtyShare}%` }} />
            <div className="h-full bg-gray-300 transition-all duration-700" style={{ width: `${100 - receiveQtyShare}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-gray-500 tabular-nums">
            <span>+{receiveTodayQty.toLocaleString()} in</span>
            <span>{saleTodayQty.toLocaleString()} out</span>
          </div>
        </div>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden sm:grid grid-cols-3 gap-3 items-stretch">

        {/* ── Receive vs Sale ── col-span-2
            Structure: black header → 2-col stats → bar chart */}
        <div className="col-span-2 border border-gray-800 rounded-xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-black">
            <p className="text-[11px] font-semibold text-white/70">Receive vs Sale</p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
              <span className="text-[11px] font-bold text-white tabular-nums">{receiveShare}%</span>
              <div className="flex h-1.5 w-20 rounded-full overflow-hidden bg-white/20">
                <div className="h-full bg-white transition-all duration-700" style={{ width: `${receiveShare}%` }} />
                <div className="h-full bg-white/40 transition-all duration-700" style={{ width: `${saleShare}%` }} />
              </div>
              <span className="text-[11px] font-bold text-white/50 tabular-nums">{saleShare}%</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
            </div>
          </div>

          <div className="bg-white">
            {/* Two-column stats */}
            <div className="grid grid-cols-2 divide-x divide-gray-100">

              {/* Receive */}
              <div className="px-4 py-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-black flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 leading-none">Receive</p>
                      <p className="text-[20px] font-black text-black tabular-nums leading-tight">{receiveCount.toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-gray-500 border border-gray-200 rounded-full px-1.5 py-0.5 shrink-0">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                    </svg>
                    <span>In</span>
                  </span>
                </div>
                <div className="h-0.75 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-black rounded-full transition-all duration-700" style={{ width: `${receiveShare}%` }} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-gray-400 shrink-0">Today</span>
                  <span className="text-gray-200 text-[10px]">|</span>
                  <span className="text-[11px] font-black text-black tabular-nums">+{receiveTodayCount.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400">txns</span>
                  <span className="text-gray-200 text-[10px]">|</span>
                  <span className="text-[11px] font-black text-black tabular-nums">+{receiveTodayQty.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400">qty</span>
                </div>
              </div>

              {/* Sale */}
              <div className="px-4 py-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-black flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 leading-none">Sale</p>
                      <p className="text-[20px] font-black text-black tabular-nums leading-tight">{saleCount.toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-gray-500 border border-gray-200 rounded-full px-1.5 py-0.5 shrink-0">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                    </svg>
                    <span>Out</span>
                  </span>
                </div>
                <div className="h-0.75 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-400 rounded-full transition-all duration-700" style={{ width: `${saleShare}%` }} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-gray-400 shrink-0">Today</span>
                  <span className="text-gray-200 text-[10px]">|</span>
                  <span className="text-[11px] font-black text-black tabular-nums">-{saleTodayCount.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400">txns</span>
                  <span className="text-gray-200 text-[10px]">|</span>
                  <span className="text-[11px] font-black text-black tabular-nums">-{saleTodayQty.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400">qty</span>
                </div>
              </div>

            </div>

            {/* Bar chart */}
            <div className="border-t border-gray-100 px-4 pt-2.5 pb-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-medium text-gray-400">Transaction count</p>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className="inline-block w-2 h-2 rounded-sm bg-black" />
                    <span>Receive</span>
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className="inline-block w-2 h-2 rounded-sm bg-gray-400" />
                    <span>Sale</span>
                  </span>
                </div>
              </div>
              <ChartContainer config={barConfig} className="h-24 w-full">
                <BarChart data={barData} barCategoryGap="35%" barGap={3} margin={{ top: 14, right: 4, left: -28, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#f3f4f6" strokeDasharray="3 3" />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 600 }} tickMargin={4} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "#d1d5db" }} width={36} />
                  <ChartTooltip cursor={{ fill: "#f9fafb" }} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="receive" fill="var(--color-receive)" radius={[3, 3, 0, 0]} maxBarSize={32}>
                    <LabelList dataKey="receive" position="top" style={{ fontSize: 9, fill: "#6b7280", fontWeight: 700 }} formatter={(v: unknown) => Number(v) > 0 ? Number(v).toLocaleString() : ""} />
                  </Bar>
                  <Bar dataKey="sale" fill="var(--color-sale)" radius={[3, 3, 0, 0]} maxBarSize={32}>
                    <LabelList dataKey="sale" position="top" style={{ fontSize: 9, fill: "#6b7280", fontWeight: 700 }} formatter={(v: unknown) => Number(v) > 0 ? Number(v).toLocaleString() : ""} />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </div>

        {/* ── Overview ── col-span-1
            Same structure: black header → 2-col stats → donut chart */}
        <div className="col-span-1 border border-gray-800 rounded-xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-black">
            <p className="text-[11px] font-semibold text-white/70">Overview</p>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white shrink-0" />
              <span className="text-[11px] font-bold text-white tabular-nums">{totalMovements.toLocaleString()}</span>
              <span className="text-[11px] text-white/40">txns</span>
            </div>
          </div>

          <div className="bg-white">
            {/* Two-column stats — mirrors left card layout */}
            <div className="grid grid-cols-2 divide-x divide-gray-100">

              {/* All time */}
              <div className="px-4 py-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-black flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 leading-none">All time</p>
                    <p className="text-[20px] font-black text-black tabular-nums leading-tight">{totalMovements.toLocaleString()}</p>
                  </div>
                </div>
                <div className="h-0.75 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-black rounded-full transition-all duration-700" style={{ width: `${receiveShare}%` }} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-gray-400 shrink-0">Split</span>
                  <span className="text-gray-200 text-[10px]">|</span>
                  <span className="text-[11px] font-black text-black tabular-nums">{receiveShare}%</span>
                  <span className="text-[10px] text-gray-400">in</span>
                  <span className="text-gray-200 text-[10px]">|</span>
                  <span className="text-[11px] font-black text-black tabular-nums">{saleShare}%</span>
                  <span className="text-[10px] text-gray-400">out</span>
                </div>
              </div>

              {/* Today */}
              <div className="px-4 py-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-black flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 leading-none">Today</p>
                    <p className="text-[20px] font-black text-black tabular-nums leading-tight">{todayMovements.toLocaleString()}</p>
                  </div>
                </div>
                <div className="h-0.75 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-black rounded-full transition-all duration-700" style={{ width: `${receiveQtyShare}%` }} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-gray-400 shrink-0">Net</span>
                  <span className="text-gray-200 text-[10px]">|</span>
                  <span className={`text-[11px] font-black tabular-nums ${netQtyToday >= 0 ? "text-black" : "text-gray-600"}`}>
                    {netQtyToday >= 0 ? "+" : ""}{netQtyToday.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-400">qty</span>
                </div>
              </div>

            </div>

            {/* Donut chart */}
            <div className="border-t border-gray-100 px-4 pt-2.5 pb-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-medium text-gray-400">Type distribution</p>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className="inline-block w-2 h-2 rounded-full bg-black" />
                    <span>Receive</span>
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
                    <span>Sale</span>
                  </span>
                </div>
              </div>
              <div className="relative">
                <ChartContainer config={pieConfig} className="h-24 w-full">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={42}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      strokeWidth={0}
                      paddingAngle={receiveCount > 0 && saleCount > 0 ? 2 : 0}
                    />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  </PieChart>
                </ChartContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[13px] font-black text-black tabular-nums leading-none">{receiveShare}%</span>
                  <span className="text-[8px] text-gray-400 mt-0.5">receive</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatsOverview;
