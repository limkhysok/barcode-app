"use client";

import React, { useMemo } from "react";
import type { ProductStats } from "@/src/types/api.types";
import type { Product } from "@/src/types/product.types";
import {
  Package,
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

        {/* Header: Lifetime Stats (With Vertical Dividers) */}
        <div className="px-0 py-0 bg-white border-b border-slate-200">
          <div className="px-3 py-2 border-b border-slate-200 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-black">Overview</span>
          </div>

          <div className="grid grid-cols-3 gap-0 divide-x divide-slate-200">
            {/* Accessories */}
            <div className="flex flex-col items-center gap-1 py-4">
              <Package className="h-6 w-6 text-orange-600" strokeWidth={2} />
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none">Accessories</p>
              <p className="text-base font-black text-black leading-none">{categoryStats.accessories.count.toLocaleString()}</p>
            </div>

            {/* Fasteners */}
            <div className="flex flex-col items-center gap-1 py-4">
              <Box className="h-6 w-6 text-orange-600" strokeWidth={2} />
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none">Fasteners</p>
              <p className="text-base font-black text-black leading-none">{categoryStats.fasteners.count.toLocaleString()}</p>
            </div>

            {/* Total */}
            <div className="flex flex-col items-center gap-1 py-4">
              <Zap className="h-6 w-6 text-orange-600" strokeWidth={2} />
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none">Total</p>
              <p className="text-base font-black text-black leading-none">{categoryStats.total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Share: Horizontal Layout */}
        <div className="bg-white">
          <div className="px-3 py-2 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
              <span className="text-[10px] font-black text-black uppercase tracking-widest">Share</span>
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase">{categoryStats.total} Total</span>
          </div>

          <div className="grid grid-cols-2">
            {/* Accessories Share */}
            <div className="flex flex-col py-3 px-5 gap-1 border-r border-slate-200">
              <div className="flex items-center gap-1">
                <Package size={12} strokeWidth={2.5} className="text-orange-500 shrink-0" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Accessories</p>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-xl font-black text-black leading-none tabular-nums">{categoryStats.accessories.count.toLocaleString()}</p>
                <p className="text-[11px] font-bold text-slate-700 uppercase leading-none">/ {categoryStats.accessories.share}%</p>
              </div>
            </div>

            {/* Fasteners Share */}
            <div className="flex flex-col py-3 px-5 gap-1">
              <div className="flex items-center gap-1">
                <Box size={12} strokeWidth={2.5} className="text-orange-500 shrink-0" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Fasteners</p>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-xl font-black text-black leading-none tabular-nums">{categoryStats.fasteners.count.toLocaleString()}</p>
                <p className="text-[11px] font-bold text-slate-700 uppercase leading-none">/ {categoryStats.fasteners.share}%</p>
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
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-3">
              <span className="text-xs font-black text-orange-600">{categoryStats.accessories.share}% Share</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Of Product</span>
            </div>
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
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-3">
              <span className="text-xs font-black text-orange-600">{categoryStats.fasteners.share}% Share</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Of Product</span>
            </div>
          </div>
        </div>

        {/* Box: Total */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between pb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Total Products</p>
            <Zap className="h-8 w-8 text-orange-600" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter text-black">{categoryStats.total.toLocaleString()}</p>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-3">
              <span className="text-xs font-black text-black uppercase tracking-widest">{categoryStats.total} Products</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Indexed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
