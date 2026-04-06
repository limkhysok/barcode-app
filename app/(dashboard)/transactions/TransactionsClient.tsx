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
  const canEdit   = role === "boss" || role === "superadmin";
  const canDelete = role === "superadmin";

  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  const [paginatedInventory, setPaginatedInventory] = useState<PaginatedInventory>(initialPaginatedInventory);
  const inventory = paginatedInventory.results;

  const [stats, setStats] = useState<TransactionStats | null>(initialStats);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] = useState<TxTypeFilter>("");

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
  const [pdfDate, setPdfDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pdfType, setPdfType] = useState<"Receive" | "Sale">("Receive");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const pdfPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pdfPanelRef.current && !pdfPanelRef.current.contains(e.target as Node)) {
        setPdfPanelOpen(false);
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
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
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
    if (!typeFilter) return transactions;
    return transactions.filter((t) => t.transaction_type === typeFilter);
  }, [transactions, typeFilter]);

  return (
    <div className="px-4 py-5 sm:px-5 sm:py-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <h1 className="text-xl font-light text-gray-900">Transactions</h1>
          <p className="text-[11px] text-gray-700 font-medium" suppressHydrationWarning>
            {new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Phnom_Penh" })}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Export PDF */}
          <div className="relative" ref={pdfPanelRef}>
            <button
              type="button"
              onClick={() => { setPdfPanelOpen((v) => !v); setPdfError(""); }}
              className="flex items-center gap-2 px-2 py-1.5 sm:px-4 rounded-md text-xs font-light tracking-widest border border-black bg-white text-black hover:bg-gray-50 active:scale-[0.97] transition shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span>PDF</span>
            </button>
            {pdfPanelOpen && (
              <div className="absolute right-0 z-50 mt-1 w-56 bg-white border border-black rounded-sm shadow-lg p-3 space-y-2.5">
                <div className="space-y-1">
                  <label htmlFor="pdf-date" className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Date</label>
                  <input
                    id="pdf-date"
                    type="date"
                    value={pdfDate}
                    onChange={(e) => setPdfDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs text-gray-800 focus:outline-none focus:border-black"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="pdf-type" className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Type</label>
                  <select
                    id="pdf-type"
                    value={pdfType}
                    onChange={(e) => setPdfType(e.target.value as "Receive" | "Sale")}
                    className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs text-gray-800 focus:outline-none focus:border-black"
                  >
                    <option value="Receive">Receive</option>
                    <option value="Sale">Sale</option>
                  </select>
                </div>
                {pdfError && <p className="text-[10px] text-red-500 font-medium">{pdfError}</p>}
                <button
                  type="button"
                  onClick={handlePdfExport}
                  disabled={pdfLoading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm text-[11px] font-black tracking-widest bg-black text-white hover:opacity-90 disabled:opacity-50 transition"
                >
                  {pdfLoading ? "Exporting…" : "Export PDF"}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => { setFormError(""); setModalOpen(true); }}
            className="flex items-center gap-2 px-2 py-1.5 sm:px-4 rounded-md text-xs font-light tracking-widest bg-orange-500 text-white hover:opacity-90 active:scale-[0.97] transition shadow-sm"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">New Transaction</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      <StatsOverview stats={stats} />

      <div className="flex items-center gap-3">
        <TypeFilterSelect value={typeFilter} onChange={setTypeFilter} />
        <div className="ml-auto hidden sm:flex items-center gap-1 bg-slate-100 border border-black/10 rounded-sm p-1">
          {(["list", "grid"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              title={mode === "list" ? "List view" : "Grid view"}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase transition-all duration-150 ${
                viewMode === mode
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-700 hover:bg-white/60"
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
          onActionClick={handleActionClick}
          menuOpenId={menuOpenId}
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
        style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1, pointerEvents: "none" }}
      >
        {pendingExportItems.length > 0 && (
          <TransactionTemplate transaction={{ transaction_type: pendingExportType, items: pendingExportItems }} />
        )}
      </div>
    </div>
  );
};

export default TransactionsClient;
