"use client";

import React, { useMemo } from "react";
import type { ProductStats } from "@/src/types/api.types";
import type { Product } from "@/src/types/product.types";
import {
  Package,
  Layers,
  Zap,
  Box
} from "lucide-react";

interface StatsOverviewProps {
  stats: ProductStats | null;
  products: Product[];
}

export function StatsOverview({ stats, products }: Readonly<StatsOverviewProps>) {
  const categoryStats = useMemo(() => {
    if (stats?.by_category) {
      const accCount = stats.by_category.Accessories?.count ?? 0;
      const fasCount = stats.by_category.Fasteners?.count ?? 0;
      const total = stats.total_products ?? (accCount + fasCount);
      const accShare = total > 0 ? Math.round((accCount / total) * 100) : 0;
      const fasShare = total > 0 ? 100 - accShare : 0;

      return {
        accessories: { count: accCount, share: accShare },
        fasteners: { count: fasCount, share: fasShare },
        total,
      };
    }
    // Fallback if stats not fully loaded
    const accLen = products.filter((p) => p.category === "Accessories").length;
    const fasLen = products.filter((p) => p.category === "Fasteners").length;
    const total = accLen + fasLen;
    const accShare = total > 0 ? Math.round((accLen / total) * 100) : 0;
    const fasShare = total > 0 ? 100 - accShare : 0;

    return {
      accessories: { count: accLen, share: accShare },
      fasteners: { count: fasLen, share: fasShare },
      total,
    };
  }, [stats, products]);

  return (
    <div className="w-full">
      {/* ── Mobile Overview ── */}
      <div className="block sm:hidden rounded-md border border-slate-200 bg-white overflow-hidden">

        {/* Header: Distribution (With Vertical Dividers) */}
        <div className="p-2 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-black" strokeWidth={2} />
            <span className="text-[10px] font-black uppercase tracking-widest text-black">Catalog Distribution</span>
          </div>

          <div className="grid grid-cols-3 gap-0 divide-x divide-slate-200">
            {/* Accessories */}
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Accessories</p>
              <p className="text-base font-black text-black leading-none">{categoryStats.accessories.count.toLocaleString()}</p>
            </div>

            {/* Fasteners */}
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Fasteners</p>
              <p className="text-base font-black text-black leading-none">{categoryStats.fasteners.count.toLocaleString()}</p>
            </div>

            {/* Total */}
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Total</p>
              <p className="text-base font-black text-black leading-none">{categoryStats.total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Share: Horizontal Layout */}
        <div className="p-2 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <span className="text-[10px] font-black text-black uppercase tracking-widest">Market Share</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Accessories Share */}
            <div className="flex items-center p-2.5 bg-white rounded-sm border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-orange-50 rounded text-orange-800 shrink-0">
                  <Package size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-black leading-tight">{categoryStats.accessories.share}%</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">Accessories</p>
                </div>
              </div>
            </div>

            {/* Fasteners Share */}
            <div className="flex items-center p-2.5 bg-white rounded-sm border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-orange-50 rounded text-orange-600 shrink-0">
                  <Box size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-black leading-tight">{categoryStats.fasteners.share}%</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">Fasteners</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop Overview (3 Card Layout) ── */}
      <div className="hidden sm:grid grid-cols-3 gap-3">
        {/* Box: Accessories */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between pb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Accessories</p>
            <Package className="h-8 w-8 text-orange-600" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter text-black">{categoryStats.accessories.count.toLocaleString()}</p>
          </div>
        </div>

        {/* Box: Fasteners */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between pb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Fasteners</p>
            <Box className="h-8 w-8 text-orange-600" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter text-black">{categoryStats.fasteners.count.toLocaleString()}</p>
          </div>
        </div>

        {/* Box: Total */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between pb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Total Catalog</p>
            <Zap className="h-8 w-8 text-orange-600" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter text-black">{categoryStats.total.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
