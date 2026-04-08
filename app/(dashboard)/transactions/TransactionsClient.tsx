"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Transaction, TransactionPayload } from "@/src/types/transaction.types";
import type { InventoryRecord } from "@/src/types/inventory.types";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getTransactionStats, type TransactionStats } from "@/src/services/transaction.service";
import { getInventory } from "@/src/services/inventory.service";
import type { PaginatedInventory } from "@/src/types/api.types";
import TransactionTemplate from "@/src/components/features/export/TransactionTemplate";
type TxTypeFilter = "" | "Receive" | "Sale";
type TemplateItem = { barcode: string; product_name: string; unit: string; quantity: number };
import { useAuth } from "@/src/context/AuthContext";
import TypeFilterSelect from "./_components/TypeFilterSelect";
import DateFilter, { type DateFilterValue } from "./_components/DateFilter";
import SortToggleButton from "./_components/SortToggleButton";
import StatsOverview from "./_components/StatsOverview";
import TransactionsTable from "./_components/TransactionsTable";
import {
  NewTransactionModal,
  EditTransactionModal,
  ViewTransactionModal,
  DeleteConfirmModal,
} from "./_components/TransactionsModal";

function waitTwoFrames(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

type TransactionsClientProps = Readonly<{
  initialTransactions: Transaction[];
  initialPaginatedInventory: PaginatedInventory;
  initialStats: TransactionStats | null;
}>;

const TransactionsClient: React.FC<TransactionsClientProps> = ({
  initialTransactions,
  initialPaginatedInventory,
  initialStats,
}) => {
  const { role } = useAuth();
  const canEdit = role === "boss" || role === "superadmin";
  const canDelete = role === "superadmin";

  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  const [paginatedInventory, setPaginatedInventory] = useState<PaginatedInventory>(initialPaginatedInventory);
  const inventory = paginatedInventory.results;

  const [stats, setStats] = useState<TransactionStats | null>(initialStats);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] = useState<TxTypeFilter>("");
  const [dateFilter, setDateFilter] = useState<DateFilterValue>("");
  const [sortBy, setSortBy] = useState<string>("-transaction_date");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const [pendingExportItems, setPendingExportItems] = useState<TemplateItem[]>([]);
  const [pendingExportType, setPendingExportType] = useState<"Sale" | "Receive">("Sale");
  const templateRef = useRef<HTMLDivElement>(null);

  const [viewTarget, setViewTarget] = useState<Transaction | null>(null);

  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editFormError, setEditFormError] = useState("");

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [pdfPanelOpen, setPdfPanelOpen] = useState(false);
  const [pdfAutoDate, setPdfAutoDate] = useState(true);
  const [pdfDate, setPdfDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pdfType, setPdfType] = useState<"Receive" | "Sale">("Receive");
  const [pdfTypeMenuOpen, setPdfTypeMenuOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const pdfPanelRef = useRef<HTMLDivElement>(null);

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const pdfDateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pdfPanelRef.current && !pdfPanelRef.current.contains(e.target as Node)) {
        setPdfPanelOpen(false);
      }
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setFilterPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (menuOpenId === null) return;
    function onScroll() { setMenuOpenId(null); }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [menuOpenId]);

  useEffect(() => {
    fetchAll();
  }, [typeFilter]);

  function fetchAll() {
    setLoading(true);
    setError("");
    Promise.all([
      getTransactions({
        type: typeFilter || undefined,
        ordering: "-transaction_date",
      }),
      getTransactionStats(),
    ])
      .then(([newTransactions, newStats]) => {
        setTransactions(newTransactions);
        setStats(newStats);
      })
      .catch(() => setError("Failed to load data."))
      .finally(() => setLoading(false));
  }

  const exportTemplateAsPdf = async (items: TemplateItem[], txType: "Sale" | "Receive") => {
    setPendingExportItems(items);
    setPendingExportType(txType);
    await waitTwoFrames();
    try {
      try {
        const face = new FontFace("KantumruyPro", "url(/fonts/KantumruyPro-Regular.ttf)");
        document.fonts.add(await face.load());
        await document.fonts.ready;
      } catch { /* already loaded */ }
      const html2canvas = (await import("html2canvas")).default;
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", format: "a4", unit: "mm", compress: true });
      const pdfW = doc.internal.pageSize.getWidth();
      const pdfH = doc.internal.pageSize.getHeight();
      const pageNodes = Array.from(templateRef.current?.children ?? []) as HTMLElement[];
      for (let i = 0; i < pageNodes.length; i++) {
        const pageNode = pageNodes[i];
        const canvas = await html2canvas(pageNode, {
          scale: 3, useCORS: true, backgroundColor: "#ffffff",
          logging: false, width: pageNode.scrollWidth, height: pageNode.scrollHeight,
        });
        if (i > 0) doc.addPage();
        doc.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pdfW, pdfH);
      }
      const pdfBlob = doc.output("blob");
      window.open(URL.createObjectURL(pdfBlob), "_blank");
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setPendingExportItems([]);
    }
  };

  const handleSave = async (payload: TransactionPayload, andExport: boolean) => {
    setSaving(true);
    setFormError("");
    try {
      await createTransaction(payload);
      setModalOpen(false);
      fetchAll();
      getInventory().then(setPaginatedInventory).catch(() => { });
      if (andExport) {
        const templateItems: TemplateItem[] = payload.items.map((i: any) => {
          const rec = inventory.find((r) => r.id === i.inventory);
          return {
            barcode: rec?.product_details.barcode ?? "",
            product_name: rec?.product_details.product_name ?? "",
            unit: "Pcs",
            quantity: Math.abs(i.quantity),
          };
        });
        exportTemplateAsPdf(templateItems, payload.transaction_type);
      }
    } catch (err: unknown) {
      type ApiErr = { response?: { data?: { detail?: string; items?: Array<{ quantity?: string }> } } };
      const data = (err as ApiErr)?.response?.data;
      const msg = data?.detail ?? data?.items?.[0]?.quantity ?? "Failed to create transaction.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async (id: number, payload: TransactionPayload) => {
    setEditSaving(true);
    setEditFormError("");
    try {
      await updateTransaction(id, payload);
      setEditTarget(null);
      fetchAll();
      getInventory().then(setPaginatedInventory).catch(() => { });
    } catch (err: unknown) {
      type ApiErr = { response?: { data?: { detail?: string; items?: Array<{ quantity?: string }> } } };
      const data = (err as ApiErr)?.response?.data;
      const msg = data?.detail ?? data?.items?.[0]?.quantity ?? "Failed to update transaction.";
      setEditFormError(msg);
    } finally {
      setEditSaving(false);
    }
  };

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTransaction(deleteTarget.id);
      setDeleteTarget(null);
      fetchAll();
    } catch {
      setDeleting(false);
    } finally {
      setDeleting(false);
    }
  }

  const handleActionClick = (e: React.MouseEvent, t: Transaction) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 4, left: r.right - 80 });
    setMenuOpenId(menuOpenId === t.id ? null : t.id);
  };

  const handlePrint = async (t: Transaction) => {
    if (!t) return;
    const printItems = t.items.map((item) => {
      const rec = inventory.find((r: InventoryRecord) => r.id === item.inventory);
      return {
        barcode: rec?.product_details.barcode ?? "",
        product_name: item.product_name,
        unit: "Pcs",
        quantity: item.quantity,
      };
    });
    setPendingExportItems(printItems);
    setPendingExportType(t.transaction_type);
    await waitTwoFrames();
    try {
      const face = new FontFace("KantumruyPro", "url(/fonts/KantumruyPro-Regular.ttf)");
      document.fonts.add(await face.load());
      await document.fonts.ready;
    } catch (err) {
      console.error("Font loading error:", err);
    }
    const html2canvas = (await import("html2canvas")).default;
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", format: "a4", unit: "mm", compress: true });
    const pdfW = doc.internal.pageSize.getWidth();
    const pdfH = doc.internal.pageSize.getHeight();
    const pageNodes = Array.from(templateRef.current?.children ?? []) as HTMLElement[];
    for (let i = 0; i < pageNodes.length; i++) {
      const pageNode = pageNodes[i];
      const canvas = await html2canvas(pageNode, {
        scale: 3, useCORS: true, backgroundColor: "#ffffff",
        logging: false, width: pageNode.scrollWidth, height: pageNode.scrollHeight,
      });
      if (i > 0) doc.addPage();
      doc.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pdfW, pdfH);
    }
    const pdfBlob = doc.output("blob");
    window.open(URL.createObjectURL(pdfBlob), "_blank");
    setMenuOpenId(null);
    setPendingExportItems([]);
  };


  async function handlePdfExport() {
    setPdfLoading(true);
    setPdfError("");
    try {
      const flat = transactions
        .filter((t) => {
          const matchType = t.transaction_type === pdfType;
          const matchDate = pdfDate ? t.transaction_date.startsWith(pdfDate) : true;
          return matchType && matchDate;
        })
        .flatMap((t) => t.items.map(txItemToTemplateItem));

      const merged = new Map<string, TemplateItem>();
      for (const item of flat) {
        const key = item.barcode || item.product_name;
        const existing = merged.get(key);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          merged.set(key, { ...item });
        }
      }
      const items = Array.from(merged.values());
      if (items.length === 0) {
        setPdfError("No transactions found for the selected date and type.");
        return;
      }
      setPdfPanelOpen(false);
      await exportTemplateAsPdf(items, pdfType);
    } catch {
      setPdfError("Export failed. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  }

  function txItemToTemplateItem(item: Transaction["items"][number]): TemplateItem {
    const rec = inventory.find((r) => r.id === item.inventory);
    return {
      barcode: rec?.product_details.barcode ?? "",
      product_name: item.product_name,
      unit: "Pcs",
      quantity: Math.abs(item.quantity),
    };
  }

  const displayed = useMemo(() => {
    let list = [...transactions];

    // Filter by Type
    if (typeFilter) {
      list = list.filter((t) => t.transaction_type === typeFilter);
    }

    // Filter by Date
    if (dateFilter) {
      if (dateFilter === "today") {
        const todayStr = new Date().toISOString().slice(0, 10);
        list = list.filter((t) => t.transaction_date.startsWith(todayStr));
      } else if (dateFilter === "7d" || dateFilter === "30d") {
        const days = dateFilter === "7d" ? 7 : 30;
        const limit = new Date();
        limit.setDate(limit.getDate() - days);
        // Ensure we compare the start of that day
        limit.setHours(0, 0, 0, 0);

        list = list.filter((t) => {
          const txDate = new Date(t.transaction_date);
          return txDate >= limit;
        });
      } else {
        // Custom date (YYYY-MM-DD)
        list = list.filter((t) => t.transaction_date.startsWith(dateFilter));
      }
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "transaction_date") {
        return a.transaction_date.localeCompare(b.transaction_date);
      }
      if (sortBy === "-transaction_date") {
        return b.transaction_date.localeCompare(a.transaction_date);
      }
      if (sortBy === "id") {
        return a.id - b.id;
      }
      if (sortBy === "-id") {
        return b.id - a.id;
      }
      if (sortBy === "items_count") {
        return a.items.length - b.items.length;
      }
      if (sortBy === "-items_count") {
        return b.items.length - a.items.length;
      }
      if (sortBy === "total_qty") {
        const qtyA = a.items.reduce((sum, i) => sum + Math.abs(i.quantity), 0);
        const qtyB = b.items.reduce((sum, i) => sum + Math.abs(i.quantity), 0);
        return qtyA - qtyB;
      }
      if (sortBy === "-total_qty") {
        const qtyA = a.items.reduce((sum, i) => sum + Math.abs(i.quantity), 0);
        const qtyB = b.items.reduce((sum, i) => sum + Math.abs(i.quantity), 0);
        return qtyB - qtyA;
      }
      return 0;
    });

    return list;
  }, [transactions, typeFilter, dateFilter, sortBy]);

  return (
    <div className="px-4 py-5 sm:px-5 sm:py-5 space-y-3">
      <div className="flex items-center justify-between border border-gray-200 bg-white rounded-md py-3 px-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-[13px] font-black text-slate-950 uppercase tracking-[0.2em] leading-none">Transactions</h1>
            <div className="mt-1.5 flex items-center gap-1.5 leading-none">
              <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none" suppressHydrationWarning>
                {new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Phnom_Penh" })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:justify-end">
          {/* Export PDF */}
          <div className="relative" ref={pdfPanelRef}>
            <button
              type="button"
              onClick={() => { setPdfPanelOpen(!pdfPanelOpen); setPdfError(""); }}
              className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-sm text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                pdfPanelOpen ? "border-orange-500 bg-orange-500 text-white" : "border-gray-700 bg-white text-gray-700 hover:border-slate-600 hover:bg-orange-600 hover:text-white"
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${pdfPanelOpen ? "text-white" : "text-gray-700"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span>Print</span>
            </button>
            {pdfPanelOpen && (
              <div className="absolute right-0 z-100 mt-2 w-64 bg-white border border-gray-100 rounded-md shadow-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="pdf-date" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Date</label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={pdfAutoDate}
                        onChange={(e) => setPdfAutoDate(e.target.checked)}
                        className="sr-only"
                      />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto Date</span>
                      <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-all ${pdfAutoDate ? "bg-orange-500 border-orange-500" : "bg-white border-gray-300"}`}>
                        {pdfAutoDate && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    </label>
                  </div>
                  {(() => {
                    const active = pdfDate;
                    const [yyyy, mm, dd] = active.split("-");
                    const handlePart = (part: "dd" | "mm" | "yyyy", val: string) => {
                      const cur = pdfDate.split("-");
                      if (part === "dd") cur[2] = val.padStart(2, "0");
                      if (part === "mm") cur[1] = val.padStart(2, "0");
                      if (part === "yyyy") cur[0] = val;
                      setPdfDate(cur.join("-"));
                    };
                    return (
                      <div className="relative flex items-center gap-1 border border-gray-200 rounded-sm px-2.5 py-2 bg-white focus-within:border-orange-500 transition-all">
                        <input type="text" inputMode="numeric" maxLength={2} value={dd} onChange={(e) => handlePart("dd", e.target.value.replaceAll(/\D/g, ""))}
                          className="w-6 text-xs font-bold text-gray-600 bg-transparent outline-none text-center" />
                        <span className="text-gray-300 text-xs font-bold">|</span>
                        <input type="text" inputMode="numeric" maxLength={2} value={mm} onChange={(e) => handlePart("mm", e.target.value.replaceAll(/\D/g, ""))}
                          className="w-6 text-xs font-bold text-gray-600 bg-transparent outline-none text-center" />
                        <span className="text-gray-300 text-xs font-bold">|</span>
                        <input type="text" inputMode="numeric" maxLength={4} value={yyyy} onChange={(e) => handlePart("yyyy", e.target.value.replaceAll(/\D/g, ""))}
                          className="w-10 text-xs font-bold text-gray-600 bg-transparent outline-none text-center" />
                        <button type="button" onClick={() => pdfDateInputRef.current?.showPicker()} className="ml-auto text-slate-400 hover:text-orange-500 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                        </button>
                        <input
                          ref={pdfDateInputRef}
                          type="date"
                          value={active}
                          onChange={(e) => setPdfDate(e.target.value)}
                          className="absolute opacity-0 pointer-events-none w-0 h-0"
                        />
                      </div>
                    );
                  })()}
                </div>
                <div className="space-y-2">
                  <label htmlFor="pdf-type" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SELECT TYPE</label>
                  <div className="relative">
                    <button
                      type="button"
                      id="pdf-type"
                      onClick={() => setPdfTypeMenuOpen(!pdfTypeMenuOpen)}
                      className="w-full flex items-center justify-between border border-gray-200 rounded-sm px-2.5 py-2 text-xs font-bold text-gray-600 bg-white hover:border-gray-200 transition-colors focus:outline-none "
                    >
                      <span className="uppercase">{pdfType}</span>
                      <svg
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${pdfTypeMenuOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>

                    {pdfTypeMenuOpen && (
                      <ul className="absolute z-110 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {(["Receive", "Sale"] as const).map((type) => (
                          <li key={type}>
                            <button
                              type="button"
                              onClick={() => {
                                setPdfType(type);
                                setPdfTypeMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition-colors ${pdfType === type
                                ? "bg-slate-50 text-orange-500"
                                : "text-gray-500 hover:bg-orange-500 hover:text-white"
                                }`}
                            >
                              {type}
                              {pdfType === type && (
                                <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {pdfError && <p className="text-[10px] text-red-500 font-black uppercase tracking-tight bg-red-50 px-2 py-1 rounded">{pdfError}</p>}
                <button
                  type="button"
                  onClick={handlePdfExport}
                  disabled={pdfLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-[11px] font-black tracking-widest uppercase bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-all shadow-xl shadow-black/20 active:scale-[0.98]"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6a4.5 4.5 0 01-4.5-4.5V15a2.25 2.25 0 002.25 2.25h16.5A2.25 2.25 0 0021 15v1.5a4.5 4.5 0 01-4.5 4.5H6.75z" />
                  </svg>
                  {pdfLoading ? "Processing..." : "Print"}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => { setFormError(""); setModalOpen(true); }}
            className="flex items-center gap-2.5 px-3.5 py-1.5 sm:px-5 rounded-sm text-[11px] font-black uppercase tracking-wider bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.96] transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">New Transaction</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      <StatsOverview stats={stats} />

      <div className="flex flex-wrap items-center gap-3 border border-gray-200 bg-white rounded-md p-2 transition-all hover:border-gray-200">
        {/* Desktop Toolbar */}
        <div className="hidden sm:flex items-center">
          <div className="flex items-center gap-2 pr-3 border-r border-gray-50">
            <TypeFilterSelect value={typeFilter} onChange={setTypeFilter} />
            <DateFilter value={dateFilter} onChange={setDateFilter} />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0 px-2 ">
              <SortToggleButton 
                label="Date" 
                field="transaction_date" 
                currentSort={sortBy} 
                onSort={setSortBy} 
                icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zM14.25 15h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-2.25h.008v.008H16.5V15z"/></svg>}
              />
              <SortToggleButton 
                label="Items" 
                field="items_count" 
                currentSort={sortBy} 
                onSort={setSortBy} 
                icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-3.75zM2.25 16.875c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75z"/></svg>}
              />
              <SortToggleButton 
                label="Quantity" 
                field="total_qty" 
                currentSort={sortBy} 
                onSort={setSortBy} 
                icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>}
              />
            </div>
          </div>
        </div>

        {/* Mobile Bundle Button */}
        <div className="sm:hidden relative" ref={filterPanelRef}>
          <button
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className={`flex items-center gap-2 px-3 py-1 rounded-md border text-[11px] font-light tracking-widest transition-all ${filterPanelOpen ? "bg-black text-white border-black" : "bg-white text-black border-black/70"
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            <span>Filter</span>
          </button>

          {filterPanelOpen && (
            <div className="absolute left-0 mt-3 z-50 w-70 bg-white border border-black rounded-lg shadow-2xl p-4 flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter By</span>
                <div className="flex flex-col gap-2">
                  <TypeFilterSelect value={typeFilter} onChange={setTypeFilter} />
                  <DateFilter value={dateFilter} onChange={setDateFilter} />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort By</span>
                <div className="flex flex-wrap gap-2">
                  <SortToggleButton label="Date" field="transaction_date" currentSort={sortBy} onSort={setSortBy} />
                  <SortToggleButton label="Items" field="items_count" currentSort={sortBy} onSort={setSortBy} />
                  <SortToggleButton label="Qty" field="total_qty" currentSort={sortBy} onSort={setSortBy} />
                </div>
              </div>

              <button
                onClick={() => setFilterPanelOpen(false)}
                className="mt-2 w-full py-2 bg-black text-white text-[11px] font-black uppercase rounded shadow-md"
              >
                Close
              </button>
            </div>
          )}
        </div>

        <div className="ml-auto hidden sm:flex items-center gap-1 bg-slate-100 border border-black/10 rounded-sm p-1">
          {(["list", "grid"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              title={mode === "list" ? "List view" : "Grid view"}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase transition-all duration-150 ${viewMode === mode
                ? "bg-orange-500 text-white"
                : "text-gray-400 hover:text-white hover:bg-orange-500"
                }`}
            >
              {mode === "list" ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              )}
              <span className="hidden sm:inline">{mode}</span>
            </button>
          ))}
        </div>
      </div>

      <div className=" overflow-hidden bg-white">
        <TransactionsTable
          displayed={displayed}
          loading={loading}
          error={error}
          onView={setViewTarget}
          onEdit={setEditTarget}
          onPrint={handlePrint}
          onDelete={setDeleteTarget}
          canEdit={canEdit}
          canDelete={canDelete}
          onActionClick={handleActionClick}
          viewMode={viewMode}
        />
      </div>

      {!loading && !error && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
          <p className="text-xs text-gray-400">
            <span className="font-bold text-gray-600">{transactions.length}</span> records
          </p>
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
              className="bg-white border border-black rounded-sm shadow-2xl py-0 w-20 overflow-hidden"
            >
              <button type="button" onClick={() => { setViewTarget(t); setMenuOpenId(null); }}
                className="w-full text-left px-4 py-2 text-[12px] font-black text-gray-700 hover:bg-slate-50 transition">View</button>
              {canEdit && (
                <button type="button" onClick={() => { setEditTarget(t); setMenuOpenId(null); }}
                  className="w-full text-left px-4 py-2 text-[12px] font-black text-gray-700 hover:bg-slate-50 transition">Edit</button>
              )}
              <button type="button" onClick={() => { handlePrint(t); setMenuOpenId(null); }}
                className="w-full text-left px-4 py-2 text-[12px] font-black text-gray-700 hover:bg-slate-50 transition">Print</button>
              {canDelete && (
                <button type="button" onClick={() => { setDeleteTarget(t); setMenuOpenId(null); }}
                  className="w-full text-left px-4 py-2 text-[12px] font-black text-red-500 hover:bg-red-50 transition">Delete</button>
              )}
            </div>
          </>
        );
      })()}

      <NewTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        inventory={inventory}
        onSave={handleSave}
        saving={saving}
        formError={formError}
      />

      <EditTransactionModal
        editTarget={editTarget}
        onClose={() => setEditTarget(null)}
        inventory={inventory}
        onSave={handleEditSave}
        saving={editSaving}
        formError={editFormError}
      />

      <ViewTransactionModal viewTarget={viewTarget} onClose={() => setViewTarget(null)} inventory={inventory} />

      <DeleteConfirmModal
        deleteTarget={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />

      {/* Hidden TransactionTemplate for html2canvas capture */}
      <div
        ref={templateRef}
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", top: 0, zIndex: -1, pointerEvents: "none" }}
      >
        {pendingExportItems.length > 0 && (
          <TransactionTemplate
            transaction={{ transaction_type: pendingExportType, items: pendingExportItems }}
            autoDate={pdfAutoDate}
            date={pdfDate}
          />
        )}
      </div>
    </div>
  );
};

export default TransactionsClient;
