"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import type { InventoryRecord, InventoryPayload } from "@/src/types/inventory.types";
import { getInventory, getInventoryStats, createInventory, updateInventory, deleteInventory } from "@/src/services/inventory.service";
import { getProducts } from "@/src/services/product.service";
import type { PaginatedInventory, PaginatedProducts } from "@/src/types/api.types";

import { StatsOverview } from "./_components/StatsOverview";
import { InventoryTable } from "./_components/InventoryTable";
import { InventoryToolbar } from "./_components/InventoryToolbar";
import { InventoryModal } from "./_components/InventoryModal";
import { DeleteConfirmModal } from "./_components/DeleteConfirmModal";
import { Plus, LayoutGrid } from "lucide-react";

type QuantitySort = "asc" | "desc" | "";
type DateSort = "asc" | "desc" | "";

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
  const [statsData, setStatsData] = useState<any>(initialStats);

  useEffect(() => {
    getInventoryStats().then(setStatsData).catch(() => { });
  }, []);

  // -- Filter / sort state --
  const [siteFilter, setSiteFilter] = useState("");
  const [quantitySort, setQuantitySort] = useState<QuantitySort>("");
  const [dateSort, setDateSort] = useState<DateSort>("");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState<string>("-updated_at");

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

  // -- Delete modal state --
  const [deleteTarget, setDeleteTarget] = useState<InventoryRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // -- Fetch logic --
  function fetchInventory(overrideOrdering?: string) {
    setLoading(true);
    setError("");

    getInventory({
      search: search || undefined,
      site: siteFilter || undefined,
      ordering: overrideOrdering ?? ordering,
    })
      .then(setPaginated)
      .catch(() => setError("Failed to load inventory."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchInventory(), 300);
    return () => clearTimeout(timer);
  }, [search, siteFilter, quantitySort, dateSort]);

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
      getInventoryStats().then(setStatsData).catch(() => { });
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
      getInventoryStats().then(setStatsData).catch(() => { });
    } catch {
      setError("FAILED TO DELETE RECORD");
    } finally {
      setDeleting(false);
    }
  }

  const siteOptions = useMemo(
    () => Array.from(new Set(records.map((r) => r.site))).sort((a, b) => a.localeCompare(b)),
    [records]
  );

  const stats = useMemo(() => {
    if (statsData) {
      return {
        total: statsData.total_records ?? 0,
        totalQty: statsData.total_quantity_on_hand ?? 0,
        needsReorder: statsData.needs_reorder ?? 0,
      };
    }
    const totalQty = records.reduce((s, r) => s + r.quantity_on_hand, 0);
    const needsReorder = records.filter((r) => r.reorder_status === "Yes").length;
    return { total: paginated.count ?? 0, totalQty, needsReorder };
  }, [records, statsData, paginated.count]);

  const displayed = records; // Pagination handled by API, site/search too

  function handleSort(colLabel: string) {
    const orderingFields: Record<string, string> = {
      '#': 'id',
      'Product': 'product_name',
      'Site': 'site',
      'Location': 'location',
      'Quantity': 'quantity_on_hand',
      'Order Date': 'updated_at',
    };
    const field = orderingFields[colLabel];
    if (!field) return;
    let newOrdering = field;
    if (ordering === field) newOrdering = '-' + field;
    else if (ordering === '-' + field) newOrdering = field;
    setOrdering(newOrdering);
    fetchInventory(newOrdering);
  }

  return (
    <div className="px-4 py-5 sm:px-5 sm:py-5 space-y-3">
      {/* ── Header: Command Center ── */}
      <div className="flex items-center justify-between border border-gray-200 bg-white rounded-md py-3 px-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <LayoutGrid size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-950 uppercase tracking-tighter leading-none">Inventory Center</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Global Stock Ledger • {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-slate-950 text-white text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-md"
        >
          <Plus size={16} strokeWidth={3} />
          <span className="hidden sm:inline">New Record</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Stats Section */}
      <StatsOverview stats={stats} />

      {/* Toolbar Section */}
      <InventoryToolbar
        siteFilter={siteFilter}
        setSiteFilter={setSiteFilter}
        siteOptions={siteOptions}
        quantitySort={quantitySort}
        setQuantitySort={(v) => setQuantitySort(v as QuantitySort)}
        dateSort={dateSort}
        setDateSort={(v) => setDateSort(v as DateSort)}
        search={search}
        setSearch={setSearch}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        filtersRef={filtersRef}
      />

      {/* Table Section */}
      <div className="rounded-sm border border-gray-100 overflow-hidden bg-white shadow-sm">
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

