"use client";

import React, { useMemo } from "react";
import type { ProductStats } from "@/src/types/api.types";
import type { Product } from "@/src/types/product.types";
import { Package, Zap, Box } from "lucide-react";

interface StatsOverviewProps {
  stats: ProductStats | null;
  products: Product[];
}

function fmt(n: number) {
  return n.toLocaleString();
}

export function StatsOverview({ stats, products }: Readonly<StatsOverviewProps>) {
  const s = useMemo(() => {
    const accCount = stats?.by_category?.Accessories?.count ?? products.filter(p => p.category === "Accessories").length;
    const fasCount = stats?.by_category?.Fasteners?.count ?? products.filter(p => p.category === "Fasteners").length;
    const total = stats?.total_products ?? (accCount + fasCount);
    const accShare = total > 0 ? Math.round((accCount / total) * 100) : 0;
    const fasShare = total > 0 ? 100 - accShare : 0;
    return { accCount, fasCount, total, accShare, fasShare };
  }, [stats, products]);

  return (
    <div className="w-full">

      {/* ── MOBILE (< sm) ── */}
      <div className="sm:hidden bg-white border border-slate-500 rounded-sm overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          <div className="flex flex-col items-center gap-0.5 py-3">
            <Package size={14} className="text-orange-500" strokeWidth={2} />
            <p className="text-[18px] font-black text-slate-900 leading-none tabular-nums">{fmt(s.accCount)}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Accessories</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <Box size={14} className="text-orange-500" strokeWidth={2} />
            <p className="text-[18px] font-black text-slate-900 leading-none tabular-nums">{fmt(s.fasCount)}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fasteners</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <Zap size={14} className="text-orange-500" strokeWidth={2} />
            <p className="text-[18px] font-black text-slate-900 leading-none tabular-nums">{fmt(s.total)}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total</p>
          </div>
        </div>
        <div className="px-3 pb-3 flex flex-col gap-1">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-orange-100">
            <div className="bg-orange-500 transition-all duration-700" style={{ width: `${s.accShare}%` }} />
            <div className="bg-orange-200 transition-all duration-700" style={{ width: `${s.fasShare}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">ACC {s.accShare}%</span>
            <span className="text-[8px] font-black text-orange-300 uppercase tracking-widest">FAS {s.fasShare}%</span>
          </div>
        </div>
      </div>

      {/* ── TABLET (sm → lg) ── */}
      <div className="hidden sm:grid lg:hidden grid-cols-3 gap-2">
        <div className="bg-white border border-slate-500 rounded-sm p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-orange-50 flex items-center justify-center">
                <Package size={14} className="text-orange-500" strokeWidth={2} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessories</p>
            </div>
            <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">{s.accShare}%</span>
          </div>
          <p className="text-[26px] font-black text-slate-900 leading-none tabular-nums tracking-tighter">{fmt(s.accCount)}</p>
          <div className="h-1 rounded-full bg-orange-100 overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${s.accShare}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-500 rounded-sm p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-orange-50 flex items-center justify-center">
                <Box size={14} className="text-orange-500" strokeWidth={2} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fasteners</p>
            </div>
            <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">{s.fasShare}%</span>
          </div>
          <p className="text-[26px] font-black text-slate-900 leading-none tabular-nums tracking-tighter">{fmt(s.fasCount)}</p>
          <div className="h-1 rounded-full bg-orange-100 overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${s.fasShare}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-500 rounded-sm p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-orange-50 flex items-center justify-center">
                <Zap size={14} className="text-orange-500" strokeWidth={2} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
            </div>
          </div>
          <p className="text-[26px] font-black text-slate-900 leading-none tabular-nums tracking-tighter">{fmt(s.total)}</p>
          <div className="h-1 rounded-full bg-orange-100 overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
      </div>

      {/* ── DESKTOP (≥ lg) ── */}
      <div className="hidden lg:grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-500 rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover/hdr:text-orange-500 transition-colors duration-200">Accessories</p>
              <p className="text-3xl font-black text-slate-900 leading-none tabular-nums tracking-tighter mt-1">{fmt(s.accCount)}</p>
            </div>
            <div className="w-9 h-9 rounded-sm bg-orange-50 flex items-center justify-center">
              <Package size={18} className="text-orange-500" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Share</span>
              <span className="text-[10px] font-black text-orange-600">{s.accShare}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-orange-100 overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${s.accShare}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-500 rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover/hdr:text-orange-500 transition-colors duration-200">Fasteners</p>
              <p className="text-3xl font-black text-slate-900 leading-none tabular-nums tracking-tighter mt-1">{fmt(s.fasCount)}</p>
            </div>
            <div className="w-9 h-9 rounded-sm bg-orange-50 flex items-center justify-center">
              <Box size={18} className="text-orange-500" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Share</span>
              <span className="text-[10px] font-black text-orange-600">{s.fasShare}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-orange-100 overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${s.fasShare}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-500 rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover/hdr:text-orange-500 transition-colors duration-200">Total Products</p>
              <p className="text-3xl font-black text-slate-900 leading-none tabular-nums tracking-tighter mt-1">{fmt(s.total)}</p>
            </div>
            <div className="w-9 h-9 rounded-sm bg-orange-50 flex items-center justify-center">
              <Zap size={18} className="text-orange-500" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Split</span>
              <span className="text-[9px] font-black text-orange-500">
                {s.accShare}% · {s.fasShare}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-orange-100 flex">
              <div className="h-full bg-orange-500 transition-all duration-700" style={{ width: `${s.accShare}%` }} />
              <div className="h-full bg-orange-200 transition-all duration-700" style={{ width: `${s.fasShare}%` }} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
