"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InventoryRecord, InventoryPayload } from "@/src/types/inventory.types";
import type { Product } from "@/src/types/product.types";
import { getInventory, createInventory, updateInventory, deleteInventory } from "@/src/services/inventory.service";
import { getProducts } from "@/src/services/product.service";
import { InventoryModal, DeleteModal } from "./InventoryModal";

// ─── Types & constants ────────────────────────────────────────────────────────

type StockStatus = "healthy" | "moderate" | "low";

export function getStatus(qty: number, reorderLevel: number): StockStatus {
  if (qty >= reorderLevel * 2) return "healthy";
  if (qty >= reorderLevel) return "moderate";
  return "low";
}

export const STATUS_CONFIG: Record<
  StockStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  healthy:  { label: "Healthy",   bg: "bg-green-50", text: "text-green-600", dot: "bg-green-500" },
  moderate: { label: "Moderate",  bg: "bg-amber-50",  text: "text-amber-600", dot: "bg-amber-400" },
  low:      { label: "Low Stock", bg: "bg-red-50",    text: "text-red-600",   dot: "bg-red-500"   },
};

const emptyForm: InventoryPayload = {
  product: 0,
  site: "",
  location: "",
  quantity_on_hand: 0,
};

// ─── SelectFilter ─────────────────────────────────────────────────────────────

function SelectFilter({
  value,
  onChange,
  options,
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-4 py-3 rounded-sm border text-sm font-medium text-left flex items-center justify-between gap-2 transition focus:outline-none bg-gray-50 ${
          open ? "border-black ring-1 ring-black" : "border-black hover:bg-slate-50"
        } ${value === "" ? "text-slate-400" : "text-slate-900"}`}
      >
        <span className="truncate">{current.label}</span>
        <svg
          className="w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <ul className="absolute z-200 top-full mt-1 w-full bg-white border border-black rounded-sm shadow-lg overflow-hidden">
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value} className="border-b border-black last:border-b-0">
                <button
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-[11px] font-semibold tracking-wide flex items-center justify-between gap-2 transition ${
                    active ? "bg-black text-white" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {o.label}
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
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const day   = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year  = d.getFullYear();
  const h24   = d.getHours();
  const mins  = d.getMinutes();
  const ampm  = h24 >= 12 ? "PM" : "AM";
  const h12   = h24 % 12 || 12;
  const time  = mins === 0 ? `${h12}${ampm}` : `${h12}:${String(mins).padStart(2, "0")}${ampm}`;
  return `${day}/${month}/${year} ${time}`;
}

// ─── InventoryClient ──────────────────────────────────────────────────────────

export default function InventoryClient({
  initialRecords,
  initialProducts,
}: Readonly<{
  initialRecords: InventoryRecord[];
  initialProducts: Product[];
}>) {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [records, setRecords] = useState<InventoryRecord[]>(initialRecords);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Filter / sort state ──────────────────────────────────────────────────────
  const [siteFilter, setSiteFilter] = useState("");
  const [quantitySort, setQuantitySort] = useState<"" | "asc" | "desc">("");
  const [stockValueMode, setStockValueMode] = useState<"" | "asc" | "desc" | "low_only" | "high_only">("");
  const [dateSort, setDateSort] = useState<"" | "asc">("");

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

  function fetchInventory() {
    setLoading(true);
    setError("");
    getInventory()
      .then(setRecords)
      .catch(() => setError("Failed to load inventory."))
      .finally(() => setLoading(false));
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
      getProducts().then(setProducts).catch(() => {});
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
      setDeleting(false);
    }
  }

  // ── Derived values ───────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total        = records.length;
    const healthy      = records.filter((r) => getStatus(r.quantity_on_hand, r.product_details.reorder_level) === "healthy").length;
    const moderate     = records.filter((r) => getStatus(r.quantity_on_hand, r.product_details.reorder_level) === "moderate").length;
    const low          = records.filter((r) => getStatus(r.quantity_on_hand, r.product_details.reorder_level) === "low").length;
    const totalValue   = records.reduce((s, r) => s + r.quantity_on_hand * Number.parseFloat(r.product_details.cost_per_unit), 0);
    const totalQty     = records.reduce((s, r) => s + r.quantity_on_hand, 0);
    const needsReorder = records.filter((r) => r.reorder_status === "Yes").length;
    const sites        = new Set(records.map((r) => r.site)).size;
    return { total, healthy, moderate, low, totalValue, totalQty, needsReorder, sites };
  }, [records]);

  const siteOptions = useMemo(
    () => Array.from(new Set(records.map((r) => r.site))).sort((a, b) => a.localeCompare(b)),
    [records]
  );

  const displayed = useMemo(() => {
    let list = [...records];

    if (siteFilter)
      list = list.filter((r) => r.site === siteFilter);

    if (stockValueMode === "low_only")
      list = list.filter((r) => getStatus(r.quantity_on_hand, r.product_details.reorder_level) === "low");
    else if (stockValueMode === "high_only")
      list = list.filter((r) => getStatus(r.quantity_on_hand, r.product_details.reorder_level) === "healthy");

    if (quantitySort) {
      list.sort((a, b) =>
        quantitySort === "asc"
          ? a.quantity_on_hand - b.quantity_on_hand
          : b.quantity_on_hand - a.quantity_on_hand
      );
    } else if (stockValueMode === "asc" || stockValueMode === "desc") {
      list.sort((a, b) => {
        const av = a.quantity_on_hand * Number.parseFloat(a.product_details.cost_per_unit);
        const bv = b.quantity_on_hand * Number.parseFloat(b.product_details.cost_per_unit);
        return stockValueMode === "asc" ? av - bv : bv - av;
      });
    } else {
      list.sort((a, b) =>
        dateSort === "asc"
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return list;
  }, [records, siteFilter, quantitySort, stockValueMode, dateSort]);

  // ── Table content ────────────────────────────────────────────────────────────

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
            const status = getStatus(r.quantity_on_hand, r.product_details.reorder_level);
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={r.id} className="px-4 py-4 flex items-start gap-3 active:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm leading-snug">{r.product_details.product_name}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                      {cfg.label}
                    </span>
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
                {["#", "Product", "Site", "Location", "Cost / Unit", "Quantity", "Stock Value", "Reorder", "Status", "Order Date", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold tracking-widest uppercase text-slate-900">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black bg-white text-[11px]">
              {displayed.map((r) => {
                const status = getStatus(r.quantity_on_hand, r.product_details.reorder_level);
                const cfg    = STATUS_CONFIG[status];
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
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                        {cfg.label}
                      </span>
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
          <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>
            Inventory
          </p>
          <h1 className="text-2xl font-bold text-gray-900 uppercase italic">MANAGEMENT</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 sm:px-5 rounded-sm text-xs font-bold tracking-widest uppercase text-white hover:opacity-90 active:scale-[0.97] transition shadow-sm"
          style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">Create Inventory</span>
          <span className="sm:hidden">Create</span>
        </button>
      </div>

      {/* Overview cards */}
      <div className="rounded-sm border border-black overflow-hidden divide-y sm:divide-y-0 sm:flex sm:divide-x divide-black">

        {/* Stock Value */}
        <div className="flex-1 bg-white p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-block text-[11px] font-semibold tracking-widest uppercase text-white bg-orange-500 px-2 py-0.5 rounded-none">Total Value</p>
              <p className="text-3xl font-bold text-slate-900 mt-1 leading-none tabular-nums">
                ${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-400 mt-1">stock value</p>
            </div>
            <div className="w-9 h-9 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Across {stats.sites} site{stats.sites === 1 ? "" : "s"}</span>
              <span className="font-semibold text-slate-900 tabular-nums">{stats.total} records</span>
            </div>
            <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-black transition-all duration-700"
                style={{ width: `${Math.round((stats.healthy / Math.max(stats.total, 1)) * 100)}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 text-right">
              {Math.round((stats.healthy / Math.max(stats.total, 1)) * 100)}% healthy
            </p>
          </div>
        </div>

        {/* Total Qty */}
        <div className="flex-1 bg-white p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-block text-[11px] font-semibold tracking-widest uppercase text-white bg-orange-500 px-2 py-0.5 rounded-none">Total Qty</p>
              <p className="text-3xl font-bold text-slate-900 mt-1 leading-none tabular-nums">{stats.totalQty.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">units on hand</p>
            </div>
            <div className="w-9 h-9 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Healthy</span>
              <span className="font-semibold text-slate-900 tabular-nums">{stats.healthy}</span>
            </div>
            <div className="h-px w-full bg-slate-100" />
            <div className="flex items-center justify-between text-slate-500">
              <span>Moderate</span>
              <span className="font-semibold text-slate-900 tabular-nums">{stats.moderate}</span>
            </div>
          </div>
        </div>

        {/* Active Sites */}
        <div className="flex-1 bg-white p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-block text-[11px] font-semibold tracking-widest uppercase text-white bg-orange-500 px-2 py-0.5 rounded-none">Active Sites</p>
              <p className="text-3xl font-bold text-slate-900 mt-1 leading-none tabular-nums">{stats.sites}</p>
              <p className="text-xs text-slate-400 mt-1">locations</p>
            </div>
            <div className="w-9 h-9 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Healthy records</span>
              <span className="font-semibold text-slate-900 tabular-nums">{stats.healthy}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-black transition-all duration-700"
                style={{ width: `${Math.round((stats.healthy / Math.max(stats.total, 1)) * 100)}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 text-right">
              {stats.healthy} of {stats.total} records
            </p>
          </div>
        </div>

        {/* Needs Reorder */}
        <div className="flex-1 bg-white p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-block text-[11px] font-semibold tracking-widest uppercase text-white bg-orange-500 px-2 py-0.5 rounded-none">Needs Reorder</p>
              <p className={`text-3xl font-bold mt-1 leading-none tabular-nums ${stats.needsReorder > 0 ? "text-red-600" : "text-slate-900"}`}>
                {stats.needsReorder}
              </p>
              <p className="text-xs text-slate-400 mt-1">items flagged</p>
            </div>
            <div className="w-9 h-9 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Low stock</span>
              <span className={`font-semibold tabular-nums ${stats.low > 0 ? "text-red-600" : "text-slate-900"}`}>{stats.low}</span>
            </div>
            <div className="h-px w-full bg-slate-100" />
            <div className="flex items-center justify-between text-slate-500">
              <span>Moderate</span>
              <span className="font-semibold text-slate-900 tabular-nums">{stats.moderate}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <SelectFilter
          value={siteFilter}
          onChange={setSiteFilter}
          options={[
            { value: "", label: "All Sites" },
            ...siteOptions.map((s) => ({ value: s, label: s })),
          ]}
        />
        <SelectFilter
          value={quantitySort}
          onChange={(v) => setQuantitySort(v as "" | "asc" | "desc")}
          options={[
            { value: "",     label: "All Quantity"    },
            { value: "asc",  label: "Qty: Low → High" },
            { value: "desc", label: "Qty: High → Low" },
          ]}
        />
        <SelectFilter
          value={stockValueMode}
          onChange={(v) => setStockValueMode(v as typeof stockValueMode)}
          options={[
            { value: "",          label: "All Stock Value"   },
            { value: "asc",       label: "Value: Low → High" },
            { value: "desc",      label: "Value: High → Low" },
            { value: "low_only",  label: "Low Stock Only"    },
            { value: "high_only", label: "High Stock Only"   },
          ]}
        />
        <SelectFilter
          value={dateSort}
          onChange={(v) => setDateSort(v as "" | "asc")}
          options={[
            { value: "",    label: "Newest → Oldest" },
            { value: "asc", label: "Oldest → Newest" },
          ]}
        />
      </div>

      {/* Table */}
      <div className="rounded-sm border border-black overflow-hidden bg-white">
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
