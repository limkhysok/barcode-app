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
import { InventoryHeader } from "./_components/InventoryHeader";
import { InventoryDetailModal } from "./_components/InventoryDetailModal";
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
  const [statusFilter, setStatusFilter] = useState(""); // "" | "No" | "LOW" | "no_stock"
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

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const [deleteTarget, setDeleteTarget] = useState<InventoryRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // -- View detail state --
  const [detailTarget, setDetailTarget] = useState<InventoryRecord | null>(null);

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

  function openView(r: InventoryRecord) {
    setDetailTarget(r);
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
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setFormError("AN INVENTORY RECORD FOR THIS PRODUCT, SITE, AND LOCATION ALREADY EXISTS.");
      } else {
        setFormError("FAILED TO SAVE. PLEASE VERIFY INPUTS");
      }
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
    else if (mode === "low") list = records.filter(r => r.quantity_on_hand > 0 && r.reorder_status === "LOW");
    else if (mode === "good") list = records.filter(r => r.quantity_on_hand > 0 && r.reorder_status === "No");

    if (list.length === 0) {
      setError("NO RECORDS FOUND TO EXPORT");
      return;
    }

    function getStatus(r: typeof records[number]) {
      if (r.quantity_on_hand === 0) return "NO STOCK";
      if (r.reorder_status === "LOW") return "LOW";
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
    const needsReorder = displayed.filter((r) => r.reorder_status !== "No").length;
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
      <InventoryHeader
        onNew={openCreate}
        canEdit={canEdit}
        exportOpen={exportOpen}
        setExportOpen={setExportOpen}
        exportRef={exportRef}
        onExport={handleExport}
      />

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
        totalResults={stats.total}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        filtersRef={filtersRef}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Table Section */}
      <div className="overflow-hidden bg-white">
        <InventoryTable
          loading={loading}
          error={error}
          displayed={displayed}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onView={openView}
          canEdit={canEdit}
          canDelete={canDelete}
          ordering={ordering}
          onSort={handleSort}
          viewMode={viewMode}
        />
      </div>

      {/* Modals */}
      <InventoryDetailModal
        open={!!detailTarget}
        record={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
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

