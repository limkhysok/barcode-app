"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import type { InventoryRecord, InventoryPayload } from "@/src/types/inventory.types";
import { getInventory, getInventoryStats, createInventory, updateInventory, deleteInventory } from "@/src/services/inventory.service";
import { getProducts } from "@/src/services/product.service";
import type { PaginatedInventory, PaginatedProducts } from "@/src/types/api.types";
import { useRouter, useSearchParams } from "next/navigation";
import { InventoryModal, DeleteModal } from "./InventoryModal";
import { CustomSelect } from "@/src/components/ui/CustomSelect";

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
  const { role } = useAuth();
  const canEdit   = role === "boss" || role === "superadmin";
  const canDelete = role === "superadmin";

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setFiltersOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
            const cost = Number.parseFloat(r.product_details.cost_per_unit);
            const totalValue = r.quantity_on_hand * cost;
            return (
              <div key={r.id} className="px-3 py-2 bg-white">

                {/* Card Header (Row 1) */}
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-50">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-black text-white bg-black px-1.5 py-0.5 rounded-sm shrink-0">#{r.id}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md truncate">{r.product_details.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Name:</span>
                      <p className="font-black text-gray-900 text-[11px] leading-snug truncate uppercase tracking-tighter">{r.product_details.product_name}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100/50 shadow-sm">
                      <span className="text-[11px] font-bold text-orange-600 uppercase tracking-tight">Qty:</span>
                      <span className="text-[12px] font-black text-orange-700 tabular-nums leading-none">{r.quantity_on_hand.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center -mr-1">
                      {canEdit && (
                        <button onClick={() => openEdit(r)} className="p-1 px-1.5 rounded-lg text-gray-300 hover:text-gray-900 transition-colors active:scale-95" title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Meta (Row 2) */}
                <div className="flex items-center gap-3 mb-2 px-1 py-1 bg-slate-50/70 border border-slate-100/50 rounded-lg text-[10px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-3h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                    <span className="font-bold text-gray-700 truncate">{r.site}</span>
                  </div>
                  <span className="text-slate-300 select-none">•</span>
                  <div className="flex items-center gap-1.5 min-w-0 text-slate-500">
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span className="truncate font-medium">{r.location}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Unit</span>
                    <span className="font-black text-slate-900 tabular-nums bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-sm">${cost.toFixed(2)}</span>
                  </div>
                </div>

                {/* Card Footer (Row 3) */}
                <div className="flex items-center justify-between px-1.5 py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Value</span>
                    <p className="text-[12px] font-black text-gray-900 tabular-nums ml-1 tracking-tight">
                      ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-200 text-[12px]">•</span>
                    <p className="text-[9px] font-black text-slate-500 font-mono tracking-tighter uppercase tabular-nums">{formatDateTime(r.created_at)}</p>
                  </div>
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
                  const canSort = orderingFields[h];
                  const isAsc = ordering === canSort;
                  const isDesc = ordering === '-' + canSort;
                  return (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[12px] font-light tracking-widest text-slate-900 select-none"
                      onClick={() => canSort && handleSort(h)}
                      style={canSort ? { cursor: "pointer" } : undefined}
                    >
                      {canSort ? (
                        <span className="inline-flex items-center gap-1">
                          {h}
                          <span className="flex flex-col leading-none">
                            <svg className={`w-2.5 h-2.5 ${isAsc ? "text-orange-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l8 8H4z" /></svg>
                            <svg className={`w-2.5 h-2.5 ${isDesc ? "text-orange-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l-8-8h16z" /></svg>
                          </span>
                        </span>
                      ) : h}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-black bg-white text-[12px]">
              {displayed.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-2 font-black text-gray-400">#{r.id}</td>
                  <td className="px-5 py-2 font-semibold text-gray-800">{r.product_details.product_name}</td>
                  <td className="px-5 py-2 text-gray-500">{r.site}</td>
                  <td className="px-5 py-2 text-gray-500">{r.location}</td>
                  <td className="px-5 py-2 font-bold text-gray-800 tabular-nums">${Number.parseFloat(r.product_details.cost_per_unit).toFixed(2)}</td>
                  <td className="px-5 py-2 font-bold text-gray-800 tabular-nums">{r.quantity_on_hand.toLocaleString()}</td>
                  <td className="px-5 py-2 font-bold text-gray-800 tabular-nums">
                    ${(r.quantity_on_hand * Number.parseFloat(r.product_details.cost_per_unit)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-2">
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
                  <td className="px-5 py-2 text-gray-500 whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                  <td className="px-5 py-2">
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 py-5 sm:px-5 sm:py-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-light text-gray-900">Inventory</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-2 py-1.5 sm:px-4 rounded-lg text-xs font-light tracking-widest bg-orange-500 text-white hover:opacity-90 active:scale-[0.97] transition shadow-sm"

        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">Create Inventory</span>
          <span className="sm:hidden">Create</span>
        </button>
      </div>

      {/* Overview Dashboard */}

      {/* Mobile: single combined box */}
      <div className="sm:hidden border border-black bg-white rounded-xl overflow-hidden">
        <div className="flex divide-x divide-black/10">
          <div className="flex-1 flex flex-col items-center gap-1.5 px-3 py-3">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.235 15.235L15 18s.225-1.225-.765-2.235m-5.47 5.47L11.25 18H18" />
              </svg>
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider text-center">Records</p>
            <span className="text-sm font-black text-black tabular-nums">{stats.total.toLocaleString()}</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1.5 px-3 py-3">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider text-center">Portfolio</p>
            <span className="text-sm font-black text-black tabular-nums">${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1.5 px-3 py-3">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25" />
              </svg>
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider text-center">Units</p>
            <span className="text-sm font-black text-black tabular-nums">{stats.totalQty.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Desktop: 3 separate cards */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-4">

        {/* Card: Total Records */}
        <div className="px-5 py-4 border border-black bg-white rounded-xl flex flex-col gap-3 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-black text-gray-700">Total Records</p>
            <div className="w-10 h-10 bg-black flex items-center justify-center shrink-0 rounded-lg">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.235 15.235L15 18s.225-1.225-.765-2.235m-5.47 5.47L11.25 18H18" />
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-light text-gray-600">Total Count</span>
            <span className="text-sm font-black text-black tabular-nums">{stats.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Card: Portfolio Value */}
        <div className="px-5 py-4 border border-black bg-white rounded-xl flex flex-col gap-3 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-black text-gray-700">Portfolio Value</p>
            <div className="w-10 h-10 bg-black flex items-center justify-center shrink-0 rounded-lg">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-light text-gray-600">Total Value</span>
            <span className="text-sm font-black text-black tabular-nums">${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Card: Unit Volume */}
        <div className="px-5 py-4 border border-black bg-white rounded-xl flex flex-col gap-3 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-black text-gray-700">Unit Volume</p>
            <div className="w-10 h-10 bg-black flex items-center justify-center shrink-0 rounded-lg">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25" />
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-light text-gray-600">Total Units</span>
            <span className="text-sm font-black text-black tabular-nums">{stats.totalQty.toLocaleString()}</span>
          </div>
        </div>

      </div>

      {/* Filters + Page Size */}
      {/* Desktop filters */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_minmax(0,140px)_2fr] gap-2.5">
          <div className="bg-white rounded-sm">
            <CustomSelect
              id="filter-site"
              value={siteFilter}
              onChange={setSiteFilter}
              options={[
                { value: "", label: "All Sites" },
                ...siteOptions.map((s) => ({ value: s, label: s })),
              ]}
            />
          </div>
          <div className="bg-white rounded-sm">
            <CustomSelect
              id="sort-quantity"
              value={quantitySort}
              onChange={(v) => {
                setQuantitySort(v as QuantitySort);
                const field = "quantity_on_hand";
                let newOrdering = "-updated_at";
                if (v === "asc") newOrdering = field;
                else if (v === "desc") newOrdering = "-" + field;
                setOrdering(newOrdering);
                fetchInventory(undefined, newOrdering);
              }}
              options={[
                { value: "", label: "Quantity (sort)" },
                { value: "asc", label: "Low → High" },
                { value: "desc", label: "High → Low" },
              ]}
            />
          </div>
          <div className="bg-white rounded-sm">
            <CustomSelect
              id="sort-stock-value"
              value={stockValueMode}
              onChange={(v) => {
                setStockValueMode(v as StockValueMode);
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
              options={[
                { value: "", label: "Stock Value (sort)" },
                { value: "asc", label: "Low → High" },
                { value: "desc", label: "High → Low" },
                { value: "low_only", label: "Low Stock Only" },
                { value: "high_only", label: "High Stock Only" },
              ]}
            />
          </div>
          <div className="bg-white rounded-sm">
            <CustomSelect
              id="sort-date"
              value={dateSort}
              onChange={(v) => {
                setDateSort(v as DateSort);
                const newOrdering = v === "asc" ? "updated_at" : "-updated_at";
                setOrdering(newOrdering);
                fetchInventory(undefined, newOrdering);
              }}
              options={[
                { value: "", label: "Date (newest)" },
                { value: "asc", label: "Oldest → Newest" },
              ]}
            />
          </div>
          <div className="bg-white rounded-sm">
            <CustomSelect
              id="page-size-selector-desktop"
              value={pageSize === "all" ? "all" : String(pageSize)}
              onChange={handlePageSizeChange}
              options={[
                { value: "20", label: "Show 20" },
                { value: "40", label: "Show 40" },
                { value: "100", label: "Show 100" },
                { value: "all", label: "Show ALL" },
              ]}
            />
          </div>
          <div className="flex items-center gap-1 bg-white rounded-md border border-black px-2 py-1">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input id="inventory-search" name="inventory-search" type="text" placeholder="Search products, sites..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 text-xs font-black text-slate-900 placeholder:text-slate-700 placeholder:font-normal bg-transparent outline-none" />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="text-slate-300 hover:text-black transition shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters */}
      <div className="flex lg:hidden gap-2 items-center">
        <div className="relative" ref={filtersRef}>
          {(() => {
            const activeCount = [siteFilter, quantitySort, stockValueMode, dateSort].filter(Boolean).length;
            return (
              <button type="button" onClick={() => setFiltersOpen((v) => !v)}
                className={`flex items-center gap-2 px-4 py-1 rounded-md border text-[13px] font-bold  transition ${filtersOpen ? "bg-black text-white border-black" : "bg-white text-slate-700 border-black hover:bg-slate-50"}`}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Filters
                {activeCount > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold bg-orange-500 text-white">
                    {activeCount}
                  </span>
                )}
              </button>
            );
          })()}
          {filtersOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-white border border-black rounded-sm shadow-xl p-3 space-y-3">
              <p className="text-[9px] font-bold tracking-widest uppercase text-slate-400">Filters &amp; Sorting</p>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500">Site</p>
                <CustomSelect id="mob-filter-site" value={siteFilter} onChange={setSiteFilter}
                  options={[{ value: "", label: "All Sites" }, ...siteOptions.map((s) => ({ value: s, label: s }))]} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500">Quantity (sort)</p>
                <CustomSelect id="mob-sort-quantity" value={quantitySort}
                  onChange={(v) => {
                    setQuantitySort(v as QuantitySort);
                    const field = "quantity_on_hand";
                    let newOrdering = "-updated_at";
                    if (v === "asc") newOrdering = field;
                    else if (v === "desc") newOrdering = "-" + field;
                    setOrdering(newOrdering);
                    fetchInventory(undefined, newOrdering);
                  }}
                  options={[{ value: "", label: "Default" }, { value: "asc", label: "Low → High" }, { value: "desc", label: "High → Low" }]} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500">Stock Value (sort)</p>
                <CustomSelect id="mob-sort-stock-value" value={stockValueMode}
                  onChange={(v) => {
                    setStockValueMode(v as StockValueMode);
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
                  options={[
                    { value: "", label: "Default" },
                    { value: "asc", label: "Low → High" },
                    { value: "desc", label: "High → Low" },
                    { value: "low_only", label: "Low Stock Only" },
                    { value: "high_only", label: "High Stock Only" },
                  ]} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500">Date (sort)</p>
                <CustomSelect id="mob-sort-date" value={dateSort}
                  onChange={(v) => {
                    setDateSort(v as DateSort);
                    const newOrdering = v === "asc" ? "updated_at" : "-updated_at";
                    setOrdering(newOrdering);
                    fetchInventory(undefined, newOrdering);
                  }}
                  options={[{ value: "", label: "Newest → Oldest" }, { value: "asc", label: "Oldest → Newest" }]} />
              </div>
              {[siteFilter, quantitySort, stockValueMode, dateSort].some(Boolean) && (
                <button type="button"
                  onClick={() => { setSiteFilter(""); setQuantitySort(""); setStockValueMode(""); setDateSort(""); setOrdering("-updated_at"); fetchInventory(undefined, "-updated_at"); }}
                  className="w-full py-1.5 text-[10px] font-bold tracking-widest uppercase text-red-500 border border-red-200 rounded-sm hover:bg-red-50 transition">
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-sm shrink-0">
          <CustomSelect
            id="page-size-selector-mobile"
            value={pageSize === "all" ? "all" : String(pageSize)}
            onChange={handlePageSizeChange}
            options={[
              { value: "20", label: "Show 20" },
              { value: "40", label: "Show 40" },
              { value: "100", label: "Show 100" },
              { value: "all", label: "Show ALL" },
            ]}
          />
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-2 bg-white rounded-md border border-black px-3 py-1">
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input id="inventory-search-mobile" name="inventory-search" type="text" placeholder="Search"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 text-sm font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal bg-transparent outline-none" />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="text-slate-300 hover:text-black transition shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-black overflow-hidden bg-white">
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
