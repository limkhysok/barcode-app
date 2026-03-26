"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Transaction, TransactionPayload } from "@/src/types/transaction.types";
import type { InventoryRecord } from "@/src/types/inventory.types";
import { getTransactions, createTransaction, deleteTransaction } from "@/src/services/transaction.service";
import { getInventory } from "@/src/services/inventory.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(ts: string): string {
  const d = new Date(ts);
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

function isToday(ts: string): boolean {
  const d = new Date(ts);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function fmtValue(v: string, sign: string) {
  return `${sign}$${Number.parseFloat(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ringStyle = { "--tw-ring-color": "#FA4900" } as React.CSSProperties;

const TYPE_CONFIG = {
  Receive: { label: "Receive", bg: "bg-green-50", text: "text-green-600", dot: "bg-green-500" },
  Sale:    { label: "Sale",    bg: "bg-red-50",   text: "text-red-600",   dot: "bg-red-500"   },
};

type ItemDraft = { id: number; inventory: number; quantity: number };
let itemIdCounter = 0;
const emptyItem = (): ItemDraft => ({ id: ++itemIdCounter, inventory: 0, quantity: 0 });

function submitLabel(items: ItemDraft[]): string {
  const count = items.filter((i) => i.inventory > 0 && i.quantity > 0).length;
  return `Submit ${count} item${count === 1 ? "" : "s"}`;
}

// ─── InventoryPicker ─────────────────────────────────────────────────────────

function InventoryPicker({
  inventory,
  value,
  onChange,
  excludeIds,
}: Readonly<{
  inventory: InventoryRecord[];
  value: number;
  onChange: (id: number) => void;
  excludeIds: number[];
}>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventory.filter(
      (r) =>
        !excludeIds.includes(r.id) || r.id === value
    ).filter((r) => {
      if (!q) return true;
      return (
        r.product_details.product_name.toLowerCase().includes(q) ||
        r.site.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.product_details.barcode.toLowerCase().includes(q)
      );
    });
  }, [inventory, search, excludeIds, value]);

  const selected = inventory.find((r) => r.id === value);

  return (
    <div className="relative flex-1 min-w-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm text-left flex items-center justify-between gap-2 transition focus:outline-none ${
          open ? "border-[#FA4900] ring-2 ring-[#FA4900]/20" : "border-gray-200 hover:border-gray-300"
        } ${selected ? "text-gray-900" : "text-gray-400"}`}
      >
        <span className="truncate text-sm">
          {selected
            ? `${selected.product_details.product_name} — ${selected.site}`
            : "Select product…"}
        </span>
        <svg className="w-4 h-4 text-gray-400 shrink-0" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-65 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1">
          <div className="px-3 py-2">
            <input
              type="text"
              placeholder="Search product, site, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent"
              style={ringStyle}
              autoFocus
            />
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-4 py-2.5 text-sm text-gray-400">No records found.</li>
            )}
            {filtered.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => { onChange(r.id); setOpen(false); setSearch(""); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-start gap-3 transition ${
                    value === r.id ? "font-bold text-white" : "text-gray-700 hover:bg-gray-50"
                  }`}
                  style={value === r.id ? { background: "linear-gradient(135deg, #FA4900, #b91c1c)" } : {}}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.product_details.product_name}</p>
                    <p className={`text-[11px] truncate ${value === r.id ? "text-white/70" : "text-gray-400"}`}>
                      {r.site} · {r.location} · Qty: {r.quantity_on_hand}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── TransactionsClient ───────────────────────────────────────────────────────

export default function TransactionsClient({ initialTransactions, initialInventory }: Readonly<{
  initialTransactions: Transaction[];
  initialInventory: InventoryRecord[];
}>) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [inventory, setInventory] = useState<InventoryRecord[]>(initialInventory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] = useState<"" | "Receive" | "Sale">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [txType, setTxType] = useState<"Receive" | "Sale">("Receive");
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => clearTimeout(t);
  }, [search]);

  function fetchAll() {
    setLoading(true);
    setError("");
    getTransactions()
      .then(setTransactions)
      .catch(() => setError("Failed to load transactions."))
      .finally(() => setLoading(false));
  }

  function openModal() {
    setTxType("Receive");
    setItems([emptyItem()]);
    setFormError("");
    setModalOpen(true);
  }

  function addItem() { setItems((prev) => [...prev, emptyItem()]); }
  function removeItem(idx: number) { setItems((prev) => prev.filter((_, i) => i !== idx)); }
  function updateItem(idx: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  }

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    const valid = items.filter((i) => i.inventory > 0 && i.quantity > 0);
    if (valid.length === 0) { setFormError("Add at least one item with a product and quantity."); return; }
    setSaving(true);
    setFormError("");
    try {
      const payload: TransactionPayload = {
        transaction_type: txType,
        items: valid.map((i) => ({
          inventory: i.inventory,
          quantity: txType === "Sale" ? -Math.abs(i.quantity) : Math.abs(i.quantity),
        })),
      };
      await createTransaction(payload);
      setModalOpen(false);
      fetchAll();
      getInventory().then(setInventory).catch(() => {});
    } catch (err: unknown) {
      type ApiErr = { response?: { data?: { detail?: string; items?: Array<{ quantity?: string }> } } };
      const data = (err as ApiErr)?.response?.data;
      const msg =
        data?.detail ??
        data?.items?.[0]?.quantity ??
        "Failed to create transaction.";
      setFormError(msg);
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
      fetchAll();
    } catch {
      setDeleting(false);
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total      = transactions.length;
    const receives   = transactions.filter((t) => t.transaction_type === "Receive").length;
    const sales      = transactions.filter((t) => t.transaction_type === "Sale").length;
    const todayCount = transactions.filter((t) => isToday(t.transaction_date)).length;
    return { total, receives, sales, todayCount };
  }, [transactions]);

  const displayed = useMemo(() => {
    let list = [...transactions];
    if (typeFilter) list = list.filter((t) => t.transaction_type === typeFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((t) =>
        t.items.some((item) => item.product_name?.toLowerCase().includes(q)) ||
        t.performed_by_username?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, typeFilter, debouncedSearch]);

  const selectedInvIds = items.map((i) => i.inventory).filter(Boolean);

  // ── Table / card content ─────────────────────────────────────────────────────

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
      <>
        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-50">
          {displayed.map((t) => {
            const cfg     = TYPE_CONFIG[t.transaction_type];
            const sign    = t.transaction_type === "Receive" ? "+" : "−";
            const valCol  = t.transaction_type === "Receive" ? "text-green-600" : "text-red-500";
            const first   = t.items[0];
            const more    = t.items.length - 1;
            return (
              <div key={t.id} className="px-4 py-4 flex items-start gap-3 active:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm">
                      {first?.product_name ?? "—"}
                      {more > 0 && <span className="text-gray-400 font-normal"> & {more} more</span>}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {t.items.length} item{t.items.length === 1 ? "" : "s"}
                  </p>
                  <div className="flex items-center gap-3 text-xs flex-wrap">
                    <span className={`text-sm font-black tabular-nums ${valCol}`}>
                      {fmtValue(t.total_transaction_value, sign)}
                    </span>
                    <span className="text-gray-400">by <span className="font-semibold text-gray-600">{t.performed_by_username}</span></span>
                  </div>
                  <p className="text-[11px] text-gray-400" suppressHydrationWarning>{formatDateTime(t.transaction_date)}</p>
                </div>
                <button onClick={() => setDeleteTarget(t)}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-95 transition shrink-0 mt-0.5"
                  title="Delete">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["#", "Type", "Items", "Total Value", "Performed By", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.map((t) => {
                const cfg    = TYPE_CONFIG[t.transaction_type];
                const sign   = t.transaction_type === "Receive" ? "+" : "−";
                const valCol = t.transaction_type === "Receive" ? "text-green-600" : "text-red-500";
                const first  = t.items[0];
                const more   = t.items.length - 1;
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
                      <p className="font-semibold text-gray-800">
                        {first?.product_name ?? "—"}
                        {more > 0 && <span className="text-gray-400 font-normal text-xs"> & {more} more</span>}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{t.items.length} item{t.items.length === 1 ? "" : "s"}</p>
                    </td>
                    <td className={`px-5 py-3.5 font-bold text-sm tabular-nums ${valCol}`}>
                      {fmtValue(t.total_transaction_value, sign)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">{t.performed_by_username}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap" suppressHydrationWarning>
                      {formatDateTime(t.transaction_date)}
                    </td>
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
      </>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 py-5 sm:px-8 sm:py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>Stock Movement</p>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 sm:px-5 rounded-xl text-xs font-bold tracking-widest uppercase text-white hover:opacity-90 active:scale-[0.97] transition shadow-sm"
          style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">New Transaction</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* Today */}
        <div className="col-span-2 lg:col-span-1 relative overflow-hidden rounded-2xl p-5 sm:p-6 text-white"
          style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)" }}>
          <div className="absolute -left-4 -top-4 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-2 -bottom-3 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase bg-white/15 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />Today
              </span>
            </div>
            <p className="text-[28px] sm:text-[32px] font-black tracking-tight leading-none tabular-nums">{stats.todayCount}</p>
            <p className="text-[11px] text-white/60 mt-2 font-medium">Transactions today</p>
          </div>
        </div>

        {/* Total */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #FA4900, #b91c1c)" }} />
          <div className="p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 text-orange-500">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 leading-none tabular-nums">{stats.total}</p>
              <p className="text-[11px] font-semibold text-gray-400 mt-1 uppercase tracking-widest">Total</p>
            </div>
          </div>
        </div>

        {/* Receive */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-green-500" />
          <div className="p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0 text-green-600">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-black text-gray-900 leading-none tabular-nums">{stats.receives}</p>
                {stats.total > 0 && (
                  <span className="text-[10px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded-md">
                    {Math.round((stats.receives / stats.total) * 100)}%
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-widest">Receive</p>
            </div>
          </div>
        </div>

        {/* Sale */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-red-500" />
          <div className="p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0 text-red-500">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-black text-gray-900 leading-none tabular-nums">{stats.sales}</p>
                {stats.total > 0 && (
                  <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                    {Math.round((stats.sales / stats.total) * 100)}%
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-widest">Sale</p>
            </div>
          </div>
        </div>

      </div>

      {/* Transaction flow bar */}
      {stats.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Transaction Flow</p>
            <p className="text-[10px] text-gray-400">{stats.total} total</p>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {stats.receives > 0 && (
              <div className="bg-green-500 rounded-full transition-all" style={{ width: `${(stats.receives / stats.total) * 100}%` }} />
            )}
            {stats.sales > 0 && (
              <div className="bg-red-500 rounded-full transition-all" style={{ width: `${(stats.sales / stats.total) * 100}%` }} />
            )}
          </div>
          <div className="flex items-center gap-5 mt-3">
            {[
              { label: "Receive", count: stats.receives, dot: "bg-green-500" },
              { label: "Sale",    count: stats.sales,    dot: "bg-red-500"   },
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
        <div className="overflow-x-auto pb-1 -mb-1">
          <div className="flex items-center gap-2 w-max">
            {([
              { key: "",        label: "All"     },
              { key: "Receive", label: "Receive" },
              { key: "Sale",    label: "Sale"    },
            ] as { key: "" | "Receive" | "Sale"; label: string }[]).map(({ key, label }) => (
              <button
                key={key || "all"}
                onClick={() => setTypeFilter(key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition ${
                  typeFilter === key ? "text-white shadow-sm" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
                style={typeFilter === key ? { background: "linear-gradient(135deg, #FA4900, #b91c1c)" } : {}}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text" placeholder="Search product or user…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent transition w-full sm:w-60"
            style={ringStyle}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {tableContent}
      </div>

      {!loading && !error && (
        <p className="text-xs text-gray-400">
          Showing <span className="font-bold text-gray-600">{displayed.length}</span> of{" "}
          <span className="font-bold text-gray-600">{transactions.length}</span> transactions
        </p>
      )}

      {/* New Transaction Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg px-5 pt-4 pb-8 sm:p-7 space-y-5 max-h-[95vh] overflow-y-auto">

            <div className="flex justify-center sm:hidden mb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">New Transaction</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">

              {/* Transaction type — locked for all items */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold tracking-widest uppercase text-gray-500">Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["Receive", "Sale"] as const).map((t) => {
                    const active = txType === t;
                    const activeCls = t === "Receive"
                      ? "bg-green-500 border-green-500 text-white"
                      : "bg-red-500 border-red-500 text-white";
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTxType(t)}
                        className={`py-3 rounded-xl text-base font-bold border transition ${
                          active ? activeCls : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {t === "Receive" ? "Receive (+)" : "Sale (−)"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Items list */}
              <div className="space-y-3">
                <p className="text-xs font-bold tracking-widest uppercase text-gray-500">
                  Items <span className="normal-case text-gray-400 font-normal">({items.length})</span>
                </p>

                {items.map((item, idx) => {
                  const rec = inventory.find((r) => r.id === item.inventory);
                  const lineTotal = rec && item.quantity > 0
                    ? item.quantity * Number.parseFloat(rec.product_details.cost_per_unit)
                    : null;
                  const sign = txType === "Receive" ? "+" : "−";
                  const valCol = txType === "Receive" ? "text-green-600" : "text-red-500";

                  return (
                    <div key={item.id} className="rounded-xl border border-gray-200 p-3 space-y-2.5 bg-gray-50/50">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 w-5 shrink-0">#{idx + 1}</span>
                        <InventoryPicker
                          inventory={inventory}
                          value={item.inventory}
                          onChange={(id) => updateItem(idx, { inventory: id })}
                          excludeIds={selectedInvIds}
                        />
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pl-7">
                        <input
                          type="number"
                          min={1}
                          placeholder="Qty"
                          value={item.quantity || ""}
                          onChange={(e) => updateItem(idx, { quantity: Math.abs(Number.parseInt(e.target.value) || 0) })}
                          className="w-24 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent transition text-center font-bold"
                          style={ringStyle}
                        />
                        {rec && (
                          <span className="text-xs text-gray-400">
                            on hand: <span className="font-semibold text-gray-600">{rec.quantity_on_hand}</span>
                          </span>
                        )}
                        {lineTotal !== null && (
                          <span className={`ml-auto text-sm font-black tabular-nums ${valCol}`}>
                            {sign}${lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addItem}
                  className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-400 font-medium hover:border-[#FA4900] hover:text-[#FA4900] transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add another item
                </button>
              </div>

              {formError && (
                <p className="text-xs font-medium text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 active:scale-[0.97] transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm active:scale-[0.97] transition disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}>
                  {saving ? "Saving…" : submitLabel(items)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm px-5 pt-4 pb-8 sm:p-7 space-y-5 text-center">
            <div className="flex justify-center sm:hidden mb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
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
                {" · "}
                <span className="font-semibold">{deleteTarget.items.length} item{deleteTarget.items.length === 1 ? "" : "s"}</span>
                {" · "}
                <span className="font-semibold">{fmtValue(deleteTarget.total_transaction_value, "")}</span>
                {" will be permanently removed."}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-sm font-bold text-gray-600 active:scale-[0.97] transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold active:scale-[0.97] transition hover:bg-red-600 disabled:opacity-60">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
