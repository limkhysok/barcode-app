"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InventoryRecord, InventoryPayload } from "@/src/types/inventory.types";
import type { Product } from "@/src/types/product.types";
import { getInventory, createInventory, updateInventory, deleteInventory } from "@/src/services/inventory.service";
import { getProducts } from "@/src/services/product.service";

type StockStatus = "healthy" | "moderate" | "low";

function getStatus(qty: number, reorderLevel: number): StockStatus {
  if (qty >= reorderLevel * 2) return "healthy";
  if (qty >= reorderLevel) return "moderate";
  return "low";
}

const STATUS_CONFIG: Record<StockStatus, { label: string; bg: string; text: string; dot: string }> = {
  healthy:  { label: "Healthy",   bg: "bg-green-50",  text: "text-green-600",  dot: "bg-green-500"  },
  moderate: { label: "Moderate",  bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-400"  },
  low:      { label: "Low Stock", bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500"    },
};

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent transition";
const ringStyle = { "--tw-ring-color": "#FA4900" } as React.CSSProperties;

function Field({ label, id, type = "text", value, onChange, placeholder, required = true }: Readonly<{
  label: string; id: string; type?: string;
  value: string | number; onChange: (v: string) => void;
  placeholder?: string; required?: boolean;
}>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-bold tracking-widest uppercase text-gray-500">{label}</label>
      <input id={id} type={type} placeholder={placeholder} value={value} required={required}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls} style={ringStyle} />
    </div>
  );
}

function CustomSelect({ id, label, value, onChange, options, placeholder }: Readonly<{
  id: string; label: string; value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
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
    <div className="space-y-1.5" ref={ref}>
      <label htmlFor={id} className="text-xs font-bold tracking-widest uppercase text-gray-500">{label}</label>
      <div className="relative">
        <button id={id} type="button" onClick={() => setOpen((v) => !v)}
          className={`w-full px-4 py-2.5 rounded-xl border text-sm text-left flex items-center justify-between gap-2 transition focus:outline-none ${
            open ? "border-[#FA4900] ring-2 ring-[#FA4900]/20" : "border-gray-200 hover:border-gray-300"
          } ${selected ? "text-gray-900" : "text-gray-400"}`}>
          <span className="truncate">{selected ? selected.label : (placeholder ?? "Select…")}</span>
          <svg className="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {open && (
          <ul className="absolute z-50 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1 max-h-52 overflow-y-auto">
            {options.map((opt) => {
              const active = String(opt.value) === String(value);
              return (
                <li key={opt.value}>
                  <button type="button"
                    onClick={() => { onChange(String(opt.value)); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition ${
                      active ? "font-bold text-white" : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={active ? { background: "linear-gradient(135deg, #FA4900, #b91c1c)" } : {}}>
                    <span className="truncate">{opt.label}</span>
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

const emptyForm: InventoryPayload = {
  product: 0,
  site: "",
  location: "",
  product_description: "",
  quantity_on_hand: 0,
  stock_value: 0,
  reorder_status: "no",
  order_date: new Date().toISOString().split("T")[0],
};

export default function InventoryPage() {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "">("");
  const [siteSearch, setSiteSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryRecord | null>(null);
  const [form, setForm] = useState<InventoryPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<InventoryRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchInventory();
    getProducts().then(setProducts).catch(() => {});
  }, []);

  async function fetchInventory() {
    setLoading(true);
    setError("");
    try {
      setRecords(await getInventory());
    } catch {
      setError("Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, order_date: new Date().toISOString().split("T")[0] });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(record: InventoryRecord) {
    setEditing(record);
    setForm({
      product:             record.product,
      site:                record.site,
      location:            record.location,
      product_description: record.product_description,
      quantity_on_hand:    record.quantity_on_hand,
      stock_value:         Number.parseFloat(record.stock_value),
      reorder_status:      record.reorder_status,
      order_date:          record.order_date,
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
      await fetchInventory();
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
      await fetchInventory();
    } catch {
      setDeleting(false);
    }
  }

  const stats = useMemo(() => {
    const total      = records.length;
    const healthy    = records.filter((r) => getStatus(r.quantity_on_hand, r.product_details.reorder_level) === "healthy").length;
    const moderate   = records.filter((r) => getStatus(r.quantity_on_hand, r.product_details.reorder_level) === "moderate").length;
    const low        = records.filter((r) => getStatus(r.quantity_on_hand, r.product_details.reorder_level) === "low").length;
    const totalValue   = records.reduce((s, r) => s + Number.parseFloat(r.stock_value), 0);
    const totalQty     = records.reduce((s, r) => s + r.quantity_on_hand, 0);
    const needsReorder = records.filter((r) => r.reorder_status === "yes").length;
    const sites        = new Set(records.map((r) => r.site)).size;
    return { total, healthy, moderate, low, totalValue, totalQty, needsReorder, sites };
  }, [records]);

  const displayed = useMemo(() => {
    let list = [...records];
    if (statusFilter) list = list.filter((r) => getStatus(r.quantity_on_hand, r.product_details.reorder_level) === statusFilter);
    if (siteSearch.trim()) {
      const q = siteSearch.trim().toLowerCase();
      list = list.filter((r) => r.site.toLowerCase().includes(q));
    }
    return list;
  }, [records, statusFilter, siteSearch]);

  const maxQty = useMemo(() => Math.max(...records.map((r) => r.quantity_on_hand), 1), [records]);


  let tableContent: React.ReactNode;
  if (loading) {
    tableContent = (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#FA4900", borderTopColor: "transparent" }} />
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["#", "Product", "Category", "Site", "Location", "Qty on Hand", "Stock Bar", "Stock Value", "Reorder", "Status", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayed.map((r) => {
              const status = getStatus(r.quantity_on_hand, r.product_details.reorder_level);
              const cfg    = STATUS_CONFIG[status];
              const pct    = Math.round((r.quantity_on_hand / maxQty) * 100);
              let barColor = "#dc2626";
              if (status === "healthy") barColor = "#16a34a";
              else if (status === "moderate") barColor = "#d97706";

              return (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-bold text-gray-400">#{r.id}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-800">{r.product_details.product_name}</p>
                    {r.product_description && (
                      <p className="text-[11px] text-gray-400 truncate max-w-40">{r.product_description}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-orange-50 text-orange-500">
                      {r.product_details.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{r.site}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{r.location}</td>
                  <td className="px-5 py-3.5 font-bold text-gray-700">{r.quantity_on_hand.toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-700">
                    ${Number.parseFloat(r.stock_value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3.5">
                    {r.reorder_status === "yes" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-red-50 text-red-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        {"Yes"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-gray-50 text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                        {"No"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(r)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteTarget(r)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Delete">
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
    );
  }

  let saveLabel = editing ? "Save Changes" : "Create Record";
  if (saving) saveLabel = "Saving…";

  return (
    <div className="px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>
            Stock Management
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-white hover:opacity-90 active:scale-[0.97] transition shadow-sm"
          style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Inventory
        </button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Featured: Total Stock Value */}
        <div className="relative overflow-hidden rounded-2xl p-6 text-white lg:col-span-1"
          style={{ background: "linear-gradient(135deg, #FA4900 0%, #c2410c 55%, #991b1b 100%)" }}>
          <div className="absolute -right-5 -top-5 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-3 bottom-3 w-14 h-14 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start justify-between mb-5">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-[9px] font-bold tracking-widest uppercase bg-white/20 px-2.5 py-1 rounded-full">
                STOCK VALUE
              </span>
            </div>
            <p className="text-[30px] font-black tracking-tight leading-none">
              {loading ? "—" : `$${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
            <p className="text-xs text-white/60 mt-2">Combined across all sites</p>
          </div>
        </div>

        {/* Total Qty on Hand */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7)" }} />
          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0 text-violet-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-gray-900 leading-none tabular-nums">
                {loading ? "—" : stats.totalQty.toLocaleString()}
              </p>
              <p className="text-xs font-bold text-gray-700 mt-1.5">Total Qty on Hand</p>
              <p className="text-[10px] text-gray-400 mt-0.5">units across all sites</p>
            </div>
          </div>
        </div>

        {/* Active Sites */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #0891b2, #22d3ee)" }} />
          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0 text-cyan-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-gray-900 leading-none tabular-nums">
                {loading ? "—" : stats.sites}
              </p>
              <p className="text-xs font-bold text-gray-700 mt-1.5">Active Sites</p>
              <p className="text-[10px] text-gray-400 mt-0.5">unique store locations</p>
            </div>
          </div>
        </div>

        {/* Needs Reorder */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-red-500" />
          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0 text-red-500 relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {!loading && stats.needsReorder > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-gray-900 leading-none tabular-nums">
                {loading ? "—" : stats.needsReorder}
              </p>
              <p className="text-xs font-bold text-gray-700 mt-1.5">Needs Reorder</p>
              <p className="text-[10px] text-gray-400 mt-0.5">items flagged for reorder</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock health distribution */}
      {!loading && stats.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Stock Health Distribution</p>
            <p className="text-[10px] text-gray-400">{stats.total} total records</p>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {stats.healthy > 0 && (
              <div className="bg-green-500 rounded-full transition-all"
                style={{ width: `${(stats.healthy / stats.total) * 100}%` }} />
            )}
            {stats.moderate > 0 && (
              <div className="bg-amber-400 rounded-full transition-all"
                style={{ width: `${(stats.moderate / stats.total) * 100}%` }} />
            )}
            {stats.low > 0 && (
              <div className="bg-red-500 rounded-full transition-all"
                style={{ width: `${(stats.low / stats.total) * 100}%` }} />
            )}
          </div>
          <div className="flex items-center gap-5 mt-3">
            {[
              { label: "Healthy", count: stats.healthy, dot: "bg-green-500" },
              { label: "Moderate", count: stats.moderate, dot: "bg-amber-400" },
              { label: "Low Stock", count: stats.low, dot: "bg-red-500" },
            ].map(({ label, count, dot }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                <span className="text-[10px] text-gray-500 font-medium">{label}</span>
                <span className="text-[10px] font-bold text-gray-700">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
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
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="text" placeholder="Search site…"
              value={siteSearch} onChange={(e) => setSiteSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent transition w-44"
              style={ringStyle} />
          </div>
         
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {tableContent}
      </div>

      {/* Results summary */}
      {!loading && !error && (
        <p className="text-xs text-gray-400">
          Showing <span className="font-bold text-gray-600">{displayed.length}</span> of{" "}
          <span className="font-bold text-gray-600">{records.length}</span> records
        </p>
      )}

      {/* Create Inventory Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit Inventory Record" : "Create Inventory Record"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <CustomSelect
                id="product" label="Product"
                value={form.product || ""}
                placeholder="Select a product…"
                onChange={(v) => setForm((f) => ({ ...f, product: Number.parseInt(v) }))}
                options={products.map((p) => ({ value: p.id, label: `${p.product_name} (${p.category})` }))}
              />

              <div className="grid grid-cols-2 gap-4">
                <CustomSelect
                  id="site" label="Site"
                  value={form.site}
                  placeholder="Select a site…"
                  onChange={(v) => setForm((f) => ({ ...f, site: v }))}
                  options={[
                    { value: "Store A", label: "Store A" },
                    { value: "Store B", label: "Store B" },
                    { value: "Store C", label: "Store C" },
                    { value: "Store D", label: "Store D" },
                  ]}
                />
                <Field label="Location" id="location" value={form.location} placeholder="A1-Shelf-5"
                  onChange={(v) => setForm((f) => ({ ...f, location: v }))} />
              </div>

              <Field label="Product Description" id="product_description" value={form.product_description}
                placeholder="e.g. Zinc Bolt M8 - 50mm" required={false}
                onChange={(v) => setForm((f) => ({ ...f, product_description: v }))} />

              <div className="grid grid-cols-2 gap-4">
                <Field label="Quantity on Hand" id="quantity_on_hand" type="number"
                  value={form.quantity_on_hand} placeholder="500"
                  onChange={(v) => setForm((f) => ({ ...f, quantity_on_hand: Number.parseInt(v) || 0 }))} />
                <Field label="Stock Value ($)" id="stock_value" type="number"
                  value={form.stock_value} placeholder="250.00"
                  onChange={(v) => setForm((f) => ({ ...f, stock_value: Number.parseFloat(v) || 0 }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CustomSelect
                  id="reorder_status" label="Reorder Status"
                  value={form.reorder_status}
                  onChange={(v) => setForm((f) => ({ ...f, reorder_status: v as "yes" | "no" }))}
                  options={[
                    { value: "no",  label: "No — sufficient stock" },
                    { value: "yes", label: "Yes — needs reorder"   },
                  ]}
                />
                <Field label="Order Date" id="order_date" type="date"
                  value={form.order_date} placeholder=""
                  onChange={(v) => setForm((f) => ({ ...f, order_date: v }))} />
              </div>

              {formError && (
                <p className="text-xs font-medium text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-white hover:opacity-90 transition shadow-sm disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}>
                  {saveLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-gray-900">Delete Record?</h2>
              <p className="text-sm text-gray-500">
                <span className="font-semibold">{deleteTarget.product_details.product_name}</span>
                {" "}at <span className="font-semibold">{deleteTarget.site}</span> will be permanently removed.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-60">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
