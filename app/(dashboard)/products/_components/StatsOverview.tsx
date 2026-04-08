"use client";

import type { ProductStats } from "@/src/types/api.types";
import type { Product } from "@/src/types/product.types";
import { useMemo } from "react";

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
    <div className="flex flex-wrap items-center gap-3 border border-gray-100 bg-white rounded-xl p-2 shadow-sm transition-all hover:border-gray-200">
      {/* Desktop Stats */}
      <div className="hidden sm:flex items-center gap-3">
        {/* Accessories */}
        <div className="flex items-center gap-2 pr-3 border-r border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100/50">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.222-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Accessories</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-slate-900 tabular-nums">{categoryStats.accessories.count.toLocaleString()}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Items</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 pl-1">
            <span className="text-[9px] font-black text-orange-500">{categoryStats.accessories.share}%</span>
            <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${categoryStats.accessories.share}%` }} />
            </div>
          </div>
        </div>

        {/* Fasteners */}
        <div className="flex items-center gap-2 pr-3 border-r border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100/50">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5v2.25m0-2.25l2.25 1.313m0 9v2.25m0-2.25l-2.25-1.313m2.25 1.313l2.25-1.313m11.25 4.5l2.25-1.313m-2.25 1.313V16.5m0 2.25l-2.25-1.313M12 3v2.25m0-2.25l2.25 1.313M12 3L9.75 4.313M12 21v-2.25m0 2.25l2.25-1.313M12 21l-2.25-1.313m0-12.375L12 6l2.25 1.313M9.75 16.5L12 18l2.25-1.313M4.5 12L12 16.5l7.5-4.5L12 7.5 4.5 12z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fasteners</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-slate-900 tabular-nums">{categoryStats.fasteners.count.toLocaleString()}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Items</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 pl-1">
            <span className="text-[9px] font-black text-orange-500">{categoryStats.fasteners.share}%</span>
            <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${categoryStats.fasteners.share}%` }} />
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100/50">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-2.25v2.25m3-2.25v2.25m3-2.25v2.25m-13.5 0h16.5" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-slate-900 tabular-nums">{categoryStats.total.toLocaleString()}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: compact inline stats */}
      <div className="sm:hidden flex items-center gap-4 px-2 py-1">
        {[
          { label: "Acc", count: categoryStats.accessories.count, share: categoryStats.accessories.share },
          { label: "Fast", count: categoryStats.fasteners.count, share: categoryStats.fasteners.share },
          { label: "Total", count: categoryStats.total, share: 100 },
        ].map(({ label, count, share }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <span className="text-xs font-black text-slate-900 tabular-nums">{count.toLocaleString()}</span>
            <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 rounded-full" style={{ width: `${share}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
