"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Transaction, TransactionPayload } from "@/src/types/transaction.types";
import type { InventoryRecord } from "@/src/types/inventory.types";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getTransactionStats, type TransactionStats } from "@/src/services/transaction.service";
import { getInventory } from "@/src/services/inventory.service";
import type { PaginatedTransactions, PaginatedInventory } from "@/src/types/api.types";
import TransactionTemplate from "@/src/components/features/export/TransactionTemplate";
type TxTypeFilter = "" | "Receive" | "Sale";
type TemplateItem = { barcode: string; product_name: string; unit: string; quantity: number };
import TypeFilterSelect from "./_components/TypeFilterSelect";
import StatsOverview from "./_components/StatsOverview";
import TransactionsTable from "./_components/TransactionsTable";
import {
  NewTransactionModal,
  EditTransactionModal,
  ViewTransactionModal,
  DeleteConfirmModal,
} from "./_components/TransactionsModal";
import PageSizeSelect from "./_components/PageSizeSelect";

function waitTwoFrames(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

type TransactionsClientProps = Readonly<{
  initialPaginatedTransactions: PaginatedTransactions;
  initialPaginatedInventory: PaginatedInventory;
  initialStats: TransactionStats | null;
}>;

const TransactionsClient: React.FC<TransactionsClientProps> = ({
  initialPaginatedTransactions,
  initialPaginatedInventory,
  initialStats,
}) => {
  const [paginated, setPaginated] = useState<PaginatedTransactions>(initialPaginatedTransactions);
  const transactions = paginated.results;

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

  const [pageSize, setPageSize] = useState<string | number>(20);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    if (menuOpenId === null) return;
    function onScroll() { setMenuOpenId(null); }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [menuOpenId]);

  useEffect(() => {
    fetchAll();
  }, [typeFilter, pageSize]);

  function fetchAll() {
    setLoading(true);
    setError("");
    Promise.all([
      getTransactions({
        type: typeFilter || undefined,
        page_size: pageSize === "all" ? 1000 : pageSize,
        ordering: "-transaction_date",
      }),
      getTransactionStats(),
    ])
      .then(([newPaginated, newStats]) => {
        setPaginated(newPaginated);
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


  const displayed = useMemo(() => {
    if (!typeFilter) return transactions;
    return transactions.filter((t) => t.transaction_type === typeFilter);
  }, [transactions, typeFilter]);

  return (
    <div className="px-4 py-5 sm:px-5 sm:py-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-light text-gray-900">Transactions</h1>
          <p className="text-[11px] text-gray-700 font-medium" suppressHydrationWarning>
            {new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Phnom_Penh" })}
          </p>
        </div>
        <button
          onClick={() => { setFormError(""); setModalOpen(true); }}
          className="flex items-center gap-2 px-2 py-1.5 sm:px-4 rounded-lg text-xs font-light tracking-widest bg-orange-500 text-white hover:opacity-90 active:scale-[0.97] transition shadow-sm"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">New Transaction</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      <StatsOverview stats={stats} />

      <div className="flex items-center gap-3">
        <TypeFilterSelect value={typeFilter} onChange={setTypeFilter} />
        <PageSizeSelect value={pageSize} onChange={setPageSize} />
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
            Showing <span className="font-bold text-gray-600">{transactions.length}</span> of{" "}
            <span className="font-bold text-gray-600">{paginated.count}</span> records
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
              <button type="button" onClick={() => { setEditTarget(t); setMenuOpenId(null); }}
                className="w-full text-left px-4 py-2 text-[12px] font-black text-gray-700 hover:bg-slate-50 transition">Edit</button>
              <button type="button" onClick={() => { handlePrint(t); setMenuOpenId(null); }}
                className="w-full text-left px-4 py-2 text-[12px] font-black text-gray-700 hover:bg-slate-50 transition">Print</button>
              <button type="button" onClick={() => { setDeleteTarget(t); setMenuOpenId(null); }}
                className="w-full text-left px-4 py-2 text-[12px] font-black text-red-500 hover:bg-red-50 transition">Delete</button>
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
