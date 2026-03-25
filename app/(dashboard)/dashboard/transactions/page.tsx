"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Transaction, TransactionPayload } from "@/src/types/transaction.types";
import type { InventoryRecord } from "@/src/types/inventory.types";
import { getTransactions, createTransaction, deleteTransaction } from "@/src/services/transaction.service";
import { getInventory } from "@/src/services/inventory.service";

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function isToday(ts: string): boolean {
  const d = new Date(ts);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent transition";
const ringStyle = { "--tw-ring-color": "#FA4900" } as React.CSSProperties;

function CustomSelect({ id, label, value, onChange, options, placeholder }: Readonly<{
  id: string; label: string; value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
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
                  <button type="button" onClick={() => { onChange(String(opt.value)); setOpen(false); }}
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

const TYPE_CONFIG = {
  Receive: { label: "Receive",  bg: "bg-green-50",  text: "text-green-600",  dot: "bg-green-500"  },
  Sale:    { label: "Sale",     bg: "bg-red-50",     text: "text-red-600",    dot: "bg-red-500"    },
};

const emptyForm: TransactionPayload = { inventory: 0, transaction_type: "Receive", quantity: 0 };

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "Receive" | "Sale">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TransactionPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAll();
    getInventory().then(setInventory).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => clearTimeout(t);
  }, [search]);

  async function fetchAll() {
    setLoading(true);
    setError("");
    try {
      setTransactions(await getTransactions());
    } catch {
      setError("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!form.inventory) { setFormError("Please select an inventory record."); return; }
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        quantity: form.transaction_type === "Sale" ? -Math.abs(form.quantity) : Math.abs(form.quantity),
      };
      await createTransaction(payload);
      setModalOpen(false);
      await fetchAll();
    } catch {
      setFormError("Failed to create transaction.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTransaction(deleteTarget.id);
      setDeleteTarget(null);
      await fetchAll();
    } catch {
      setDeleting(false);
    }
  }

  const stats = useMemo(() => {
    const total    = transactions.length;
    const receives = transactions.filter((t) => t.transaction_type === "Receive").length;
    const sales    = transactions.filter((t) => t.transaction_type === "Sale").length;
    const todayCount = transactions.filter((t) => isToday(t.transaction_date)).length;
    return { total, receives, sales, todayCount };
  }, [transactions]);

  const displayed = useMemo(() => {
    let list = [...transactions];
    if (typeFilter) list = list.filter((t) => t.transaction_type === typeFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((t) =>
        t.inventory_details?.product_details?.product_name?.toLowerCase().includes(q) ||
        t.performed_by_username?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [transactions, typeFilter, debouncedSearch]);


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
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        <p className="text-sm font-medium">No transactions found.</p>
      </div>
    );
  } else {
    tableContent = (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["#", "Type", "Product", "Site", "Qty", "Performed By", "Date", "Time", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayed.map((t) => {
              const cfg = TYPE_CONFIG[t.transaction_type];
              const product = t.inventory_details?.product_details;
              const qtyColor = t.transaction_type === "Receive" ? "text-green-600" : "text-red-500";
              const qtySign  = t.transaction_type === "Receive" ? "+" : "";
              return (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-bold text-gray-400">#{t.id}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-800">{product?.product_name ?? "—"}</p>
                    <p className="text-[11px] text-gray-400">{product?.category ?? ""}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs">{t.inventory_details?.site ?? "—"}</td>
                  <td className={`px-5 py-3.5 font-bold text-base ${qtyColor}`}>
                    {qtySign}{t.quantity}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs">{t.performed_by_username}</td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs">{formatDate(t.transaction_date)}</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">{formatTime(t.transaction_date)}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => setDeleteTarget(t)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Delete">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>Stock Movement</p>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        </div>
        <button onClick={() => { setForm(emptyForm); setFormError(""); setModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-white hover:opacity-90 active:scale-[0.97] transition shadow-sm"
          style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Transaction
        </button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Featured: Today */}
        <div className="relative overflow-hidden rounded-2xl p-6 text-white"
          style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)" }}>
          <div className="absolute -left-4 -top-4 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-2 -bottom-3 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-5">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase bg-white/15 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                TODAY
              </span>
            </div>
            <p className="text-[30px] font-black tracking-tight leading-none tabular-nums">
              {loading ? "—" : stats.todayCount}
            </p>
            <p className="text-xs text-white/60 mt-2">Transactions today</p>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #FA4900, #b91c1c)" }} />
          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 text-orange-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-gray-900 leading-none tabular-nums">
                {loading ? "—" : stats.total}
              </p>
              <p className="text-xs font-bold text-gray-700 mt-1.5">Total Transactions</p>
              <p className="text-[10px] text-gray-400 mt-0.5">all time</p>
            </div>
          </div>
        </div>

        {/* Stock In */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-green-500" />
          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0 text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-gray-900 leading-none tabular-nums">
                  {loading ? "—" : stats.receives}
                </p>
                {!loading && stats.total > 0 && (
                  <span className="text-[10px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded-md">
                    {Math.round((stats.receives / stats.total) * 100)}%
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-gray-700 mt-1.5">Stock In (Receive)</p>
              <p className="text-[10px] text-gray-400 mt-0.5">receive transactions</p>
            </div>
          </div>
        </div>

        {/* Stock Out */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-red-500" />
          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0 text-red-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-gray-900 leading-none tabular-nums">
                  {loading ? "—" : stats.sales}
                </p>
                {!loading && stats.total > 0 && (
                  <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                    {Math.round((stats.sales / stats.total) * 100)}%
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-gray-700 mt-1.5">Stock Out (Sale)</p>
              <p className="text-[10px] text-gray-400 mt-0.5">sale transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction flow ratio */}
      {!loading && stats.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Transaction Flow</p>
            <p className="text-[10px] text-gray-400">{stats.total} total</p>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {stats.receives > 0 && (
              <div className="bg-green-500 rounded-full transition-all"
                style={{ width: `${(stats.receives / stats.total) * 100}%` }} />
            )}
            {stats.sales > 0 && (
              <div className="bg-red-500 rounded-full transition-all"
                style={{ width: `${(stats.sales / stats.total) * 100}%` }} />
            )}
          </div>
          <div className="flex items-center gap-5 mt-3">
            {[
              { label: "Stock In", count: stats.receives, dot: "bg-green-500" },
              { label: "Stock Out", count: stats.sales, dot: "bg-red-500" },
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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {([
            { key: "",        label: "All"     },
            { key: "Receive", label: "Receive" },
            { key: "Sale",    label: "Sale"    },
          ] as { key: "" | "Receive" | "Sale"; label: string }[]).map(({ key, label }) => (
            <button key={key || "all"} onClick={() => setTypeFilter(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition ${
                typeFilter === key ? "text-white shadow-sm" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
              style={typeFilter === key ? { background: "linear-gradient(135deg, #FA4900, #b91c1c)" } : {}}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" placeholder="Search product or user…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent transition w-56"
            style={ringStyle} />
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
          <span className="font-bold text-gray-600">{transactions.length}</span> transactions
        </p>
      )}

      {/* New Transaction Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">New Transaction</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <CustomSelect
                id="inventory" label="Inventory Record"
                value={form.inventory || ""}
                placeholder="Select inventory…"
                onChange={(v) => setForm((f) => ({ ...f, inventory: Number.parseInt(v) }))}
                options={inventory.map((r) => ({
                  value: r.id,
                  label: `${r.product_details.product_name} — ${r.site} (${r.location})`,
                }))}
              />
              <CustomSelect
                id="transaction_type" label="Type"
                value={form.transaction_type}
                onChange={(v) => setForm((f) => ({ ...f, transaction_type: v as "Receive" | "Sale" }))}
                options={[
                  { value: "Receive", label: "Receive — Stock In (+)" },
                  { value: "Sale",    label: "Sale — Stock Out (−)"   },
                ]}
              />
              <div className="space-y-1.5">
                <label htmlFor="quantity" className="text-xs font-bold tracking-widest uppercase text-gray-500">
                  Quantity
                </label>
                <input id="quantity" type="number" min={1} required
                  placeholder={form.transaction_type === "Receive" ? "e.g. 25 (positive)" : "e.g. 10 (will be negative)"}
                  value={form.quantity || ""}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: Math.abs(Number.parseInt(e.target.value) || 0) }))}
                  className={inputCls} style={ringStyle} />
                <p className="text-[11px] text-gray-400">
                  {form.transaction_type === "Sale"
                    ? "Enter a positive number — it will be applied as negative automatically."
                    : "Enter the number of units being received."}
                </p>
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
                  {saving ? "Saving…" : "Submit"}
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
              <h2 className="text-base font-bold text-gray-900">Delete Transaction?</h2>
              <p className="text-sm text-gray-500">
                <span className="font-semibold">{deleteTarget.transaction_type}</span>
                {" of "}
                <span className="font-semibold">{Math.abs(deleteTarget.quantity)} units</span>
                {" will be permanently removed."}
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
