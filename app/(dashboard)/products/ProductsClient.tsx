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

function getSortParam(field: string, dir: SortDir): string | undefined {
  if (!field || !dir) return undefined;
  return dir === "desc" ? `-${field}` : field;
}

function sortProducts(products: Product[], field: string, dir: SortDir): Product[] {
  if (!field || !dir) return products;
  return [...products].sort((a, b) => {
    let av = (a as any)[field];
    let bv = (b as any)[field];

    if (field === "cost_per_unit") {
      av = Number.parseFloat(av);
      bv = Number.parseFloat(bv);
    }

    if (typeof av === "string" && typeof bv === "string") {
      const comp = av.localeCompare(bv);
      return dir === "asc" ? comp : -comp;
    }

    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
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
  const canEdit = role === "boss" || role === "superadmin";
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

  // Filter States
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [sortField, setSortField] = useState<string>("product_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Dynamic Options (from all products)
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))).sort((a, b) => a.localeCompare(b)), [products]);
  const suppliers = useMemo(() => Array.from(new Set(products.map(p => p.supplier))).sort((a, b) => a.localeCompare(b)), [products]);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const filtersMounted = useRef(false);

  function buildFilters(): ProductFilters {
    const ordering = getSortParam(sortField, sortDir);
    return {
      search: search.trim() || undefined,
      category: categoryFilter || undefined,
      supplier: supplierFilter || undefined,
      ordering,
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

  // Debounce API filter changes
  useEffect(() => {
    if (!filtersMounted.current) { filtersMounted.current = true; return; }
    const t = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(t);
  }, [search, categoryFilter, supplierFilter, sortField, sortDir]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setFiltersOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayed = useMemo(
    () => sortProducts(products, sortField, sortDir),
    [products, sortField, sortDir],
  );

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
      product_picture: product.product_picture,
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
    <div className="px-4 py-5 sm:px-5 sm:py-5 space-y-3">

      {/* HEADER SECTION - Separate Mobile and Desktop Blocks */}

      {/* Mobile-Only Header */}
      <div className="sm:hidden flex flex-row gap-4 justify-between h-10">
        <div className="flex items-center">
          <div className="flex flex-col">
            <h1 className="text-[14px] font-black text-slate-950 uppercase tracking-[0.2em] leading-none">Product</h1>
            <p className="text-[9px] text-orange-500 font-bold uppercase mt-1">Mobile Dashboard</p>
          </div>
        </div>

        <div className="flex items-center">
          <button
            onClick={openCreate}
            className="px-5 py-1.5 rounded-sm text-[11px] font-black uppercase tracking-wider bg-orange-500 text-white active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Desktop-Only Header */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col border-l-4 border-orange-500 pl-4">
            <h1 className="text-[16px] font-black text-slate-950 uppercase tracking-[0.25em] leading-tight">Product</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Command Center / Catalog</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="flex items-center gap-2.5 px-5 py-2 rounded-sm text-[11px] font-black uppercase tracking-wider bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.96] transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* ── Stats: Category Overview ── */}
      <StatsOverview stats={stats} products={products} />

      {/* ── Toolbar: Advanced Filters ── */}
      <ProductToolbar
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        supplierFilter={supplierFilter}
        setSupplierFilter={setSupplierFilter}
        sortField={sortField}
        setSortField={setSortField}
        sortDir={sortDir}
        setSortDir={setSortDir}
        search={search}
        setSearch={setSearch}
        categories={categories}
        suppliers={suppliers}
        totalResults={paginated.count}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        filtersRef={filtersRef}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Table */}
      <div className="overflow-hidden bg-white">
        <ProductsTable
          loading={loading}
          error={error}
          displayed={displayed}
          products={products}
          sortField={sortField}
          setSortField={setSortField}
          sortDir={sortDir}
          setSortDir={setSortDir}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          canEdit={canEdit}
          canDelete={canDelete}
          viewMode={viewMode}
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
