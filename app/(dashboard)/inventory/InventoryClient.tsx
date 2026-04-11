"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import type { InventoryRecord, InventoryPayload } from "@/src/types/inventory.types";
import { getInventory, createInventory, updateInventory, deleteInventory } from "@/src/services/inventory.service";
import { getProducts } from "@/src/services/product.service";
import type { PaginatedInventory, PaginatedProducts } from "@/src/types/api.types";

import { StatsOverview } from "./_components/StatsOverview";
import { InventoryTable } from "./_components/InventoryTable";
import { InventoryToolbar } from "./_components/InventoryToolbar";
import { InventoryModal } from "./_components/InventoryModal";
import { DeleteConfirmModal } from "./_components/DeleteConfirmModal";
import { FileDown, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";
// no lucide imports needed currently for this line if they are all SVGs

type QuantitySort = "asc" | "desc" | "";
type DateSort = "asc" | "desc" | "";
type StatusSort = "asc" | "desc" | "";

const emptyForm: InventoryPayload = {
  product: 0,
  site: "",
  location: "",
  quantity_on_hand: 0,
};

export default function InventoryClient({
  initialPaginatedRecords,
  initialPaginatedProducts,
  initialStats,
}: Readonly<{
  initialPaginatedRecords: PaginatedInventory;
  initialPaginatedProducts: PaginatedProducts;
  initialStats?: any;
}>) {
  const { role } = useAuth();
  const canEdit = role === "boss" || role === "superadmin";
  const canDelete = role === "superadmin";

  const [paginated, setPaginated] = useState<PaginatedInventory>(initialPaginatedRecords);
  const records = paginated.results;

  const [paginatedProducts, setPaginatedProducts] = useState<PaginatedProducts>(initialPaginatedProducts);
  const products = paginatedProducts.results;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // -- Filter / sort state --
  const [siteFilter, setSiteFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "Yes" | "No"
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState<string>("-updated_at");

  // Derive directions for the toolbar from a single source of truth: ordering
  const getSortDir = (field: string) => {
    if (!ordering.includes(field)) return "";
    return ordering.startsWith("-") ? "desc" : "asc";
  };

  const quantitySort = getSortDir("quantity_on_hand");
  const dateSort = getSortDir("updated_at");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setFiltersOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // -- Create / edit modal state --
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryRecord | null>(null);
  const [form, setForm] = useState<InventoryPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<InventoryRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // -- Export dropdown state --
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // -- Fetch logic: Reduced to manual reload only --
  function fetchInventory() {
    setLoading(true);
    setError("");

    getInventory()
      .then(setPaginated)
      .catch(() => setError("Failed to load inventory."))
      .finally(() => setLoading(false));
  }

  // No longer re-fetching on every state change. Data is managed locally.

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
    if (!form.product) { setFormError("PLEASE SELECT A PRODUCT"); return; }
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
      getProducts().then(setPaginatedProducts).catch(() => { });
    } catch {
      setFormError("FAILED TO SAVE. PLEASE VERIFY INPUTS");
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
      setError("FAILED TO DELETE RECORD");
    } finally {
      setDeleting(false);
    }
  }

  function handleExport(mode: "low" | "all") {
    setExportOpen(false);
    const list = mode === "low" ? records.filter(r => r.reorder_status === "Yes") : records;
    if (list.length === 0) {
      setError("NO RECORDS FOUND TO EXPORT");
      return;
    }

    const data = list.map(r => ({
      "Product ID": r.id || 0,
      "Product Name": r.product_details?.product_name || "N/A",
      "Barcode": r.product_details?.barcode || "N/A",
      "Site": r.site || "N/A",
      "Location": r.location || "N/A",
      "Reorder Level": r.product_details?.reorder_level ?? 0,
      "Quantity": r.quantity_on_hand ?? 0,
      "Status": r.reorder_status === "Yes" ? "LOW STOCK" : "NORMAL",
      "Report Date": new Date().toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    const sheetName = mode === "low" ? "Reorder Report" : "Inventory Snapshot";
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    const maxWidths = data.reduce((acc: any, row: any) => {
      Object.keys(row).forEach((key, i) => {
        const val = String(row[key]);
        const width = Math.max(acc[i] || 0, val.length, key.length);
        acc[i] = width;
      });
      return acc;
    }, []);
    ws['!cols'] = maxWidths.map((w: number) => ({ wch: w + 5 }));

    const fileName = mode === "low" ? `LowStock_Report_${new Date().toISOString().split('T')[0]}.xlsx` : `Inventory_Full_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  const siteOptions = useMemo(
    () => Array.from(new Set(records.map((r) => r.site))).sort((a, b) => a.localeCompare(b)),
    [records]
  );

  // -- Client-side Filtering & Sorting Logic --
  const displayed = useMemo(() => {
    let list = [...records];

    // 1. Search (Name/Barcode)
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(r =>
        (r.product_details?.product_name || "").toLowerCase().includes(s) ||
        (r.product_details?.barcode || "").toLowerCase().includes(s)
      );
    }

    // 2. Site Filter
    if (siteFilter) {
      list = list.filter(r => r.site === siteFilter);
    }

    // 2.5 Status Filter (Reorder)
    if (statusFilter) {
      list = list.filter(r => r.reorder_status === statusFilter);
    }

    // 3. Sorting
    if (ordering) {
      const isDesc = ordering.startsWith("-");
      const field = isDesc ? ordering.substring(1) : ordering;

      list.sort((a: any, b: any) => {
        let valA: any, valB: any;

        if (field === "product_name") {
          valA = (a.product_details?.product_name || "").toLowerCase();
          valB = (b.product_details?.product_name || "").toLowerCase();
        } else if (field === "updated_at") {
          valA = new Date(a.updated_at).getTime();
          valB = new Date(b.updated_at).getTime();
        } else {
          valA = a[field];
          valB = b[field];
        }

        if (valA < valB) return isDesc ? 1 : -1;
        if (valA > valB) return isDesc ? -1 : 1;
        return 0;
      });
    }

    return list;
  }, [records, search, siteFilter, statusFilter, ordering]);

  // Stats always reflect the CURRENTLY displayed/filtered view
  const stats = useMemo(() => {
    const total = displayed.length;
    const totalQty = displayed.reduce((s, r) => s + r.quantity_on_hand, 0);
    const needsReorder = displayed.filter((r) => r.reorder_status === "Yes").length;
    return { total, totalQty, needsReorder };
  }, [displayed]);

  function handleSort(colLabel: string, dir?: string) {
    const orderingFields: Record<string, string> = {
      '#': 'id',
      'Product': 'product_name',
      'Site': 'site',
      'Location': 'location',
      'Quantity': 'quantity_on_hand',
      'Status': 'reorder_status',
      'Order Date': 'updated_at',
      'Updated': 'updated_at',
    };
    const field = orderingFields[colLabel];
    if (!field) return;

    if (dir !== undefined) {
      if (dir === "") setOrdering("");
      else setOrdering((dir === "desc" ? "-" : "") + field);
      return;
    }

    // Toggle logic for table headers (direct click)
    let newOrdering = field;
    if (ordering === field) newOrdering = '-' + field;
    else if (ordering === '-' + field) newOrdering = "";
    setOrdering(newOrdering);
  }

  return (
    <div className="px-4 py-5 sm:px-5 sm:py-5 space-y-3">
      {/* ── Header: Command Center ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-[12px] font-black text-slate-950 uppercase tracking-[0.2em] leading-none">Inventory</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <div className="relative" ref={exportRef}>
              <button 
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center gap-2 px-3.5 py-1 rounded-sm text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer group"
              >
                <FileDown size={14} strokeWidth={3} className="text-slate-500 group-hover:text-slate-900" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown size={10} strokeWidth={3} className={`transition-transform duration-200 ${exportOpen ? 'rotate-180' : ''}`} />
              </button>

              {exportOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-sm shadow-xl z-60 py-1 animate-in fade-in slide-in-from-top-1">
                  <button 
                    onClick={() => handleExport("low")}
                    className="w-full text-left px-4 py-2 text-[10px] font-black text-red-500 hover:bg-red-50 uppercase tracking-widest transition-colors flex items-center justify-between"
                  >
                    <span>Low Stock Only</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  </button>
                  <button 
                    onClick={() => handleExport("all")}
                    className="w-full text-left px-4 py-2 text-[10px] font-black text-slate-600 hover:bg-slate-50 uppercase tracking-widest transition-colors"
                  >
                    All Records
                  </button>
                </div>
              )}
            </div>
          )}

          <button onClick={openCreate}
            className="flex items-center gap-2.5 px-3.5 py-1 sm:px-5 rounded-sm text-[11px] font-black uppercase tracking-wider bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.96] transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">New Record</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <StatsOverview stats={stats} />

      {/* Toolbar Section */}
      <InventoryToolbar
        siteFilter={siteFilter}
        setSiteFilter={setSiteFilter}
        siteOptions={siteOptions}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        quantitySort={quantitySort}
        setQuantitySort={(v) => handleSort("Quantity", v)}
        dateSort={dateSort}
        setDateSort={(v) => handleSort("Order Date", v)}
        search={search}
        setSearch={setSearch}
        setOrdering={setOrdering}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        filtersRef={filtersRef}
      />

      {/* Table Section */}
      <div className="overflow-hidden bg-white">
        <InventoryTable
          loading={loading}
          error={error}
          displayed={displayed}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          canEdit={canEdit}
          canDelete={canDelete}
          ordering={ordering}
          onSort={handleSort}
        />
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

      <DeleteConfirmModal
        target={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}

