"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InventoryRecord, InventoryPayload } from "@/src/types/inventory.types";
import { getInventory, getInventoryStats, createInventory, updateInventory, deleteInventory } from "@/src/services/inventory.service";
import { getProducts } from "@/src/services/product.service";
import type { PaginatedInventory, PaginatedProducts } from "@/src/types/api.types";
import { useRouter, useSearchParams } from "next/navigation";
import { InventoryModal, DeleteModal } from "./InventoryModal";

function CustomSelect({ id, label, value, onChange, options, placeholder, openUp }: Readonly<{
  id: string; label?: string; value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  openUp?: boolean;
}>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className={label ? "space-y-1.5" : ""} ref={ref}>
      {label && (
        <label htmlFor={id} className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400">
          <span className="inline-block w-1 h-3 rounded-full" style={{ background: "#FA4900" }} />
          {label}
        </label>
      )}
      <div className="relative">
        <button
          id={id} type="button" onClick={() => setOpen((v) => !v)}
          className={`w-full px-3 py-1 rounded-sm border text-sm font-medium text-left flex items-center justify-between gap-2 transition focus:outline-none bg-gray-50 ${open ? "border-black ring-1 ring-black" : "border-black hover:bg-slate-50"
            } ${selected && String(selected.value) !== "" ? "text-slate-900" : "text-slate-400"}`}
        >
          <span className="truncate">{selected ? selected.label : (placeholder ?? "Select…")}</span>
          <svg className="w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {open && (
          <ul className={`absolute z-200 w-full bg-white border border-black rounded-sm shadow-lg overflow-hidden ${openUp ? "bottom-full mb-1" : "top-full mt-1"}`}>
            {options.map((opt) => {
              const active = String(opt.value) === String(value);
              return (
                <li key={opt.value} className="border-b border-black last:border-b-0">
                  <button type="button"
                    onClick={() => { onChange(String(opt.value)); setOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 text-[11px] font-semibold tracking-wide flex items-center justify-between gap-2 transition ${active ? "bg-black text-white" : "text-slate-700 hover:bg-slate-50"
                      }`}>
                    {opt.label}
                    {active && (
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Types & constants ────────────────────────────────────────────────────────

type QuantitySort = "" | "asc" | "desc";
type StockValueMode = "" | "asc" | "desc" | "low_only" | "high_only";
type DateSort = "" | "asc";

const emptyForm: InventoryPayload = {
  product: 0,
  site: "",
  location: "",
  quantity_on_hand: 0,
};

// ─── FilterSection ────────────────────────────────────────────────────────────

function FilterSection({
  title,
  options,
  value,
  onChange,
}: Readonly<{
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}>) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-3 pb-1">{title}</p>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`w-full text-left px-3 py-2 text-[11px] font-semibold tracking-wide flex items-center justify-between gap-2 transition ${active ? "bg-black text-white" : "text-slate-700 hover:bg-slate-50"
              }`}
          >
            {o.label}
            {active && (
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── FilterDropdown ───────────────────────────────────────────────────────────

function FilterDropdown({
  siteFilter, setSiteFilter, siteOptions,
  quantitySort, setQuantitySort,
  stockValueMode, setStockValueMode,
  dateSort, setDateSort,
}: Readonly<{
  siteFilter: string; setSiteFilter: (v: string) => void; siteOptions: string[];
  quantitySort: QuantitySort; setQuantitySort: (v: QuantitySort) => void;
  stockValueMode: StockValueMode; setStockValueMode: (v: StockValueMode) => void;
  dateSort: DateSort; setDateSort: (v: DateSort) => void;

}>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeCount = [siteFilter, quantitySort, stockValueMode, dateSort].filter(Boolean).length;

  const siteSectionOptions = [
    { value: "", label: "All Sites" },
    ...siteOptions.map((s) => ({ value: s, label: s })),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`px-4 py-1 rounded-sm border text-sm font-medium flex items-center gap-2 transition focus:outline-none bg-gray-50 whitespace-nowrap ${open ? "border-black ring-1 ring-black" : "border-black hover:bg-slate-50"
          } ${activeCount > 0 ? "text-slate-900" : "text-slate-400"}`}
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-black text-white text-[10px] font-bold leading-none">{activeCount}</span>
        )}
        <svg
          className="w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-200 top-full mt-1 right-0 min-w-55 bg-white border border-black rounded-sm shadow-lg overflow-hidden pb-2">
          <FilterSection
            title="Site"
            options={siteSectionOptions}
            value={siteFilter}
            onChange={setSiteFilter}
          />
          <div className="h-px bg-slate-100 mx-3 my-1" />
          <FilterSection
            title="Quantity"
            options={[
              { value: "", label: "All Quantity" },
              { value: "asc", label: "Qty: Low → High" },
              { value: "desc", label: "Qty: High → Low" },
            ]}
            value={quantitySort}
            onChange={(v) => setQuantitySort(v as QuantitySort)}

          />
          <div className="h-px bg-slate-100 mx-3 my-1" />
          <FilterSection
            title="Stock Value"
            options={[
              { value: "", label: "All Stock Value" },
              { value: "asc", label: "Value: Low → High" },
              { value: "desc", label: "Value: High → Low" },
              { value: "low_only", label: "Low Stock Only" },
              { value: "high_only", label: "High Stock Only" },
            ]}
            value={stockValueMode}
            onChange={(v) => setStockValueMode(v as StockValueMode)}

          />
          <div className="h-px bg-slate-100 mx-3 my-1" />
          <FilterSection
            title="Date"
            options={[
              { value: "", label: "Newest → Oldest" },
              { value: "asc", label: "Oldest → Newest" },
            ]}
            value={dateSort}
            onChange={(v) => setDateSort(v as DateSort)}

          />
        </div>
      )}
    </div>
  );
}

// ─── InventoryBarChart ────────────────────────────────────────────────────────

type ActivityEntry = { date?: string; week_start?: string; new_records: number };
type StatsPeriod = "7d" | "14d" | "30d" | "3m";
type ChartSlot = { date: string; label: string; count: number };

function buildWeeklyChartData(activityData: ActivityEntry[]): ChartSlot[] {
  const today = new Date();
  const weeks: ChartSlot[] = [];
  for (let i = 12; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const dateStr = d.toISOString().split("T")[0];
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    weeks.push({ date: dateStr, label: `${dd}/${mm}`, count: 0 });
  }
  for (const entry of activityData) {
    if (entry.week_start) {
      const slot = weeks.find((w) => w.date === entry.week_start);
      if (slot) slot.count = entry.new_records;
    }
  }
  return weeks;
}

function buildDailyChartData(activityData: ActivityEntry[], numDays: number): ChartSlot[] {
  const today = new Date();
  const result: ChartSlot[] = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    result.push({ date: dateStr, label: `${dd}/${mm}`, count: 0 });
  }
  for (const entry of activityData) {
    if (entry.date) {
      const slot = result.find((r) => r.date === entry.date);
      if (slot) slot.count = entry.new_records;
    }
  }
  return result;
}

function InventoryBarChart({ activityData, period }: Readonly<{ activityData: ActivityEntry[]; period: StatsPeriod }>) {
  const [hovered, setHovered] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (period === "3m") return buildWeeklyChartData(activityData);
    const dayCountMap: Record<string, number> = { "7d": 7, "14d": 14, "30d": 30 };
    const numDays = dayCountMap[period] ?? 30;
    return buildDailyChartData(activityData, numDays);
  }, [activityData, period]);

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  const W = 800, H = 240;
  const pl = 30, pr = 10, pt = 20, pb = 35;
  const cw = W - pl - pr;
  const ch = H - pt - pb;
  const n = chartData.length;
  const gap = period === "3m" ? 8 : 4;
  const bw = (cw / n) - gap;
  
  const half = Math.round(maxCount * 0.5);
  const quarter = Math.round(maxCount * 0.25);
  const threeQuarters = Math.round(maxCount * 0.75);
  const yTicks = Array.from(new Set([0, quarter, half, threeQuarters, maxCount].filter((v) => v >= 0))).sort((a, b) => a - b);

  return (
    <div className="w-full h-full min-h-55 sm:min-h-65 relative mt-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible" }}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Y grid lines + labels */}
        {yTicks.map((val) => {
          const y = pt + ch * (1 - val / maxCount);
          return (
            <g key={`ytick-${val}`} className="transition-opacity duration-300">
              <line 
                x1={pl} y1={y} x2={W - pr} y2={y} 
                stroke={val === 0 ? "#000" : "#e2e8f0"} 
                strokeWidth={val === 0 ? 1.5 : 1} 
                strokeDasharray={val === 0 ? "0" : "4 4"}
              />
              <text x={pl - 8} y={y + 3} textAnchor="end" fontSize={11} fill="#64748b" className="font-bold tabular-nums">{val}</text>
            </g>
          );
        })}

        {/* Bars */}
        {chartData.map((d, i) => {
          const x = pl + i * (bw + gap);
          const barH = Math.max((d.count / maxCount) * ch, d.count > 0 ? 4 : 0);
          const y = pt + ch - barH;
          const isHovered = hovered === i;
          
          let showLabel = false;
          if (n <= 10) showLabel = true;
          else if (n <= 15) showLabel = i % 2 === 0;
          else if (n <= 31) showLabel = i % 6 === 0 || i === n - 1;
          else showLabel = i % 3 === 0;

          let barFill = "#f97316"; 
          if (d.count === 0) barFill = "#f8fafc";
          else if (isHovered) barFill = "#000";

          return (
            <g key={d.date} onMouseEnter={() => setHovered(i)} className="cursor-pointer">
              <rect x={x - gap/2} y={pt} width={bw + gap} height={ch} fill="transparent" />
              <rect
                x={x} y={y} width={bw} height={barH}
                fill={barFill}
                rx={bw > 8 ? 2 : 1}
                className="transition-all duration-200"
                stroke={isHovered && d.count > 0 ? "#000" : "none"}
                strokeWidth={1}
                style={{ opacity: hovered !== null && !isHovered ? 0.4 : 1 }}
              />
              {showLabel && (
                <text x={x + bw / 2} y={pt + ch + 22} textAnchor="middle" fontSize={12} fill="#000" className="font-bold">
                  {d.label}
                </text>
              )}
              {isHovered && d.count > 0 && (
                <g className="pointer-events-none">
                  <rect x={Math.min(Math.max(x + bw / 2 - 40, 0), W - 80)} y={y - 40} width={80} height={32} fill="#000" rx={2} />
                  <polygon points={`${x + bw/2 - 6},${y-8} ${x+bw/2+6},${y-8} ${x+bw/2},${y}`} fill="#000" />
                  <text x={Math.min(Math.max(x + bw / 2, 40), W - 40)} y={y - 19} textAnchor="middle" fontSize={12} fill="white" fontWeight="900">
                    {d.count} REC
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const h24 = d.getHours();
  const mins = d.getMinutes();
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  const time = mins === 0 ? `${h12}${ampm}` : `${h12}:${String(mins).padStart(2, "0")}${ampm}`;
  return `${day}/${month}/${year} ${time}`;
}

// ─── InventoryClient ──────────────────────────────────────────────────────────

export default function InventoryClient({
  initialPaginatedRecords,
  initialPaginatedProducts,
  initialStats,
}: Readonly<{
  initialPaginatedRecords: PaginatedInventory;
  initialPaginatedProducts: PaginatedProducts;
  initialStats?: any;
}>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPageSize = searchParams.get("page_size") ?? "20";

  // ── Data state ──────────────────────────────────────────────────────────────
  const [paginated, setPaginated] = useState<PaginatedInventory>(initialPaginatedRecords);
  const records = paginated.results;

  const [paginatedProducts, setPaginatedProducts] = useState<PaginatedProducts>(initialPaginatedProducts);
  const products = paginatedProducts.results;
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState<number | string>(Number.parseInt(initialPageSize) || 20);
  const [error, setError] = useState("");
  const [statsData, setStatsData] = useState<any>(initialStats);
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>("30d");

  useEffect(() => {
    getInventoryStats().then(setStatsData).catch(() => { });
  }, []);

  // ── Filter / sort state ──────────────────────────────────────────────────────
  const [siteFilter, setSiteFilter] = useState("");
  // Remove local-only sort states, use ordering for backend
  const [quantitySort, setQuantitySort] = useState<QuantitySort>("");
  const [stockValueMode, setStockValueMode] = useState<StockValueMode>("");
  const [dateSort, setDateSort] = useState<DateSort>("");
  // New: ordering state for backend sort
  const [ordering, setOrdering] = useState<string>("-updated_at");

  const [search, setSearch] = useState("");

  // ── Create / edit modal state ───────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryRecord | null>(null);
  const [form, setForm] = useState<InventoryPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ── Delete modal state ──────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<InventoryRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function fetchInventory(overridePageSize?: number | string, overrideOrdering?: string, overrideReorderStatus?: string) {
    setLoading(true);
    setError("");

    let reorderParam = overrideReorderStatus;
    if (reorderParam === undefined) {
      if (stockValueMode === "low_only") reorderParam = "Yes";
      else if (stockValueMode === "high_only") reorderParam = "No";
    }

    getInventory({
      page_size: overridePageSize ?? pageSize,
      search: search || undefined,
      site: siteFilter || undefined,
      ordering: overrideOrdering ?? ordering,
      reorder_status: reorderParam || undefined,
    })
      .then(setPaginated)
      .catch(() => setError("Failed to load inventory."))
      .finally(() => setLoading(false));
  }

  function handlePageSizeChange(newSize: string) {
    const size = Number.parseInt(newSize) || 20;
    setPageSize(size);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page_size", String(size));
    router.push(`?${params.toString()}`);
    fetchInventory(size);
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(record: InventoryRecord) {
    setEditing(record);
    setForm({
      product: record.product,
      site: record.site,
      location: record.location,
      quantity_on_hand: record.quantity_on_hand,
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!form.product) { setFormError("Please select a product."); return; }
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await updateInventory(editing.id, form);
      } else {
        await createInventory(form);
      }
      setModalOpen(false);
      fetchInventory();
      getProducts().then(setPaginatedProducts).catch(() => { });
    } catch {
      setFormError("Failed to save. Please check your inputs.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteInventory(deleteTarget.id);
      setDeleteTarget(null);
      fetchInventory();
    } catch {
      // In case of failure, you might want to show an error, but at least unlock the UI
    } finally {
      setDeleting(false);
    }
  }

  // ── Derived values ───────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (statsData) {
      return {
        total: statsData.total_records,
        totalValue: Number(statsData.total_stock_value),
        totalQty: statsData.total_quantity_on_hand,
        needsReorder: statsData.needs_reorder,
        bySite: statsData.by_site as Record<string, { records: number; total_quantity_on_hand: number; total_stock_value: string }> | undefined,
      };
    }
    const totalValue = records.reduce((s, r) => s + r.quantity_on_hand * Number.parseFloat(r.product_details.cost_per_unit), 0);
    const totalQty = records.reduce((s, r) => s + r.quantity_on_hand, 0);
    const needsReorder = records.filter((r) => r.reorder_status === "Yes").length;
    return { total: paginated.count, totalValue, totalQty, needsReorder, bySite: undefined };
  }, [records, statsData, paginated.count]);

  const periodKeyMap: Record<StatsPeriod, string> = {
    "7d": "last_7_days",
    "14d": "last_14_days",
    "30d": "last_30_days",
    "3m": "last_3_months",
  };

  const chartActivity = useMemo<ActivityEntry[]>(() => {
    if (!statsData?.activity) return [];
    const key = periodKeyMap[statsPeriod];
    return statsData.activity[key]?.data ?? [];
  }, [statsData, statsPeriod]);

  const siteOptions = useMemo(
    () => Array.from(new Set(records.map((r) => r.site))).sort((a, b) => a.localeCompare(b)),
    [records]
  );

  // Only filter by search and site, not sort (handled by backend)
  const displayed = useMemo(() => {
    let list = [...records];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        r.product_details.product_name.toLowerCase().includes(q) ||
        r.site.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.product_details.barcode.toLowerCase().includes(q) ||
        r.product_details.category.toLowerCase().includes(q)
      );
    }
    if (siteFilter)
      list = list.filter((r) => r.site === siteFilter);
    return list;
  }, [records, search, siteFilter]);

  // ── Table header sort logic ────────────────────────────────────────────────
  // Map table columns to API ordering fields
  const orderingFields: Record<string, string> = {
    '#': 'id',
    'Product': 'product_name',
    'Site': 'site',
    'Location': 'location',
    'Quantity': 'quantity_on_hand',
    'Stock Value': 'stock_value',
    'Reorder': 'reorder_status',
    'Order Date': 'updated_at',
  };

  function handleSort(col: string) {
    const field = orderingFields[col];
    if (!field) return;
    // Toggle asc/desc
    let newOrdering = field;
    if (ordering === field) newOrdering = '-' + field;
    else if (ordering === '-' + field) newOrdering = field;
    setOrdering(newOrdering);
    fetchInventory(undefined, newOrdering);
  }

  let tableContent: React.ReactNode;

  if (loading) {
    tableContent = (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#FA4900", borderTopColor: "transparent" }}
        />
      </div>
    );
  } else if (error) {
    tableContent = <p className="text-center py-20 text-sm text-red-400">{error}</p>;
  } else if (displayed.length === 0) {
    tableContent = (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
        </svg>
        <p className="text-sm font-medium">No inventory records match.</p>
      </div>
    );
  } else {
    tableContent = (
      <>
        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-black">
          {displayed.map((r) => {
            return (
              <div key={r.id} className="px-4 py-4 flex items-start gap-3 active:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm leading-snug">{r.product_details.product_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-500">
                    <span className="font-medium text-gray-600">{r.site}</span>
                    <span className="text-gray-300">·</span>
                    <span>{r.location}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-xs">
                    <span><span className="text-gray-400">Cost: </span><span className="font-semibold text-gray-700">${Number.parseFloat(r.product_details.cost_per_unit).toFixed(2)}</span></span>
                    <span><span className="text-gray-400">Qty: </span><span className="font-bold text-gray-700">{r.quantity_on_hand.toLocaleString()}</span></span>
                    <span><span className="text-gray-400">Value: </span><span className="font-semibold text-gray-700">${(r.quantity_on_hand * Number.parseFloat(r.product_details.cost_per_unit)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                    {r.reorder_status === "Yes" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />Reorder
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">{formatDateTime(r.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  <button onClick={() => openEdit(r)}
                    className="p-2.5 rounded-sm text-gray-400 hover:text-blue-500 hover:bg-blue-50 active:scale-95 transition"
                    title="Edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button onClick={() => setDeleteTarget(r)}
                    className="p-2.5 rounded-sm text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-95 transition"
                    title="Delete">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-black">
              <tr>
                {["#", "Product", "Site", "Location", "Cost / Unit", "Quantity", "Stock Value", "Reorder", "Order Date", "Actions"].map((h) => {
                  // Only allow sorting on allowed fields
                  const canSort = orderingFields[h];
                  let sortIcon = null;
                  if (canSort) {
                    if (ordering ===  canSort) sortIcon = <span className="text-orange-500 ml-1">↑</span>;
                    else if (ordering === '-' + canSort) sortIcon = <span className="text-orange-500 ml-1">↓</span>;
                    else sortIcon = <span className="text-slate-300 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">↕</span>;
                  }
                  return (
                    <th
                      key={h}
                      className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase text-slate-500 cursor-pointer select-none group hover:bg-slate-100/50 transition-colors"
                      onClick={() => canSort && handleSort(h)}
                    >
                      <span className="flex items-center">{h} {sortIcon}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 bg-white text-[11px]">
              {displayed.map((r) => {
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-bold text-gray-400">#{r.id}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-800">{r.product_details.product_name}</p>
                      {r.product_description && (
                        <p className="text-[11px] text-gray-400 truncate max-w-40">{r.product_description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{r.site}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{r.location}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-700">
                      ${Number.parseFloat(r.product_details.cost_per_unit).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-700">{r.quantity_on_hand.toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-700">
                      ${(r.quantity_on_hand * Number.parseFloat(r.product_details.cost_per_unit)).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      {r.reorder_status === "Yes" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-red-50 text-red-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-gray-50 text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />No
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(r.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(r)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition"
                          title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteTarget(r)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                          title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 py-5 sm:px-8 sm:py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-medium tracking-[0.25em] uppercase" style={{ color: "#FA4900" }}>
            Inventory
          </p>
          <h1 className="text-2xl font-bold text-gray-900 uppercase">MANAGEMENT</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 sm:px-5 rounded-sm text-xs font-bold tracking-widest uppercase bg-orange-500 text-white hover:opacity-90 active:scale-[0.97] transition shadow-sm"

        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">Create Inventory</span>
          <span className="sm:hidden">Create</span>
        </button>
      </div>

      {/* Overview Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Main Chart Card - Spans 3 columns */}
        <div className="lg:col-span-3 bg-white rounded-sm border border-black shadow-sm overflow-hidden flex flex-col transition-all">
          <div className="px-5 py-3 border-b border-black flex flex-col md:flex-row md:items-center justify-between bg-slate-50 gap-3">
            <div>
              <h3 className="text-[11px] font-bold text-black uppercase tracking-widest">Inventory Activity</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Real-time Velocity</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-0.5 rounded-sm border border-black/10">
                {(["7d", "30d", "3m"] as StatsPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setStatsPeriod(p)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${
                      statsPeriod === p 
                        ? "bg-black text-white" 
                        : "text-slate-500 hover:text-black"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 flex-1 min-h-65 sm:min-h-75">
             <InventoryBarChart activityData={chartActivity} period={statsPeriod} />
          </div>
        </div>

        {/* Stats Column */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4">
          {/* Card: Total Records */}
          <div className="bg-white rounded-sm border border-black shadow-sm p-4 sm:p-5 flex flex-col justify-between hover:bg-slate-50 transition-colors group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
                <h4 className="text-2xl sm:text-3xl font-black text-black tabular-nums leading-none">
                  {stats.total.toLocaleString()}
                </h4>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-sm border border-black bg-orange-50 flex items-center justify-center text-orange-500 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.235 15.235L15 18s.225-1.225-.765-2.235m-5.47 5.47L11.25 18H18" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/5 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              <span className="text-green-600 flex items-center tracking-normal">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />Live
              </span>
              <span>• DB Sync Active</span>
            </div>
          </div>

          {/* Card: Portfolio Value */}
          <div className="bg-white rounded-sm border border-black shadow-sm p-4 sm:p-5 flex flex-col justify-between hover:bg-slate-50 transition-colors group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Portfolio Value</p>
                <h4 className="text-2xl sm:text-3xl font-black text-black tabular-nums leading-none">
                  ${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </h4>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-sm border border-black bg-blue-50 flex items-center justify-center text-blue-500 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
              <span className="text-slate-400">Avg Unit:</span>
              <span className="text-black">${(stats.totalValue / Math.max(stats.totalQty, 1)).toFixed(2)}</span>
            </div>
          </div>

          {/* Card: Unit Volume */}
          <div className="bg-white rounded-sm border border-black shadow-sm p-4 sm:p-5 flex flex-col justify-between hover:bg-slate-50 transition-colors group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Volume</p>
                <h4 className="text-2xl sm:text-3xl font-black text-black tabular-nums leading-none">
                  {stats.totalQty.toLocaleString()}
                </h4>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-sm border border-black bg-emerald-50 flex items-center justify-center text-emerald-500 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/5">
               <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden border border-black/5">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '70%' }}></div>
               </div>
               <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider text-right">Capacity Utilized</p>
            </div>
          </div>

        </div>
      </div>

      {/* Filters + Page Size */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-2 sm:p-3 rounded-sm border border-black shadow-sm">
        <div className="relative flex-1 min-w-60 sm:min-w-70">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Quick search products, sites..."
            className="w-full pl-10 pr-4 py-1 rounded-sm border border-black bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-black transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none">
            <FilterDropdown
              siteFilter={siteFilter}
              setSiteFilter={setSiteFilter}
              siteOptions={siteOptions}
              quantitySort={quantitySort}
              setQuantitySort={(v) => {
                setQuantitySort(v);
                const field = "quantity_on_hand";
                let newOrdering = "-updated_at";
                if (v === "asc") newOrdering = field;
                else if (v === "desc") newOrdering = "-" + field;
                setOrdering(newOrdering);
                fetchInventory(undefined, newOrdering);
              }}
              stockValueMode={stockValueMode}
              setStockValueMode={(v) => {
                setStockValueMode(v);
                if (v === "asc" || v === "desc") {
                  const field = "stock_value";
                  const newOrdering = v === "asc" ? field : "-" + field;
                  setOrdering(newOrdering);
                  fetchInventory(undefined, newOrdering);
                } else if (v === "low_only" || v === "high_only" || v === "") {
                  let reorderStatus = "";
                  if (v === "low_only") reorderStatus = "Yes";
                  else if (v === "high_only") reorderStatus = "No";
                  fetchInventory(undefined, undefined, reorderStatus);
                }
              }}
              dateSort={dateSort}
              setDateSort={(v) => {
                setDateSort(v);
                const newOrdering = v === "asc" ? "updated_at" : "-updated_at";
                setOrdering(newOrdering);
                fetchInventory(undefined, newOrdering);
              }}
            />
          </div>
          <div className="h-8 w-px bg-black/10 mx-1 hidden sm:block" />
          <div className="bg-white min-w-30 sm:min-w-35 flex-1 sm:flex-none">
            <CustomSelect
              id="page-size-selector"
              value={pageSize === "all" ? "all" : String(pageSize)}
              onChange={handlePageSizeChange}
              options={[
                { value: "20", label: "20 rows" },
                { value: "40", label: "40 rows" },
                { value: "100", label: "100 rows" },
                { value: "all", label: "Show all" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-sm border border-black overflow-hidden bg-white shadow-sm">
        {tableContent}
      </div>


      {/* Modals */}
      <InventoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        form={form}
        setForm={setForm}
        saving={saving}
        formError={formError}
        onSave={handleSave}
        products={products}
      />

      <DeleteModal
        target={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
