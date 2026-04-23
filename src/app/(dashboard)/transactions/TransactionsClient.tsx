"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Transaction, TransactionPayload } from "@/src/types/transaction.types";
import type { InventoryRecord } from "@/src/types/inventory.types";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getTransactionStats, type TransactionStats } from "@/src/services/transaction.service";
import { getInventory } from "@/src/services/inventory.service";
import type { PaginatedInventory } from "@/src/types/api.types";
import TransactionTemplate from "@/src/components/features/export/TransactionTemplate";
type TxTypeFilter = "" | "Receive" | "Sale";
type TemplateItem = { barcode: string; product_name: string; unit: string; quantity: number };
import { useAuth } from "@/src/context/AuthContext";
import { TransactionsToolbar } from "./_components/TransactionsToolbar";
import StatsOverview from "./_components/StatsOverview";
import TransactionsTable from "./_components/TransactionsTable";
import {
  NewTransactionModal,
  EditTransactionModal,
  ViewTransactionModal,
  DeleteConfirmModal,
} from "./_components/TransactionsModal";
import { TransactionsHeader } from "./_components/TransactionsHeader";

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
  const [dateFilter, setDateFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("-transaction_date");
  const [search, setSearch] = useState("");

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
  const pdfAutoDate = true;
  const [pdfDate, setPdfDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pdfType, setPdfType] = useState<"Receive" | "Sale">("Receive");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const pdfPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (pdfPanelRef.current && !pdfPanelRef.current.contains(target)) {
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

  const fetchAll = useCallback(() => {
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
  }, [typeFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
      URL.revokeObjectURL(url);
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
        const templateItems: TemplateItem[] = payload.items.map((i) => {
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
    const printItems: TemplateItem[] = t.items.map((item) => {
      const rec = inventory.find((r: InventoryRecord) => r.id === item.inventory);
      return {
        barcode: rec?.product_details.barcode ?? "",
        product_name: item.product_name,
        unit: "Pcs",
        quantity: Math.abs(item.quantity),
      };
    });
    setMenuOpenId(null);
    await exportTemplateAsPdf(printItems, t.transaction_type);
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

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const idMatch = t.id.toString().includes(q);
        const userMatch = t.performed_by_username.toLowerCase().includes(q);
        const itemMatch = t.items.some(i => i.product_name.toLowerCase().includes(q));
        return idMatch || userMatch || itemMatch;
      });
    }

    // Filter by Type
    if (typeFilter) {
      list = list.filter((t) => t.transaction_type === typeFilter);
    }

    // Filter by Date
    if (dateFilter) {
      const now = new Date();
      if (dateFilter === "today") {
        const todayStr = now.toISOString().slice(0, 10);
        list = list.filter((t) => t.transaction_date.startsWith(todayStr));
      } else if (dateFilter === "yesterday") {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        const yestStr = yest.toISOString().slice(0, 10);
        list = list.filter((t) => t.transaction_date.startsWith(yestStr));
      } else if (dateFilter === "this_week") {
        const limit = new Date(now);
        limit.setDate(limit.getDate() - 7);
        limit.setHours(0, 0, 0, 0);
        list = list.filter((t) => new Date(t.transaction_date) >= limit);
      } else if (dateFilter === "this_month") {
        const limit = new Date(now);
        limit.setMonth(limit.getMonth() - 1);
        limit.setHours(0, 0, 0, 0);
        list = list.filter((t) => new Date(t.transaction_date) >= limit);
      } else if (dateFilter === "7d" || dateFilter === "30d") {
        const days = dateFilter === "7d" ? 7 : 30;
        const limit = new Date();
        limit.setDate(limit.getDate() - days);
        limit.setHours(0, 0, 0, 0);
        list = list.filter((t) => new Date(t.transaction_date) >= limit);
      } else {
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
      {/* HEADER SECTION - Separate Mobile and Desktop Blocks */}

      <TransactionsHeader
        onNew={() => { setFormError(""); setModalOpen(true); }}
        pdfDate={pdfDate}
        setPdfDate={setPdfDate}
        pdfType={pdfType}
        setPdfType={setPdfType}
        onExportPdf={handlePdfExport}
        pdfLoading={pdfLoading}
        pdfError={pdfError}
        pdfPanelOpen={pdfPanelOpen}
        setPdfPanelOpen={setPdfPanelOpen}
        pdfPanelRef={pdfPanelRef}
      />

      <StatsOverview stats={stats} />

      <div className="py-3">
        <TransactionsToolbar
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter as (v: string) => void}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          search={search}
          setSearch={setSearch}
          totalResults={displayed.length}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>

      <div className=" overflow-hidden">
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
          ordering={sortBy}
          onSort={setSortBy}
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
            <button
              type="button"
              className="fixed inset-0 z-9998 bg-transparent cursor-default w-full h-full border-none outline-none"
              onClick={() => setMenuOpenId(null)}
              aria-label="Close menu"
            />
            <div
              style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
              className="bg-white border border-slate-950/10 rounded-sm shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 min-w-32"
            >
              <button type="button" onClick={() => { setViewTarget(t); setMenuOpenId(null); }}
                className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-2.5">
                <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                View Details
              </button>
              {canEdit && (
                <button type="button" onClick={() => { setEditTarget(t); setMenuOpenId(null); }}
                  className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-2.5">
                  <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                  Edit
                </button>
              )}
              <button type="button" onClick={() => { handlePrint(t); setMenuOpenId(null); }}
                className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-2.5">
                <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 3.99A.75.75 0 017.5 3.75h9a.75.75 0 01.75.75v3h-10.5v-3zM3 16.25v-3a3 3 0 013-3h12a3 3 0 013 3v3a.75.75 0 01-.75.75H18v3.75a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V17H3.75a.75.75 0 01-.75-.75zM9 15.75v3h6v-3H9z" /></svg>
                Print PDF
              </button>
              {canDelete && (
                <div className="border-t border-slate-50 mt-1 pt-1">
                  <button type="button" onClick={() => { setDeleteTarget(t); setMenuOpenId(null); }}
                    className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2.5">
                    <svg className="w-3.5 h-3.5 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" /></svg>
                    Delete
                  </button>
                </div>
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
