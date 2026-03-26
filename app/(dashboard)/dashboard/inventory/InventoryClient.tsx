"use client";

import { useMemo, useState } from "react";
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
  healthy: { label: "Healthy",  bg: "bg-green-50", text: "text-green-600", dot: "bg-green-500" },
  moderate: { label: "Moderate", bg: "bg-amber-50",  text: "text-amber-600", dot: "bg-amber-400" },
  low:      { label: "Low Stock", bg: "bg-red-50",   text: "text-red-600",   dot: "bg-red-500"   },
};

const ringStyle = { "--tw-ring-color": "#FA4900" } as React.CSSProperties;

const emptyForm: InventoryPayload = {
  product: 0,
  site: "",
  location: "",
  quantity_on_hand: 0,
};

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

  // ── Filter state ────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StockStatus | "">("");
  const [siteSearch, setSiteSearch] = useState("");

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
    const total       = records.length;
    const healthy     = records.filter((r) => getStatus(r.quantity_on_hand, r.product_details.reorder_level) === "healthy").length;
    const moderate    = records.filter((r) => getStatus(r.quantity_on_hand, r.product_details.reorder_level) === "moderate").length;
    const low         = records.filter((r) => getStatus(r.quantity_on_hand, r.product_details.reorder_level) === "low").length;
    const totalValue  = records.reduce((s, r) => s + Number.parseFloat(r.stock_value), 0);
    const totalQty    = records.reduce((s, r) => s + r.quantity_on_hand, 0);
    const needsReorder = records.filter((r) => r.reorder_status === "Yes").length;
    const sites       = new Set(records.map((r) => r.site)).size;
    return { total, healthy, moderate, low, totalValue, totalQty, needsReorder, sites };
  }, [records]);

  const displayed = useMemo(() => {
    let list = [...records];
    if (statusFilter)
      list = list.filter(
        (r) => getStatus(r.quantity_on_hand, r.product_details.reorder_level) === statusFilter
      );
    if (siteSearch.trim()) {
      const q = siteSearch.trim().toLowerCase();
      list = list.filter((r) => r.site.toLowerCase().includes(q));
    }
    return list;
  }, [records, statusFilter, siteSearch]);

  const maxQty = useMemo(
    () => Math.max(...records.map((r) => r.quantity_on_hand), 1),
    [records]
  );

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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["#", "Product", "Category", "Site", "Location", "Qty on Hand", "Stock Bar", "Stock Value", "Reorder", "Status", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayed.map((r) => {
              const status = getStatus(r.quantity_on_hand, r.product_details.reorder_level);
              const cfg    = STATUS_CONFIG[status];
              const pct    = Math.round((r.quantity_on_hand / maxQty) * 100);
              const barColor =
                status === "healthy" ? "#16a34a" :
                status === "moderate" ? "#d97706" : "#dc2626";

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
                    ${Number.parseFloat(r.stock_value).toLocaleString("en-US", {
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
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

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
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-white hover:opacity-90 active:scale-[0.97] transition shadow-sm"
          style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Inventory
        </button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="relative overflow-hidden rounded-2xl p-6 text-white lg:col-span-1"
          style={{ background: "linear-gradient(135deg, #FA4900 0%, #c2410c 55%, #991b1b 100%)" }}
        >
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
              ${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-white/60 mt-2">Combined across all sites</p>
          </div>
        </div>

        {[
          { value: stats.totalQty.toLocaleString(), label: "Total Qty on Hand" },
          { value: stats.sites,                     label: "Active Sites"      },
          { value: stats.needsReorder,              label: "Needs Reorder"     },
        ].map(({ value, label }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
            <div className="min-w-0">
              <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
              <p className="text-xs font-bold text-gray-700 mt-1.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(["", "healthy", "moderate", "low"] as (StockStatus | "")[]).map((s) => {
            const cfg    = s ? STATUS_CONFIG[s] : null;
            const active = statusFilter === s;
            return (
              <button
                key={s || "all"}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition ${
                  active
                    ? "text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
                style={active ? { background: "linear-gradient(135deg, #FA4900, #b91c1c)" } : {}}
              >
                {cfg ? cfg.label : "All"}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          placeholder="Search site…"
          value={siteSearch}
          onChange={(e) => setSiteSearch(e.target.value)}
          className="pl-4 pr-4 py-2 rounded-xl border border-gray-200 text-sm outline-none w-44"
          style={ringStyle}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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