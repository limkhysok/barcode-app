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
    setMenuPos({ top: r.bottom + 4, left: r.right - 128 });
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

  const handleDirectExport = async (t: Transaction) => {
    const items: TemplateItem[] = t.items.map((item) => {
      const rec = inventory.find((r) => r.id === item.inventory);
      return {
        barcode: rec?.product_details.barcode ?? "",
        product_name: item.product_name,
        unit: "Pcs",
        quantity: item.quantity,
      };
    });
    exportTemplateAsPdf(items, t.transaction_type);
  };

  const displayed = useMemo(() => {
    if (!typeFilter) return transactions;
    return transactions.filter((t) => t.transaction_type === typeFilter);
  }, [transactions, typeFilter]);

  return (
    <div className="px-4 py-5 sm:px-5 sm:py-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">

          <h1 className="text-xl font-light text-gray-900">Transactions</h1>
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

      <div className="flex items-center gap-2.5">
        <TypeFilterSelect value={typeFilter} onChange={setTypeFilter} />
        <PageSizeSelect value={pageSize} onChange={setPageSize} />
      </div>

      <div className="rounded-sm border border-black overflow-hidden bg-white">
        <TransactionsTable
          displayed={displayed}
          loading={loading}
          error={error}
          onActionClick={handleActionClick}
          menuOpenId={menuOpenId}
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
              className="bg-white border border-black rounded-sm shadow-2xl py-1.5 w-32 overflow-hidden"
            >
              <button type="button" onClick={() => { setViewTarget(t); setMenuOpenId(null); }}
                className="w-full text-left px-4 py-2 text-xs font-bold tracking-widest uppercase text-gray-600 hover:bg-slate-50 transition">View</button>
              <button type="button" onClick={() => { setEditTarget(t); setMenuOpenId(null); }}
                className="w-full text-left px-4 py-2 text-xs font-bold tracking-widest uppercase text-gray-600 hover:bg-slate-50 transition">Edit</button>
              <button type="button" onClick={() => { handleDirectExport(t); setMenuOpenId(null); }}
                className="w-full text-left px-4 py-2 text-xs font-bold tracking-widest uppercase text-gray-600 hover:bg-slate-50 transition">Export</button>
              <button type="button" onClick={() => handlePrint(t)}
                className="w-full text-left px-4 py-2 text-xs font-bold tracking-widest uppercase text-blue-600 hover:bg-blue-50 transition">Print</button>
              <div className="mx-3 my-1 border-t border-black" />
              <button type="button" onClick={() => { setDeleteTarget(t); setMenuOpenId(null); }}
                className="w-full text-left px-4 py-2 text-xs font-bold tracking-widest uppercase text-red-500 hover:bg-red-50 transition">Delete</button>
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

      <ViewTransactionModal viewTarget={viewTarget} onClose={() => setViewTarget(null)} />

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
