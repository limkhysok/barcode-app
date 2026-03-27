"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Transaction, TransactionPayload } from "@/src/types/transaction.types";
import type { InventoryRecord } from "@/src/types/inventory.types";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from "@/src/services/transaction.service";
import { getInventory } from "@/src/services/inventory.service";
import TransactionTemplate from "@/src/components/features/export/TransactionTemplate";

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

type TxTypeFilter = "" | "Receive" | "Sale";
type ItemDraft = { id: number; inventory: number; quantity: number };
type TemplateItem = { barcode: string; product_name: string; unit: string; quantity: number };
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
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = inventory.find((r) => r.id === value);

  // Sync display text when selection changes externally
  useEffect(() => {
    setSearch(selected ? `${selected.product_details.product_name} — ${selected.site}` : "");
  }, [value, selected]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        // Restore label on blur
        setSearch(selected ? `${selected.product_details.product_name} — ${selected.site}` : "");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected]);

  // Close on scroll so stale position never shows
  useEffect(() => {
    if (!open) return;
    function onScroll() { setOpen(false); }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  function handleFocus() {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setSearch(""); // clear so user sees all options
    setOpen(true);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const selectedLabel = selected
      ? `${selected.product_details.product_name} — ${selected.site}`.toLowerCase()
      : "";
    const available = inventory.filter((r) => !excludeIds.includes(r.id) || r.id === value);
    if (!q || q === selectedLabel) return available;
    return available.filter((r) =>
      r.product_details?.product_name?.toLowerCase().includes(q) ||
      r.site?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.product_details?.barcode?.toLowerCase().includes(q)
    );
  }, [inventory, search, excludeIds, value, selected]);

  return (
    <div className="relative flex-1 min-w-0" ref={ref}>
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        placeholder="Search by name or barcode…"
        value={search}
        onFocus={handleFocus}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        className="w-full pl-4 pr-10 py-3 rounded-sm border border-black text-sm bg-gray-50 outline-none focus:ring-2 focus:border-transparent focus:bg-white transition placeholder:text-gray-300 text-gray-900"
        style={ringStyle}
      />
      {/* Barcode hint icon */}
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="none">
          <rect x="2"    y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
          <rect x="5"    y="4" width="1"   height="16" rx="0.5" fill="currentColor" />
          <rect x="7.5"  y="4" width="2"   height="16" rx="0.5" fill="currentColor" />
          <rect x="11"   y="4" width="1"   height="16" rx="0.5" fill="currentColor" />
          <rect x="13.5" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
          <rect x="16.5" y="4" width="1"   height="16" rx="0.5" fill="currentColor" />
          <rect x="19"   y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
          <rect x="21.5" y="4" width="1"   height="16" rx="0.5" fill="currentColor" />
        </svg>
      </div>

      {open && (
        <div
          className="bg-white border border-black rounded-sm shadow-lg overflow-hidden"
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
        >
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-xs text-gray-400 font-medium">No records found.</li>
            )}
            {filtered.map((r) => (
              <li key={r.id} className="border-b border-black last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    onChange(r.id);
                    setSearch(`${r.product_details.product_name} — ${r.site}`);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-[11px] font-semibold tracking-wide flex items-start gap-3 transition ${
                    value === r.id ? "bg-black text-white" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      {r.product_details.product_name}
                      {r.product_details.barcode && (
                        <span className={`ml-1.5 font-mono font-normal ${value === r.id ? "text-white/60" : "text-gray-400"}`}>
                          ({r.product_details.barcode})
                        </span>
                      )}
                    </p>
                    <p className={`text-[10px] truncate font-normal ${value === r.id ? "text-white/60" : "text-gray-400"}`}>
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

function waitTwoFrames(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

// ─── TypeFilterSelect ─────────────────────────────────────────────────────────

function TypeFilterSelect({
  value,
  onChange,
}: Readonly<{ value: TxTypeFilter; onChange: (v: TxTypeFilter) => void }>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options: { key: TxTypeFilter; label: string }[] = [
    { key: "",        label: "All Types"  },
    { key: "Receive", label: "Receive"    },
    { key: "Sale",    label: "Sale"       },
  ];
  const current = options.find((o) => o.key === value) ?? options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-4 py-2 rounded-sm border text-sm font-medium text-left flex items-center justify-between gap-2 transition focus:outline-none bg-gray-50 ${
          open ? "border-black ring-1 ring-black" : "border-black hover:bg-slate-50"
        } ${value === "" ? "text-gray-300" : "text-gray-900"}`}
      >
        <span className="truncate">{current.label}</span>
        <svg className="w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <ul className="absolute z-200 top-full mt-1 w-full bg-white border border-black rounded-sm shadow-lg overflow-hidden">
          {options.map((o) => (
            <li key={o.key || "all"} className="border-b border-black last:border-b-0">
              <button
                type="button"
                onClick={() => { onChange(o.key); setOpen(false); }}
                className={`w-full text-left px-3 py-2.5 text-[11px] font-semibold tracking-wide transition ${
                  value === o.key ? "bg-black text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
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

  const [typeFilter, setTypeFilter] = useState<TxTypeFilter>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [txType, setTxType] = useState<"Receive" | "Sale">("Receive");
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const [singleExporting, setSingleExporting] = useState(false);
  const [pendingExportItems, setPendingExportItems] = useState<TemplateItem[]>([]);
  const templateRef = useRef<HTMLDivElement>(null);

  const [viewTarget, setViewTarget] = useState<Transaction | null>(null);

  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [editTxType, setEditTxType] = useState<"Receive" | "Sale">("Receive");
  const [editItems, setEditItems] = useState<ItemDraft[]>([emptyItem()]);
  const [editSaving, setEditSaving] = useState(false);
  const [editFormError, setEditFormError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (menuOpenId === null) return;
    function onScroll() { setMenuOpenId(null); }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [menuOpenId]);

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

  async function doSave(andExport: boolean) {
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
      if (andExport) {
        const templateItems: TemplateItem[] = valid.map((i) => {
          const rec = inventory.find((r) => r.id === i.inventory);
          return {
            barcode: rec?.product_details.barcode ?? "",
            product_name: rec?.product_details.product_name ?? "",
            unit: "Pcs",
            quantity: i.quantity,
          };
        });
        exportTemplateAsPdf(templateItems, `transaction-${new Date().toISOString().slice(0, 10)}`);
      }
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

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    await doSave(false);
  }

  async function exportTemplateAsPdf(items: TemplateItem[], filename: string) {
    setPendingExportItems(items);
    await waitTwoFrames();
    setSingleExporting(true);
    try {
      try {
        const face = new FontFace("KantumruyPro", "url(/fonts/KantumruyPro-Regular.ttf)");
        document.fonts.add(await face.load());
        await document.fonts.ready;
      } catch { /* already loaded */ }
      const html2canvas = (await import("html2canvas")).default;
      const node = templateRef.current;
      if (!node) return;
      const canvas = await html2canvas(node, {
        scale: 3, useCORS: true, backgroundColor: "#ffffff",
        logging: false, width: node.scrollWidth, height: node.scrollHeight,
      });
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", format: "a5", unit: "mm", compress: true });
      const pdfW = doc.internal.pageSize.getWidth();
      const pdfH = doc.internal.pageSize.getHeight();
      doc.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pdfW, pdfH);
      doc.save(`${filename}.pdf`);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setSingleExporting(false);
      setPendingExportItems([]);
    }
  }

  async function handleDirectExport(t: Transaction) {
    const items: TemplateItem[] = t.items.map((item) => {
      const rec = inventory.find((r) => r.id === item.inventory);
      return {
        barcode: rec?.product_details.barcode ?? "",
        product_name: item.product_name,
        unit: "Pcs",
        quantity: item.quantity,
      };
    });
    exportTemplateAsPdf(items, `transaction-${t.id}-${new Date().toISOString().slice(0, 10)}`);
  }


  function openEditModal(t: Transaction) {
    setEditTarget(t);
    setEditTxType(t.transaction_type);
    setEditItems(t.items.map((item) => ({
      id: ++itemIdCounter,
      inventory: item.inventory,
      quantity: Math.abs(item.quantity),
    })));
    setEditFormError("");
  }

  function addEditItem() { setEditItems((prev) => [...prev, emptyItem()]); }
  function removeEditItem(idx: number) { setEditItems((prev) => prev.filter((_, i) => i !== idx)); }
  function updateEditItem(idx: number, patch: Partial<ItemDraft>) {
    setEditItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  }

  async function handleEditSave(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!editTarget) return;
    const valid = editItems.filter((i) => i.inventory > 0 && i.quantity > 0);
    if (valid.length === 0) { setEditFormError("Add at least one item with a product and quantity."); return; }
    setEditSaving(true);
    setEditFormError("");
    try {
      const payload: TransactionPayload = {
        transaction_type: editTxType,
        items: valid.map((i) => ({
          inventory: i.inventory,
          quantity: editTxType === "Sale" ? -Math.abs(i.quantity) : Math.abs(i.quantity),
        })),
      };
      await updateTransaction(editTarget.id, payload);
      setEditTarget(null);
      fetchAll();
      getInventory().then(setInventory).catch(() => {});
    } catch (err: unknown) {
      type ApiErr = { response?: { data?: { detail?: string; items?: Array<{ quantity?: string }> } } };
      const data = (err as ApiErr)?.response?.data;
      const msg = data?.detail ?? data?.items?.[0]?.quantity ?? "Failed to update transaction.";
      setEditFormError(msg);
    } finally {
      setEditSaving(false);
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
  const editSelectedInvIds = editItems.map((i) => i.inventory).filter(Boolean);

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
        <div className="sm:hidden divide-y divide-black">
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
                <button
                  type="button"
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setMenuPos({ top: r.bottom + 4, left: r.right - 128 });
                    setMenuOpenId(menuOpenId === t.id ? null : t.id);
                  }}
                  className="p-2.5 rounded-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition shrink-0 mt-0.5"
                  title="Actions"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-black">
              <tr>
                {["#", "Type", "Items", "Total Value", "Performed By", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold tracking-widest uppercase text-slate-900">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black bg-white text-[11px]">
              {displayed.map((t) => {
                const cfg    = TYPE_CONFIG[t.transaction_type];
                const sign   = t.transaction_type === "Receive" ? "+" : "−";
                const valCol = t.transaction_type === "Receive" ? "text-green-600" : "text-red-500";
                const first  = t.items[0];
                const more   = t.items.length - 1;
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-gray-400">#{t.id}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-800">
                        {first?.product_name ?? "—"}
                        {more > 0 && <span className="text-gray-400 font-normal"> &amp; {more} more</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{t.items.length} item{t.items.length === 1 ? "" : "s"}</p>
                    </td>
                    <td className={`px-5 py-3.5 font-bold tabular-nums ${valCol}`}>
                      {fmtValue(t.total_transaction_value, sign)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{t.performed_by_username}</td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap" suppressHydrationWarning>
                      {formatDateTime(t.transaction_date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          const r = e.currentTarget.getBoundingClientRect();
                          setMenuPos({ top: r.bottom + 4, left: r.right - 128 });
                          setMenuOpenId(menuOpenId === t.id ? null : t.id);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                        title="Actions"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
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
          <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>Transaction</p>
          <h1 className="text-2xl font-bold text-gray-900 uppercase italic">Movement</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* New Transaction button */}
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 sm:px-5 rounded-sm text-xs font-bold tracking-widest uppercase text-white hover:opacity-90 active:scale-[0.97] transition shadow-sm"
            style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">New Transaction</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Overview */}
      <div className="flex flex-col sm:flex-row rounded-sm border border-black overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-black">

        {/* Today */}
        <div className="flex-1 bg-white p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <span className="flex items-center gap-1.5 text-[9px] font-semibold tracking-widest uppercase border border-black px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />Today
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{stats.todayCount}</p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Transactions today</p>
          </div>
        </div>

        {/* Total */}
        <div className="flex-1 bg-white p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="w-8 h-8 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{stats.total}</p>
            <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">Total</p>
          </div>
        </div>

        {/* Receive */}
        <div className="flex-1 bg-white p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="w-8 h-8 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{stats.receives}</p>
              {stats.total > 0 && (
                <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md">
                  {Math.round((stats.receives / stats.total) * 100)}%
                </span>
              )}
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">Receive</p>
          </div>
        </div>

        {/* Sale */}
        <div className="flex-1 bg-white p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="w-8 h-8 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{stats.sales}</p>
              {stats.total > 0 && (
                <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md">
                  {Math.round((stats.sales / stats.total) * 100)}%
                </span>
              )}
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">Sale</p>
          </div>
        </div>

      </div>

      {/* Transaction flow bar */}
      {stats.total > 0 && (
        <div className="rounded-sm border border-black bg-white px-5 py-4">
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
      <div className="grid grid-cols-2 gap-2.5">
        {/* Type filter */}
        <TypeFilterSelect value={typeFilter} onChange={setTypeFilter} />
        {/* Search */}
        <div className="flex items-center gap-2 bg-white rounded-sm border border-black px-3 py-2">
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            id="tx-search"
            name="tx-search"
            type="text"
            placeholder="Search product or user…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-sm border border-black overflow-hidden bg-white">
        {tableContent}
      </div>

      {!loading && !error && (
        <p className="text-xs text-gray-400">
          Showing <span className="font-bold text-gray-600">{displayed.length}</span> of{" "}
          <span className="font-bold text-gray-600">{transactions.length}</span> transactions
        </p>
      )}

      {/* New Transaction Modal — two-panel */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl flex flex-col max-h-[95vh] overflow-hidden">

            {/* ── Orange accent strip ── */}
            <div className="h-1 w-full shrink-0" style={{ background: "#FA4900" }} />

            {/* ── Header ── */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-black shrink-0">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-none"
                  style={{ background: "#FFF0E8", color: "#FA4900" }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#FA4900" }} />
                  <span>New</span>
                </span>
                <h2 className="text-xl font-bold text-gray-900">New Transaction</h2>
                <p className="text-xs text-gray-400 mt-0.5">Select type, add items, confirm.</p>
              </div>
              <button onClick={() => setModalOpen(false)}
                className="mt-1 p-2 rounded-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── Body: left + right ── */}
            <form id="tx-form" onSubmit={handleSave} className="flex flex-col sm:flex-row flex-1 overflow-hidden min-h-0">

              {/* Left panel — type + item picker */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 sm:border-r border-black">

                {/* Type toggle */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Transaction Type</p>
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
                          className={`py-2.5 rounded-sm text-sm font-bold border transition ${
                            active ? activeCls : "bg-white border-black text-gray-500 hover:bg-slate-50"
                          }`}
                        >
                          {t === "Receive" ? "↓ Receive (+)" : "↑ Sale (−)"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Items</p>

                  {items.map((item, idx) => {
                    const rec = inventory.find((r) => r.id === item.inventory);
                    return (
                      <div key={item.id} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-300 w-4 shrink-0 text-right">{idx + 1}</span>
                        <InventoryPicker
                          inventory={inventory}
                          value={item.inventory}
                          onChange={(id) => updateItem(idx, { inventory: id })}
                          excludeIds={selectedInvIds}
                        />
                        <input
                          type="number"
                          min={1}
                          placeholder="Qty"
                          value={item.quantity || ""}
                          onChange={(e) => updateItem(idx, { quantity: Math.abs(Number.parseInt(e.target.value) || 0) })}
                          className="w-20 shrink-0 px-2 py-3 rounded-sm border border-black text-sm outline-none focus:ring-2 focus:border-transparent transition text-center font-bold bg-gray-50 focus:bg-white"
                          style={ringStyle}
                        />
                        {rec && (
                          <span className="text-[10px] text-gray-400 shrink-0 hidden lg:block">
                            /{rec.quantity_on_hand}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          disabled={items.length === 1}
                          className="p-1.5 rounded-sm text-gray-300 hover:text-red-500 hover:bg-red-50 transition shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addItem}
                    className="w-full py-2.5 rounded-sm border border-dashed border-black text-xs text-gray-400 font-bold tracking-widest uppercase hover:border-[#FA4900] hover:text-[#FA4900] transition flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add item
                  </button>
                </div>
              </div>

              {/* Right panel — order summary */}
              <div className="sm:w-72 shrink-0 flex flex-col bg-gray-50 border-t sm:border-t-0 sm:border-l border-black">
                <div className="px-5 py-4 border-b border-black">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Order Summary</p>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {(() => {
                    const filled = items.filter((i) => i.inventory > 0 && i.quantity > 0);
                    if (filled.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-300">
                          <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                          </svg>
                          <p className="text-xs">No items added yet</p>
                        </div>
                      );
                    }
                    const sign   = txType === "Receive" ? "+" : "−";
                    const valCol = txType === "Receive" ? "text-green-600" : "text-red-500";
                    const grandTotal = filled.reduce((sum, i) => {
                      const rec = inventory.find((r) => r.id === i.inventory);
                      return sum + (rec ? i.quantity * Number.parseFloat(rec.product_details.cost_per_unit) : 0);
                    }, 0);

                    return (
                      <>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-black">
                              <th className="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest uppercase text-gray-400">Product</th>
                              <th className="px-3 py-2.5 text-center text-[10px] font-bold tracking-widest uppercase text-gray-400">Qty</th>
                              <th className="px-4 py-2.5 text-right text-[10px] font-bold tracking-widest uppercase text-gray-400">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black">
                            {filled.map((i) => {
                              const rec = inventory.find((r) => r.id === i.inventory);
                              const lineTotal = rec ? i.quantity * Number.parseFloat(rec.product_details.cost_per_unit) : 0;
                              return (
                                <tr key={i.id}>
                                  <td className="px-4 py-3">
                                    <p className="font-semibold text-gray-800 truncate max-w-28">{rec?.product_details.product_name ?? "—"}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{rec?.site}</p>
                                  </td>
                                  <td className="px-3 py-3 text-center font-bold text-gray-700">{i.quantity}</td>
                                  <td className={`px-4 py-3 text-right font-bold tabular-nums ${valCol}`}>
                                    {sign}${lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {/* Grand total */}
                        <div className="mx-4 my-3 pt-3 border-t border-black flex items-center justify-between">
                          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Total</p>
                          <p className={`text-lg font-black tabular-nums ${valCol}`}>
                            {sign}${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </form>

            {/* ── Footer ── */}
            <div className="border-t border-black px-6 py-4 shrink-0 space-y-3">
              {formError && (
                <p className="text-xs font-medium text-red-500 bg-red-50 border border-red-100 rounded-sm px-4 py-2.5">{formError}</p>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  form="tx-form"
                  disabled={saving}
                  className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-white active:scale-[0.97] transition disabled:opacity-60"
                  style={{ background: "#FA4900" }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => doSave(true)}
                  className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-white active:scale-[0.97] transition disabled:opacity-60 whitespace-nowrap"
                  style={{ background: "#1a1a1a" }}
                >
                  {saving ? "Saving…" : "Save & Export"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating Actions Menu */}
      {menuOpenId !== null && (() => {
        const t = transactions.find((tx) => tx.id === menuOpenId);
        if (!t) return null;
        return (
          <>
            <button type="button" aria-label="Close menu" className="fixed inset-0 z-9998 cursor-default bg-transparent border-0 p-0" onClick={() => setMenuOpenId(null)} />
            <div
              style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
              className="bg-white border border-black rounded-sm shadow-2xl py-1.5 w-32 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => { setViewTarget(t); setMenuOpenId(null); }}
                className="w-full text-left px-4 py-2 text-xs font-bold tracking-widest uppercase text-gray-600 hover:bg-slate-50 transition"
              >
                View
              </button>
              <button
                type="button"
                onClick={() => { openEditModal(t); setMenuOpenId(null); }}
                className="w-full text-left px-4 py-2 text-xs font-bold tracking-widest uppercase text-gray-600 hover:bg-slate-50 transition"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => { handleDirectExport(t); setMenuOpenId(null); }}
                className="w-full text-left px-4 py-2 text-xs font-bold tracking-widest uppercase text-gray-600 hover:bg-slate-50 transition"
              >
                Export
              </button>
              <div className="mx-3 my-1 border-t border-black" />
              <button
                type="button"
                onClick={() => { setDeleteTarget(t); setMenuOpenId(null); }}
                className="w-full text-left px-4 py-2 text-xs font-bold tracking-widest uppercase text-red-500 hover:bg-red-50 transition"
              >
                Delete
              </button>
            </div>
          </>
        );
      })()}

      {/* View Modal */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg flex flex-col max-h-[90vh]">

            {/* Orange accent strip */}
            <div className="h-1 w-full rounded-t-3xl sm:rounded-t-2xl" style={{ background: "#FA4900" }} />

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-black shrink-0">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-none"
                  style={{ background: "#FFF0E8", color: "#FA4900" }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#FA4900" }} />
                  <span>View</span>
                </span>
                <h2 className="text-xl font-bold text-gray-900">Transaction #{viewTarget.id}</h2>
                <p className="text-xs text-gray-400 mt-0.5" suppressHydrationWarning>{formatDateTime(viewTarget.transaction_date)}</p>
              </div>
              <button onClick={() => setViewTarget(null)}
                className="mt-1 p-2 rounded-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Meta */}
              <div className="flex items-center gap-4 flex-wrap">
                {(() => {
                  const cfg = TYPE_CONFIG[viewTarget.transaction_type];
                  return (
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  );
                })()}
                <span className="text-xs text-gray-500">by <span className="font-semibold text-gray-700">{viewTarget.performed_by_username}</span></span>
              </div>

              {/* Items table */}
              <div className="border border-black overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-black">
                    <tr>
                      {["Product", "Qty", "Unit Cost", "Total"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold tracking-widest uppercase text-slate-900">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {viewTarget.items.map((item) => {
                      const sign = viewTarget.transaction_type === "Receive" ? "+" : "−";
                      const valCol = viewTarget.transaction_type === "Receive" ? "text-green-600" : "text-red-500";
                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-semibold text-gray-800">{item.product_name}</td>
                          <td className="px-4 py-3 text-gray-600 tabular-nums">{Math.abs(item.quantity)}</td>
                          <td className="px-4 py-3 text-gray-600 tabular-nums">${Number.parseFloat(item.cost_per_unit).toFixed(2)}</td>
                          <td className={`px-4 py-3 font-bold tabular-nums ${valCol}`}>
                            {sign}${Number.parseFloat(item.line_total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Grand total */}
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Grand Total</p>
                <p className={`text-xl font-black tabular-nums ${viewTarget.transaction_type === "Receive" ? "text-green-600" : "text-red-500"}`}>
                  {fmtValue(viewTarget.total_transaction_value, viewTarget.transaction_type === "Receive" ? "+" : "−")}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-black px-6 py-4 shrink-0">
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                className="w-full py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl flex flex-col max-h-[95vh] overflow-hidden">

            {/* Orange accent strip */}
            <div className="h-1 w-full shrink-0" style={{ background: "#FA4900" }} />

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-black shrink-0">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-none"
                  style={{ background: "#FFF0E8", color: "#FA4900" }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#FA4900" }} />
                  <span>Editing</span>
                </span>
                <h2 className="text-xl font-bold text-gray-900">Edit Transaction #{editTarget.id}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Modify type, items, and quantities.</p>
              </div>
              <button onClick={() => setEditTarget(null)}
                className="mt-1 p-2 rounded-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body: left + right */}
            <form id="edit-tx-form" onSubmit={handleEditSave} className="flex flex-col sm:flex-row flex-1 overflow-hidden min-h-0">

              {/* Left panel */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 sm:border-r border-black">

                {/* Type toggle */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Transaction Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["Receive", "Sale"] as const).map((t) => {
                      const active = editTxType === t;
                      const activeCls = t === "Receive"
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-red-500 border-red-500 text-white";
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setEditTxType(t)}
                          className={`py-2.5 rounded-sm text-sm font-bold border transition ${
                            active ? activeCls : "bg-white border-black text-gray-500 hover:bg-slate-50"
                          }`}
                        >
                          {t === "Receive" ? "↓ Receive (+)" : "↑ Sale (−)"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Items</p>
                  {editItems.map((item, idx) => {
                    const rec = inventory.find((r) => r.id === item.inventory);
                    return (
                      <div key={item.id} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-300 w-4 shrink-0 text-right">{idx + 1}</span>
                        <InventoryPicker
                          inventory={inventory}
                          value={item.inventory}
                          onChange={(id) => updateEditItem(idx, { inventory: id })}
                          excludeIds={editSelectedInvIds}
                        />
                        <input
                          type="number"
                          min={1}
                          placeholder="Qty"
                          value={item.quantity || ""}
                          onChange={(e) => updateEditItem(idx, { quantity: Math.abs(Number.parseInt(e.target.value) || 0) })}
                          className="w-20 shrink-0 px-2 py-3 rounded-sm border border-black text-sm outline-none focus:ring-2 focus:border-transparent transition text-center font-bold bg-gray-50 focus:bg-white"
                          style={ringStyle}
                        />
                        {rec && (
                          <span className="text-[10px] text-gray-400 shrink-0 hidden lg:block">
                            /{rec.quantity_on_hand}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeEditItem(idx)}
                          disabled={editItems.length === 1}
                          className="p-1.5 rounded-sm text-gray-300 hover:text-red-500 hover:bg-red-50 transition shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={addEditItem}
                    className="w-full py-2.5 rounded-sm border border-dashed border-black text-xs text-gray-400 font-bold tracking-widest uppercase hover:border-[#FA4900] hover:text-[#FA4900] transition flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add item
                  </button>
                </div>
              </div>

              {/* Right panel — order summary */}
              <div className="sm:w-72 shrink-0 flex flex-col bg-gray-50 border-t sm:border-t-0 sm:border-l border-black">
                <div className="px-5 py-4 border-b border-black">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Order Summary</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {(() => {
                    const filled = editItems.filter((i) => i.inventory > 0 && i.quantity > 0);
                    if (filled.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-300">
                          <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                          </svg>
                          <p className="text-xs">No items added yet</p>
                        </div>
                      );
                    }
                    const sign = editTxType === "Receive" ? "+" : "−";
                    const valCol = editTxType === "Receive" ? "text-green-600" : "text-red-500";
                    const grandTotal = filled.reduce((sum, i) => {
                      const rec = inventory.find((r) => r.id === i.inventory);
                      return sum + (rec ? i.quantity * Number.parseFloat(rec.product_details.cost_per_unit) : 0);
                    }, 0);
                    return (
                      <>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-black">
                              <th className="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest uppercase text-gray-400">Product</th>
                              <th className="px-3 py-2.5 text-center text-[10px] font-bold tracking-widest uppercase text-gray-400">Qty</th>
                              <th className="px-4 py-2.5 text-right text-[10px] font-bold tracking-widest uppercase text-gray-400">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black">
                            {filled.map((i) => {
                              const rec = inventory.find((r) => r.id === i.inventory);
                              const lineTotal = rec ? i.quantity * Number.parseFloat(rec.product_details.cost_per_unit) : 0;
                              return (
                                <tr key={i.id}>
                                  <td className="px-4 py-3">
                                    <p className="font-semibold text-gray-800 truncate max-w-28">{rec?.product_details.product_name ?? "—"}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{rec?.site}</p>
                                  </td>
                                  <td className="px-3 py-3 text-center font-bold text-gray-700">{i.quantity}</td>
                                  <td className={`px-4 py-3 text-right font-bold tabular-nums ${valCol}`}>
                                    {sign}${lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div className="mx-4 my-3 pt-3 border-t border-black flex items-center justify-between">
                          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Total</p>
                          <p className={`text-lg font-black tabular-nums ${valCol}`}>
                            {sign}${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-black px-6 py-4 shrink-0 space-y-3">
              {editFormError && (
                <p className="text-xs font-medium text-red-500 bg-red-50 border border-red-100 rounded-sm px-4 py-2.5">{editFormError}</p>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditTarget(null)}
                  className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-tx-form"
                  disabled={editSaving}
                  className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-white active:scale-[0.97] transition disabled:opacity-60"
                  style={{ background: "#FA4900" }}
                >
                  {editSaving ? "Saving…" : submitLabel(editItems)}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm px-5 pt-4 pb-8 sm:p-7 space-y-5 text-center">
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
                className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition disabled:opacity-60">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-white bg-red-500 hover:bg-red-600 active:scale-[0.97] transition disabled:opacity-60">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden TransactionTemplate for html2canvas capture */}
      <div
        ref={templateRef}
        aria-hidden="true"
        style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1, pointerEvents: "none" }}
      >
        {pendingExportItems.length > 0 && (
          <TransactionTemplate transaction={{ items: pendingExportItems }} />
        )}
      </div>

    </div>
  );
}
