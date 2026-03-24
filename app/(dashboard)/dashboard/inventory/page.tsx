"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/src/types/product.types";
import { getProducts } from "@/src/services/product.service";

type StockStatus = "healthy" | "moderate" | "low";

function getStatus(reorderLevel: number): StockStatus {
  if (reorderLevel >= 20) return "healthy";
  if (reorderLevel >= 10) return "moderate";
  return "low";
}

const STATUS_CONFIG: Record<StockStatus, { label: string; bg: string; text: string; dot: string }> = {
  healthy:  { label: "Healthy",   bg: "bg-green-50",  text: "text-green-600",  dot: "bg-green-500"  },
  moderate: { label: "Moderate",  bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-400"  },
  low:      { label: "Low Stock", bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500"    },
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "">("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setProducts(await getProducts());
      } catch {
        setError("Failed to load inventory.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const total = products.length;
    const healthy  = products.filter((p) => getStatus(p.reorder_level) === "healthy").length;
    const moderate = products.filter((p) => getStatus(p.reorder_level) === "moderate").length;
    const low      = products.filter((p) => getStatus(p.reorder_level) === "low").length;
    const avgCost  = total
      ? products.reduce((s, p) => s + Number.parseFloat(p.cost_per_unit), 0) / total
      : 0;
    return { total, healthy, moderate, low, avgCost };
  }, [products]);

  const displayed = useMemo(() => {
    if (!statusFilter) return products;
    return products.filter((p) => getStatus(p.reorder_level) === statusFilter);
  }, [products, statusFilter]);

  const maxReorder = useMemo(
    () => Math.max(...products.map((p) => p.reorder_level), 1),
    [products],
  );

  // ── Summary cards ─────────────────────────────────────────────────────────
  const cards = [
    {
      label: "Total Products",
      value: stats.total,
      sub: "in inventory",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
      ),
      accent: "#FA4900",
    },
    {
      label: "Healthy Stock",
      value: stats.healthy,
      sub: "reorder ≥ 20",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: "#16a34a",
    },
    {
      label: "Moderate Stock",
      value: stats.moderate,
      sub: "reorder 10–19",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
      accent: "#d97706",
    },
    {
      label: "Low Stock",
      value: stats.low,
      sub: "reorder < 10",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.108-12.254c.866-1.5 3.032-1.5 3.898 0l1.6 2.755M12 18.75h.008v.008H12v-.008z" />
        </svg>
      ),
      accent: "#dc2626",
    },
  ];

  return (
    <div className="px-8 py-8 space-y-6">

      {/* Header */}
      <div className="space-y-0.5">
        <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>
          Stock Management
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, sub, icon, accent }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
              style={{ backgroundColor: accent }}>
              {icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-none">{loading ? "—" : value}</p>
              <p className="text-xs font-bold text-gray-700 mt-1">{label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter pills + avg cost */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(["", "healthy", "moderate", "low"] as (StockStatus | "")[]).map((s) => {
            const cfg = s ? STATUS_CONFIG[s] : null;
            const active = statusFilter === s;
            return (
              <button key={s || "all"} onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition ${
                  active ? "text-white shadow-sm" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
                style={active ? { background: "linear-gradient(135deg, #FA4900, #b91c1c)" } : {}}>
                {cfg ? cfg.label : "All"}
              </button>
            );
          })}
        </div>
        {!loading && (
          <p className="text-xs text-gray-400">
            Avg cost / unit:{" "}
            <span className="font-bold text-gray-700">${stats.avgCost.toFixed(2)}</span>
          </p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#FA4900", borderTopColor: "transparent" }} />
          </div>
        ) : error ? (
          <p className="text-center py-20 text-sm text-red-400">{error}</p>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
            </svg>
            <p className="text-sm font-medium">No items match this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["#", "Product Name", "Category", "Reorder Level", "Stock Bar", "Cost / Unit", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map((p) => {
                  const status = getStatus(p.reorder_level);
                  const cfg = STATUS_CONFIG[status];
                  const pct = Math.round((p.reorder_level / maxReorder) * 100);
                  const barColor = status === "healthy" ? "#16a34a" : status === "moderate" ? "#d97706" : "#dc2626";

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-xs font-bold text-gray-400">#{p.id}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-800">{p.product_name}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-orange-50 text-orange-500">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-700">{p.reorder_level}</td>
                      <td className="px-5 py-3.5">
                        <div className="w-28 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: barColor }} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        ${Number.parseFloat(p.cost_per_unit).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results summary */}
      {!loading && !error && (
        <p className="text-xs text-gray-400">
          Showing <span className="font-bold text-gray-600">{displayed.length}</span> of{" "}
          <span className="font-bold text-gray-600">{products.length}</span> items
        </p>
      )}

    </div>
  );
}
