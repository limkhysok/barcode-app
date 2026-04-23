"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/src/context/AuthContext";
import type { Product, ProductPayload } from "@/src/types/product.types";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/src/services/product.service";
import type { ProductFilters } from "@/src/services/product.service";
import type { PaginatedProducts, ProductStats } from "@/src/types/api.types";
import { type ApiError, getFieldError } from "@/src/types/error.types";

// Components
import { StatsOverview } from "./_components/StatsOverview";
import { ProductHeader } from "./_components/ProductHeader";
import { ProductsTable, type SortDir } from "./_components/ProductsTable";
import { ProductModal } from "./_components/ProductModal";
import { DeleteConfirmModal } from "./_components/DeleteConfirmModal";
import { ProductToolbar } from "./_components/ProductToolbar";
import { ProductViewModal } from "./_components/ProductViewModal";

const REORDER_PRESETS = new Set([5, 10, 15, 20]);

function getSortParam(field: string, dir: SortDir): string | undefined {
  if (!field || !dir) return undefined;
  return dir === "desc" ? `-${field}` : field;
}

function validateProductForm(form: ProductPayload): string {
  if (!form.product_name.trim()) return "Product name is required.";
  if (!form.barcode.trim()) return "Barcode is required.";
  if (!form.category) return "Category is required.";
  if (!form.supplier.trim()) return "Supplier is required.";
  if (form.cost_per_unit <= 0) return "Cost per unit must be greater than 0.";
  if (form.reorder_level < 1) return "Reorder level must be at least 1.";
  return "";
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

  const [viewTarget, setViewTarget] = useState<Product | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [sortField, setSortField] = useState<string>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
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

  const displayed = products;

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
    const validationError = validateProductForm(form);
    if (validationError) { setFormError(validationError); return; }
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
    } catch (err: unknown) {
      setSaving(false);
      const apiErr = err as ApiError;
      const data = apiErr?.response?.data;
      const status = apiErr?.response?.status;
      if (status === 409) {
        const msg = (data?.detail as string | undefined) ?? "A product with this barcode already exists.";
        setFormError(msg);
        toast.error("Duplicate Barcode", { description: msg });
      } else if (status === 404) {
        const msg = (data?.detail as string | undefined) ?? "This product no longer exists. Please refresh the page.";
        setFormError(msg);
        toast.error("Product Not Found", { description: msg });
      } else if (status === 400 && data) {
        const msg = getFieldError(data);
        setFormError(msg);
        toast.error("Validation Error", { description: msg });
      } else if (apiErr?.code === "ECONNABORTED" || !apiErr?.response) {
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
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const data = apiErr?.response?.data;
      const status = apiErr?.response?.status;
      if (status === 404) {
        setDeleteTarget(null);
        fetchProducts();
      } else if (status === 409) {
        toast.error("Cannot Delete Product", {
          description: (data?.detail as string | undefined) ?? "This product has linked transactions and cannot be removed.",
        });
      } else {
        toast.error("Delete Failed", { description: "Something went wrong. Please try again." });
      }
      setDeleting(false);
    }
  }

  return (
    <div className="px-4 py-5 sm:px-5 sm:py-5 space-y-3">

      <ProductHeader onNew={openCreate} />

      {/* ── Stats: Category Overview ── */}
      <StatsOverview stats={initialStats} products={products} />

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
      <div className="overflow-hidden ">
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
          onView={setViewTarget}
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

      {/* View Modal */}
      <ProductViewModal
        product={viewTarget}
        onClose={() => setViewTarget(null)}
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
