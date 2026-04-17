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
import { toast } from "sonner";

type SortDir = "asc" | "desc" | "";

const emptyForm: InventoryPayload = {
  product: 0,
  site: "",
  location: "",
  quantity_on_hand: 0,
};

function validateInventoryForm(form: InventoryPayload): string {
  if (!form.product || form.product <= 0) return "Please select a product.";
  if (!form.site.trim()) return "Site is required.";
  if (form.quantity_on_hand < 0) return "Quantity on hand cannot be negative.";
  return "";
}

export default function InventoryClient({
  initialPaginatedRecords,
  initialPaginatedProducts,
}: Readonly<{
  initialPaginatedRecords: PaginatedInventory;
  initialPaginatedProducts: PaginatedProducts;
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
  const getSortDir = (field: string): SortDir => {
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
    const validationError = validateInventoryForm(form);
    if (validationError) { setFormError(validationError); return; }
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await updateInventory(editing.id, form);
        toast.success("Record Updated", { description: "Inventory record has been saved." });
      } else {
        await createInventory(form);
        toast.success("Record Created", { description: "New inventory record has been added." });
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
      toast.success("Record Deleted", { description: "Inventory record has been removed." });
    } catch {
      toast.error("Delete Failed", { description: "Failed to delete record. Please try again." });
    } finally {
      setDeleting(false);
    }
  }

  function handleExport(mode: "no_stock" | "low" | "good" | "all") {
    setExportOpen(false);

    let list = records;
    if (mode === "no_stock") list = records.filter(r => r.quantity_on_hand === 0);
    else if (mode === "low") list = records.filter(r => r.quantity_on_hand > 0 && r.reorder_status === "Yes");
    else if (mode === "good") list = records.filter(r => r.quantity_on_hand > 0 && r.reorder_status === "No");

    if (list.length === 0) {
      setError("NO RECORDS FOUND TO EXPORT");
      return;
    }

    function getStatus(r: typeof records[number]) {
      if (r.quantity_on_hand === 0) return "NO STOCK";
      if (r.reorder_status === "Yes") return "LOW";
      return "GOOD";
    }

    const data = list.map(r => ({
      "Product ID": r.id || 0,
      "Product Name": r.product_details?.product_name || "N/A",
      "Barcode": r.product_details?.barcode || "N/A",
      "Site": r.site || "N/A",
      "Location": r.location || "N/A",
      "Reorder Level": r.product_details?.reorder_level ?? 0,
      "Quantity": r.quantity_on_hand ?? 0,
      "Status": getStatus(r),
      "Report Date": new Date().toLocaleDateString()
    }));

    const sheetNames = { no_stock: "No Stock Report", low: "Low Stock Report", good: "Good Stock Report", all: "Inventory Snapshot" };
    const fileNames = { no_stock: "NoStock", low: "LowStock", good: "GoodStock", all: "Inventory_Full" };
    const today = new Date().toISOString().split('T')[0];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetNames[mode]);

    type ExportRow = (typeof data)[number];
    const keys = Object.keys(data[0]) as (keyof ExportRow)[];
    const maxWidths = keys.map((key) =>
      Math.max(key.length, ...data.map((row) => String(row[key]).length))
    );
    ws['!cols'] = maxWidths.map((w) => ({ wch: w + 5 }));

    XLSX.writeFile(wb, `${fileNames[mode]}_Report_${today}.xlsx`);
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
    if (statusFilter === "no_stock") {
      list = list.filter(r => r.quantity_on_hand === 0);
    } else if (statusFilter) {
      list = list.filter(r => r.quantity_on_hand > 0 && r.reorder_status === statusFilter);
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
      {/* HEADER SECTION - Separate Mobile and Desktop Blocks */}

      {/* Mobile-Only Header */}
      <div className="sm:hidden flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-[14px] font-black text-slate-950 uppercase tracking-[0.2em] leading-none">Inventory</h1>
          <p className="text-[9px] text-orange-500 font-bold uppercase mt-1">Mobile Dashboard</p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  exportOpen ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-200 active:bg-gray-50"
                }`}
              >
                <FileDown size={14} strokeWidth={3} className={exportOpen ? "text-white" : "text-slate-400"} />
                <ChevronDown size={10} strokeWidth={3} className={`transition-transform duration-200 ${exportOpen ? 'rotate-180' : ''}`} />
              </button>

              {exportOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-sm shadow-2xl z-60 py-1 animate-in fade-in slide-in-from-top-2">
                  <button
                    onClick={() => handleExport("no_stock")}
                    className="w-full text-left px-4 py-3 text-[10px] font-black text-red-500 hover:bg-red-50 uppercase tracking-widest transition-colors flex items-center justify-between"
                  >
                    <span>No Stock</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  </button>
                  <button
                    onClick={() => handleExport("low")}
                    className="w-full text-left px-4 py-3 text-[10px] font-black text-yellow-600 hover:bg-yellow-50 uppercase tracking-widest transition-colors flex items-center justify-between border-t border-slate-50"
                  >
                    <span>Low Stock</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  </button>
                  <button
                    onClick={() => handleExport("good")}
                    className="w-full text-left px-4 py-3 text-[10px] font-black text-green-600 hover:bg-green-50 uppercase tracking-widest transition-colors flex items-center justify-between border-t border-slate-50"
                  >
                    <span>Good Stock</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  </button>
                  <button
                    onClick={() => handleExport("all")}
                    className="w-full text-left px-4 py-3 text-[10px] font-black text-slate-600 hover:bg-slate-50 uppercase tracking-widest transition-colors border-t border-slate-100"
                  >
                    Full Inventory
                  </button>
                </div>
              )}
            </div>
          )}

          <button onClick={openCreate}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-[11px] font-black uppercase tracking-wider bg-orange-500 text-white active:scale-[0.96] transition-all cursor-pointer"
          >
            New
          </button>
        </div>
      </div>

      {/* Desktop-Only Header */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col border-l-4 border-orange-500 pl-4">
            <h1 className="text-[16px] font-black text-slate-950 uppercase tracking-[0.25em] leading-tight">Inventory</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Command Center / Operations</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canEdit && (
            <div className="relative" ref={exportRef}>
              <button 
                onClick={() => setExportOpen(!exportOpen)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  exportOpen ? "bg-black text-white border-black" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <FileDown size={14} strokeWidth={3} className={exportOpen ? "text-white" : "text-slate-400"} />
                <span>Export Report</span>
                <ChevronDown size={10} strokeWidth={3} className={`transition-transform duration-200 ${exportOpen ? 'rotate-180' : ''}`} />
              </button>

              {exportOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-slate-900/10 rounded-sm shadow-2xl z-60 py-1 animate-in fade-in slide-in-from-top-2">
                  <button
                    onClick={() => handleExport("no_stock")}
                    className="w-full text-left px-5 py-3 text-[10px] font-black text-red-500 hover:bg-red-50 uppercase tracking-widest transition-colors flex items-center justify-between"
                  >
                    <span>No Stock</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  </button>
                  <button
                    onClick={() => handleExport("low")}
                    className="w-full text-left px-5 py-3 text-[10px] font-black text-yellow-600 hover:bg-yellow-50 uppercase tracking-widest transition-colors flex items-center justify-between border-t border-slate-50"
                  >
                    <span>Low Stock</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  </button>
                  <button
                    onClick={() => handleExport("good")}
                    className="w-full text-left px-5 py-3 text-[10px] font-black text-green-600 hover:bg-green-50 uppercase tracking-widest transition-colors flex items-center justify-between border-t border-slate-50"
                  >
                    <span>Good Stock</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  </button>
                  <button
                    onClick={() => handleExport("all")}
                    className="w-full text-left px-5 py-3 text-[10px] font-black text-slate-600 hover:bg-slate-50 uppercase tracking-widest transition-colors border-t border-slate-100"
                  >
                    Full Inventory
                  </button>
                </div>
              )}
            </div>
          )}

          <button onClick={openCreate}
            className="flex items-center gap-2.5 px-5 py-1.5 rounded-sm text-[11px] font-black uppercase tracking-wider bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.96] transition-all cursor-pointer shadow-lg shadow-orange-500/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>New Record</span>
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

