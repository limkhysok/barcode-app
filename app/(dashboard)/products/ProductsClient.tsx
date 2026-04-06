"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/src/context/AuthContext";
import type { Product, ProductPayload } from "@/src/types/product.types";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/src/services/product.service";
import type { ProductFilters } from "@/src/services/product.service";
import type { PaginatedProducts, ProductStats } from "@/src/types/api.types";
import { CustomSelect } from "@/src/components/ui/CustomSelect";

const REORDER_PRESETS = new Set([5, 10, 15, 20]);

type SortDir = "asc" | "desc" | "";

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

function totalCost(list: Product[]): number {
  return list.reduce((s, p) => s + Number.parseFloat(p.cost_per_unit), 0);
}



const emptyForm: ProductPayload = {
  barcode: "",
  product_name: "",
  category: "",
  cost_per_unit: 1,
  reorder_level: 1,
  supplier: "",
};

const inputCls =
  "w-full px-2 py-1 rounded-md border border-black text-[13px] text-gray-800 placeholder:text-gray-300 outline-none focus:ring-2 focus:border-transparent bg-gray-50 focus:bg-white transition";



function Field({ label, id, type = "text", value, onChange, placeholder, disabled }: Readonly<{
  label: string; id: string; type?: string;
  value: string | number; onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400">
        {label}
        {disabled && <span className="ml-1 normal-case tracking-normal font-normal text-gray-300">(locked)</span>}
      </label>
      <input
        id={id} type={type} placeholder={placeholder} value={value} required={!disabled} disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />
    </div>
  );
}

function ProductTable({ loading, error, displayed, products, costDir, reorderDir, onEdit, onDelete, canEdit, canDelete }: Readonly<{
  loading: boolean; error: string;
  displayed: Product[]; products: Product[];
  costDir: SortDir; reorderDir: SortDir;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  canEdit: boolean;
  canDelete: boolean;
}>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#FA4900", borderTopColor: "transparent" }} />
      </div>
    );
  }
  if (error) return <p className="text-center py-20 text-sm text-red-400">{error}</p>;
  if (displayed.length === 0) {
    const msg = products.length === 0 ? "No products yet. Add your first one." : "No products match your search.";
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
        <p className="text-sm font-medium">{msg}</p>
      </div>
    );
  }
  return (
    <>
      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-black border-y border-black bg-white">
        {displayed.map((p, idx) => {
          return (
            <div key={p.id ?? idx} className="px-3 py-2.5 bg-white">
              {/* Row 1: Header - ID + Category + Name + Actions */}
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-50">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black text-white bg-black px-1.5 py-0.5 rounded-sm shrink-0">#{p.id}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md truncate">{p.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Name:</span>
                    <p className="font-black text-gray-900 text-[11px] leading-snug truncate uppercase tracking-tighter">{p.product_name}</p>
                  </div>
                </div>
                <div className="flex items-center -mr-1">
                  {canEdit && (
                    <button onClick={() => onEdit(p)} className="p-1 px-1.5 rounded-lg text-gray-300 hover:text-gray-900 transition-colors active:scale-95" title="Edit">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => onDelete(p)} className="p-1 px-1.5 rounded-lg text-gray-300 hover:text-red-500 transition-colors active:scale-95" title="Delete">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Metadata - Supplier + Barcode */}
              <div className="flex items-center gap-3 mt-2 px-1 py-1 bg-slate-50/70 border border-slate-100/50 rounded-lg text-[10px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-1.5 min-w-0 text-slate-500">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 16.5h.75v.75h-.75v-.75zM16.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                  </svg>
                  <span className="truncate font-mono">{p.barcode}</span>
                </div>
                <div className="ml-auto flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Supplier</span>
                  <span className="font-black text-slate-900 tabular-nums bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-sm">{p.supplier}</span>
                </div>
              </div>

              {/* Row 3: Metrics - Reorder level + Created at */}
              <div className="flex items-center justify-between px-1.5 mt-2 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reorder at</span>
                  <span className="text-[10px] font-black text-gray-900 tabular-nums ml-0.5">{p.reorder_level}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-200 text-[12px]">•</span>
                  <p className="text-[9px] font-black text-slate-500 font-mono tracking-tighter uppercase tabular-nums">
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-black">
            <tr>
              <th className="px-5 py-3 text-left text-[12px] font-light tracking-widest text-slate-900">#</th>
              <th className="px-5 py-3 text-left text-[12px] font-light tracking-widest text-slate-900">Barcode</th>
              <th className="px-5 py-3 text-left text-[12px] font-light tracking-widest text-slate-900">Name</th>
              <th className="px-5 py-3 text-left text-[12px] font-light tracking-widest text-slate-900">Category</th>
              <th className="px-5 py-3 text-left text-[12px] font-light tracking-widest text-slate-900">
                <span className="inline-flex items-center gap-1">
                  {"Reorder"}{" "}
                  <span className="flex flex-col leading-none">
                    <svg className={`w-2.5 h-2.5 ${reorderDir === "asc" ? "text-orange-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l8 8H4z" /></svg>
                    <svg className={`w-2.5 h-2.5 ${reorderDir === "desc" ? "text-orange-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l-8-8h16z" /></svg>
                  </span>
                </span>
              </th>
              <th className="px-5 py-3 text-left text-[12px] font-light tracking-widest text-slate-900">Supplier</th>
              <th className="px-5 py-3 text-left text-[12px] font-light tracking-widest text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black bg-white text-[12px]">
            {displayed.map((p, idx) => (
              <tr key={p.id ?? idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-2 font-black text-gray-400">#{p.id}</td>
                <td className="px-5 py-2 font-mono text-gray-500">{p.barcode}</td>
                <td className="px-5 py-2 font-semibold text-gray-800">{p.product_name}</td>
                <td className="px-5 py-2">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-black">{p.category}</span>
                </td>
                <td className="px-5 py-2 text-gray-500">{p.reorder_level}</td>
                <td className="px-5 py-2 text-gray-500">{p.supplier}</td>
                <td className="px-5 py-2">
                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <button onClick={() => onEdit(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => onDelete(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function getSaveLabel(saving: boolean, editing: Product | null) {
  if (saving) return "Saving…";
  return editing ? "Save Changes" : "Add Product";
}

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
  const [costDir, setCostDir] = useState<SortDir>("");
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

  const categoryStats = useMemo(() => {
    if (stats?.by_category) {
      const accCount = stats.by_category.Accessories?.count ?? 0;
      const fasCount = stats.by_category.Fasteners?.count ?? 0;
      const total = stats.total_products ?? (accCount + fasCount);
      const accShare = total > 0 ? Math.round((accCount / total) * 100) : 0;
      const fasShare = total > 0 ? 100 - accShare : 0;

      return {
        accessories: { count: accCount, share: accShare },
        fasteners: { count: fasCount, share: fasShare },
        total,
      };
    }
    // Fallback if stats not fully loaded
    const accLen = products.filter((p) => p.category === "Accessories").length;
    const fasLen = products.filter((p) => p.category === "Fasteners").length;
    const total = accLen + fasLen;
    const accShare = total > 0 ? Math.round((accLen / total) * 100) : 0;
    const fasShare = total > 0 ? 100 - accShare : 0;

    return {
      accessories: { count: accLen, share: accShare },
      fasteners: { count: fasLen, share: fasShare },
      total,
    };
  }, [stats, products]);

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

  const saveLabel = getSaveLabel(saving, editing);

  return (
    <div className="px-4 py-5 sm:px-5 sm:py-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-light text-gray-900">Products</h1>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-2 py-1.5 sm:px-4 rounded-lg text-xs font-light tracking-widest bg-orange-500 text-white hover:opacity-90 active:scale-[0.97] transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>      {/* Category Overview - Mobile (Combined Box) */}
      <div className="sm:hidden bg-white border border-black rounded-xl overflow-hidden shadow-sm">
        <div className="flex h-1.5 w-full bg-gray-100">
          <div
            className="h-full bg-black transition-all duration-700"
            style={{ width: `${categoryStats.accessories.share}%` }}
          />
          <div
            className="h-full bg-gray-300 transition-all duration-700"
            style={{ width: `${categoryStats.fasteners.share}%` }}
          />
        </div>
        <div className="grid grid-cols-3 divide-x divide-black/10">
          {[
            { label: "Accessories", count: categoryStats.accessories.count, icon: "↗", color: "text-black" },
            { label: "Fasteners", count: categoryStats.fasteners.count, icon: "↘", color: "text-gray-400" },
            { label: "Total", count: categoryStats.total, icon: "•", color: "text-black" },
          ].map(({ label, count, icon, color }) => (
            <div key={label} className="flex flex-col gap-0.5 px-3 py-2.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate">{label}</p>
              <div className="flex items-center gap-1">
                <span className={`text-[12px] font-black ${color}`}>{icon}</span>
                <span className="text-[14px] font-black text-black tabular-nums tracking-tight">{count.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category stat cards - Desktop */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3">
        {[
          {
            label: "Accessories",
            count: categoryStats.accessories.count,
            share: categoryStats.accessories.share,
            icon: (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            ),
          },
          {
            label: "Fasteners",
            count: categoryStats.fasteners.count,
            share: categoryStats.fasteners.share,
            icon: (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
              </svg>
            ),
          },
          {
            label: "Total Products",
            count: categoryStats.total,
            share: 100,
            icon: (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            ),
          },
        ].map(({ label, count, share, icon }) => (
          <div key={label} className="px-5 py-4 border border-black bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-md hover:bg-slate-50/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">{label}</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-black tabular-nums tracking-tighter leading-none">{count}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">items</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-black flex items-center justify-center shrink-0 rounded-lg shadow-sm">
                {icon}
              </div>
            </div>
            <div className="space-y-1.5 pt-1 border-t border-gray-50">
              <div className="flex h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-black transition-all duration-1000 ease-out" style={{ width: `${share}%` }} />
              </div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{share}% of catalog composition</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-[1fr_1fr_1fr_minmax(0,140px)_2fr] gap-2.5">
          <div className="bg-white rounded-sm">
            <CustomSelect id="filter-category" value={categoryFilter} onChange={setCategoryFilter}
              options={[
                { value: "", label: "All Categories" },
                { value: "Accessories", label: "Accessories" },
                { value: "Fasteners", label: "Fasteners" },
              ]} />
          </div>
          <div className="bg-white rounded-sm">
            <CustomSelect id="sort-reorder" value={reorderDir} onChange={(v) => setReorderDir(v as SortDir)}
              options={[
                { value: "", label: "Reorder (sort)" },
                { value: "asc", label: "Low → High" },
                { value: "desc", label: "High → Low" },
              ]} />
          </div>
          <div className="flex items-center gap-2 bg-white rounded-md border border-black px-3 py-1 shadow-sm transition-all focus-within:ring-2 focus-within:ring-orange-500/20">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input id="product-search" name="product-search" type="text" placeholder="Search name, barcode, supplier"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 text-xs font-black text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent outline-none" />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="text-slate-300 hover:text-black transition shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters — Single Row Layout */}
      <div className="flex flex-nowrap lg:hidden gap-2 items-center">
        {/* Filters dropdown */}
        <div className="relative shrink-0" ref={filtersRef}>
          {(() => {
            const activeCount = [categoryFilter, costDir, reorderDir].filter(Boolean).length;
            return (
              <button type="button" onClick={() => setFiltersOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[13px] transition ${filtersOpen ? "bg-black text-white border-black" : "bg-white text-slate-700 border-black hover:bg-slate-50"
                  }`}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                {activeCount > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold bg-orange-500 text-white mr-0.5">
                    {activeCount}
                  </span>
                )}
                Filters
              </button>
            );
          })()}

          {filtersOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-white border border-black rounded-lg shadow-xl p-3 space-y-3">
              <p className="text-[9px] font-bold tracking-widest uppercase text-slate-400">Filters &amp; Sorting</p>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500">Category</p>
                <CustomSelect id="mob-filter-category" value={categoryFilter} onChange={setCategoryFilter}
                  options={[
                    { value: "", label: "All Categories" },
                    { value: "Accessories", label: "Accessories" },
                    { value: "Fasteners", label: "Fasteners" },
                  ]} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500">Cost / Unit (sort)</p>
                <CustomSelect id="mob-sort-cost" value={costDir} onChange={(v) => setCostDir(v as SortDir)}
                  options={[
                    { value: "", label: "Default" },
                    { value: "asc", label: "Low → High" },
                    { value: "desc", label: "High → Low" },
                  ]} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500">Reorder(sort)</p>
                <CustomSelect id="mob-sort-reorder" value={reorderDir} onChange={(v) => setReorderDir(v as SortDir)}
                  options={[
                    { value: "", label: "Default" },
                    { value: "asc", label: "Low → High" },
                    { value: "desc", label: "High → Low" },
                  ]} />
              </div>
              {[categoryFilter, costDir, reorderDir].some(Boolean) && (
                <button type="button"
                  onClick={() => { setCategoryFilter(""); setCostDir(""); setReorderDir(""); }}
                  className="w-full py-1.5 text-[10px] font-bold tracking-widest uppercase text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>


        {/* Search */}
        <div className="flex-1 flex items-center gap-2 bg-white rounded-md border border-black px-2.5 py-1 shadow-sm min-w-0">
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input id="product-search-mobile" name="product-search" type="text"
            placeholder="Search..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 text-[13px] font-black text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent outline-none" />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="text-slate-300 hover:text-black transition shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-black overflow-hidden bg-white ">
        <ProductTable
          loading={loading} error={error}
          displayed={displayed} products={products}
          costDir={costDir} reorderDir={reorderDir}
          onEdit={openEdit} onDelete={setDeleteTarget}
          canEdit={canEdit} canDelete={canDelete}
        />
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
          <div className="bg-white rounded-t-sm sm:rounded-sm shadow-2xl w-full sm:max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">{editing ? "Edit Product" : "New Product"}</h2>
                  <p className="text-[10px] text-gray-400 font-medium">{editing ? "Update product details below" : "Fill in the product details below"}</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-sm text-gray-400 hover:text-black hover:bg-gray-100 transition-all shrink-0 active:scale-95">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 bg-white min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Product Name" id="product_name" value={form.product_name} placeholder="Engine Oil Filter"
                  onChange={(v) => setForm((f) => ({ ...f, product_name: v }))} />
                <Field label="Barcode" id="barcode" value={form.barcode} placeholder="SN-ABC123"
                  onChange={(v) => setForm((f) => ({ ...f, barcode: v }))} disabled={!!editing} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomSelect id="category" label="Category" value={form.category} placeholder="Select…"
                  onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  options={[
                    { value: "Accessories", label: "Accessories" },
                    { value: "Fasteners", label: "Fasteners" },
                  ]} />
                <div className="space-y-1.5">
                  <CustomSelect id="reorder_level" label="Reorder Level"
                    value={reorderCustom ? "custom" : form.reorder_level} placeholder="Select…"
                    onChange={(v) => {
                      if (v === "custom") {
                        setReorderCustom(true);
                        setForm((f) => ({ ...f, reorder_level: 0 }));
                      } else {
                        setReorderCustom(false);
                        setForm((f) => ({ ...f, reorder_level: Number.parseInt(v) }));
                      }
                    }}
                    options={[
                      { value: 5, label: "5" },
                      { value: 10, label: "10" },
                      { value: 15, label: "15" },
                      { value: 20, label: "20" },
                      { value: "custom", label: "Custom…" },
                    ]} />
                  {reorderCustom && (
                    <input type="number" min={1} placeholder="Enter value" required
                      value={form.reorder_level || ""}
                      onChange={(e) => setForm((f) => ({ ...f, reorder_level: Number.parseInt(e.target.value) || 0 }))}
                      className={`${inputCls} mt-1`} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Supplier" id="supplier" value={form.supplier} placeholder="CTK Supply Co."
                  onChange={(v) => setForm((f) => ({ ...f, supplier: v }))} />
                <Field label="Cost / Unit ($)" id="cost_per_unit" type="number" value={form.cost_per_unit} placeholder="12.50"
                  onChange={(v) => setForm((f) => ({ ...f, cost_per_unit: Number.parseFloat(v) || 0 }))} />
              </div>

              {formError && (
                <p className="text-xs font-medium text-red-500 bg-red-50 border border-red-100 px-4 py-2.5">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-1.5 rounded-md text-[13px] text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-1.5 rounded-md text-[13px] text-white bg-orange-500 hover:opacity-90 active:scale-[0.97] transition disabled:opacity-60"
                >
                  {saveLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm px-5 pt-4 pb-8 sm:p-7 space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-gray-900">Delete Product?</h2>
              <p className="text-sm text-gray-500">
                <span className="font-semibold">{deleteTarget.product_name}</span> will be permanently removed.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold tracking-widest uppercase text-white bg-red-500 hover:bg-red-600 active:scale-[0.97] transition disabled:opacity-60">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
