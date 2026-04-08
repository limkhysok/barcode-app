"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/src/context/AuthContext";
import type { Product, ProductPayload } from "@/src/types/product.types";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/src/services/product.service";
import type { ProductFilters } from "@/src/services/product.service";
import type { PaginatedProducts, ProductStats } from "@/src/types/api.types";

// Components
import { StatsOverview } from "./_components/StatsOverview";
import { ProductsTable, type SortDir } from "./_components/ProductsTable";
import { ProductModal } from "./_components/ProductModal";
import { DeleteConfirmModal } from "./_components/DeleteConfirmModal";
import { ProductToolbar } from "./_components/ProductToolbar";

const REORDER_PRESETS = new Set([5, 10, 15, 20]);

function getSortParam(costDir: SortDir, reorderDir: SortDir): string | undefined {
  if (costDir === "asc") return "cost_per_unit";
  if (costDir === "desc") return "-cost_per_unit";
  if (reorderDir === "asc") return "reorder_level";
  if (reorderDir === "desc") return "-reorder_level";
  return undefined;
}

function sortProducts(products: Product[], costDir: SortDir, reorderDir: SortDir): Product[] {
  if (!costDir && !reorderDir) return products;
  return [...products].sort((a, b) => {
    if (costDir) {
      const av = Number.parseFloat(a.cost_per_unit);
      const bv = Number.parseFloat(b.cost_per_unit);
      if (av !== bv) return costDir === "asc" ? av - bv : bv - av;
    }
    if (reorderDir) {
      const av = a.reorder_level;
      const bv = b.reorder_level;
      if (av !== bv) return reorderDir === "asc" ? av - bv : bv - av;
    }
    return 0;
  });
}

const emptyForm: ProductPayload = {
  barcode: "",
  product_name: "",
  category: "",
  cost_per_unit: 1,
  reorder_level: 1,
  supplier: "",
};

export default function ProductsClient({
  initialPaginated,
  initialStats,
}: Readonly<{
  initialPaginated: PaginatedProducts;
  initialStats: ProductStats | null;
}>) {
  const { role } = useAuth();
  const canEdit   = role === "boss" || role === "superadmin";
  const canDelete = role === "superadmin";

  const [paginated, setPaginated] = useState<PaginatedProducts>(initialPaginated);
  const products = paginated.results;

  const [stats] = useState<ProductStats | null>(initialStats);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [reorderCustom, setReorderCustom] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [costDir] = useState<SortDir>("");
  const [reorderDir, setReorderDir] = useState<SortDir>("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const filtersMounted = useRef(false);

  // Debounce API filter changes and re-fetch from page 1
  useEffect(() => {
    if (!filtersMounted.current) { filtersMounted.current = true; return; }
    const t = setTimeout(() => {
      const sorting = getSortParam(costDir, reorderDir);

      const filters: ProductFilters = {
        search: search.trim() || undefined,
        category: categoryFilter || undefined,
        ordering: sorting,
      };
      setLoading(true);
      setError("");
      getProducts(undefined, filters)
        .then(setPaginated)
        .catch(() => setError("Failed to load products."))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, categoryFilter, costDir, reorderDir]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setFiltersOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayed = useMemo(
    () => sortProducts(products, costDir, reorderDir),
    [products, costDir, reorderDir],
  );

  function buildFilters(): ProductFilters {
    const sorting = getSortParam(costDir, reorderDir);

    return {
      search: search.trim() || undefined,
      category: categoryFilter || undefined,
      ordering: sorting,
    };
  }

  function fetchProducts() {
    setLoading(true);
    setError("");
    getProducts(undefined, buildFilters())
      .then((data) => setPaginated(data))
      .catch(() => setError("Failed to load products."))
      .finally(() => setLoading(false));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setReorderCustom(false);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    const isCustom = !REORDER_PRESETS.has(product.reorder_level);
    setReorderCustom(isCustom);
    setForm({
      barcode: product.barcode,
      product_name: product.product_name,
      category: product.category,
      cost_per_unit: Number.parseFloat(product.cost_per_unit),
      reorder_level: product.reorder_level,
      supplier: product.supplier,
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        if (editing.id === undefined || editing.id === null) {
          setFormError("Cannot update: Product ID is missing or invalid.");
          setSaving(false);
          return;
        }
        await updateProduct(editing.id, form);
        toast.success("Product Updated", {
          description: `${form.product_name} has been saved successfully.`,
        });
      } else {
        await createProduct(form);
        toast.success("Product Created", {
          description: `${form.product_name} has been added to your catalog.`,
        });
      }
      setSaving(false);
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setSaving(false);
      const data = err?.response?.data;
      const status = err?.response?.status;
      if (status === 409) {
        const msg = data?.detail ?? "A product with this barcode already exists.";
        setFormError(msg);
        toast.error("Duplicate Barcode", { description: msg });
      } else if (status === 404) {
        const msg = data?.detail ?? "This product no longer exists. Please refresh the page.";
        setFormError(msg);
        toast.error("Product Not Found", { description: msg });
      } else if (status === 400 && data) {
        const firstKey = Object.keys(data)[0];
        const raw = data[firstKey];
        const msg = Array.isArray(raw) ? raw[0] : (raw ?? "Failed to save. Please check your inputs.");
        setFormError(msg);
        toast.error("Validation Error", { description: msg });
      } else if (err?.code === "ECONNABORTED" || !err?.response) {
        setFormError("Request timed out. Please try again.");
        toast.error("Connection Error", { description: "The server took too long to respond. Please try again." });
      } else {
        setFormError("Failed to save. Please check your inputs.");
        toast.error("Save Failed", { description: "Please check your inputs and try again." });
      }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      toast.success("Product Deleted", {
        description: `${deleteTarget.product_name} has been permanently removed.`,
      });
      setDeleteTarget(null);
      setDeleting(false);
      fetchProducts();
    } catch (err: any) {
      const data = err?.response?.data;
      const status = err?.response?.status;
      if (status === 404) {
        setDeleteTarget(null);
        fetchProducts();
      } else if (status === 409) {
        toast.error("Cannot Delete Product", {
          description: data?.detail ?? "This product has linked transactions and cannot be removed.",
        });
      } else {
        toast.error("Delete Failed", { description: "Something went wrong. Please try again." });
      }
      setDeleting(false);
    }
  }

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 space-y-8 bg-white min-h-screen">

      {/* ── Header: Command Center ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border border-gray-100 bg-white rounded-md p-3 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center shrink-0 shadow-2xl shadow-slate-950/20 group hover:scale-105 transition-transform duration-300">
            <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tighter leading-none">Catalog</h1>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Online</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">Product Database v2.4</p>
          </div>
        </div>

        <button onClick={openCreate}
          className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-orange-500 text-white hover:bg-orange-600 active:scale-95 transition-all duration-300 shadow-xl shadow-orange-500/25 border border-orange-400/20 group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">New Product</span>
        </button>
      </div>

      {/* ── Stats: Category Overview ── */}
      <StatsOverview stats={stats} products={products} />

      {/* ── Toolbar: Advanced Filters ── */}
      <ProductToolbar
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        reorderDir={reorderDir}
        setReorderDir={setReorderDir}
        search={search}
        setSearch={setSearch}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        filtersRef={filtersRef}
      />

      {/* Table */}
      <div className="rounded-xl border border-black overflow-hidden bg-white ">
        <ProductsTable
          loading={loading}
          error={error}
          displayed={displayed}
          products={products}
          costDir={costDir}
          reorderDir={reorderDir}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>

      {/* Add / Edit Modal */}
      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        form={form}
        setForm={setForm}
        reorderCustom={reorderCustom}
        setReorderCustom={setReorderCustom}
        saving={saving}
        formError={formError}
        onSave={handleSave}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDelete={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
