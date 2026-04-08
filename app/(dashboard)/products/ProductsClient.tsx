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
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 rounded-full border-[3px] border-orange-500/20 border-t-orange-500 animate-spin" />
      </div>
    );
  }
  if (error) return <div className="p-12 text-center text-sm font-black text-red-500 uppercase tracking-widest bg-red-50/50 rounded-2xl border border-red-100 mx-4 my-8">{error}</div>;
  if (displayed.length === 0) {
    const msg = products.length === 0 ? "Empty Catalog" : "No Match Found";
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-300">
        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
            <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
        </div>
        <p className="text-sm font-black uppercase tracking-[0.3em]">{msg}</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {/* ── Mobile: High Density Cards ── */}
      <div className="sm:hidden space-y-3 px-4">
        {displayed.map((p, idx) => (
          <div key={p.id ?? idx} className="relative group bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-orange-500/30 transition-all duration-300">
             
            {/* Stretched Link Overlay */}
            {canEdit && (
              <button 
                onClick={() => onEdit(p)}
                className="absolute inset-0 z-0 w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20 rounded-2xl"
                aria-label={`Edit ${p.product_name}`}
              />
            )}

            <div className="relative z-10 pointer-events-none">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-white bg-slate-950 px-2 py-0.5 rounded-md shadow-sm">ID-{p.id}</span>
                    <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-orange-100">{p.category}</span>
                  </div>
                  
                  {/* Secondary Action: Delete */}
                  {canDelete && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(p); }}
                      className="pointer-events-auto p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>

                <h3 className="text-sm font-black text-slate-950 uppercase tracking-tighter mb-1 line-clamp-1">{p.product_name}</h3>
                
                <div className="flex items-center gap-3 py-2 bg-slate-50/50 rounded-xl px-3 border border-slate-100/50 mb-3">
                   <div className="flex items-center gap-1.5 min-w-0">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
                      </svg>
                      <span className="text-[10px] font-mono font-bold text-slate-500 truncate">{p.barcode}</span>
                   </div>
                   <div className="w-px h-3 bg-slate-200" />
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{p.supplier}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                   <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reorder Level</span>
                      <span className="text-xs font-black text-slate-950 tabular-nums">{p.reorder_level}</span>
                   </div>
                   <p className="text-[9px] font-black text-orange-500 font-mono tracking-tighter uppercase tabular-nums">
                     {new Date(p.created_at).toLocaleDateString()}
                   </p>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop: Brutalist Table ── */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/50 border-b border-gray-100">
            <tr>
              <th className="pl-8 pr-4 py-5 text-left text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">IDENTIFIER</th>
              <th className="px-4 py-5 text-left text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">BARCODE</th>
              <th className="px-4 py-5 text-left text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase leading-none">
                 <div className="flex flex-col">
                    <span>NAME</span>
                    <span className="text-[8px] tracking-widest font-bold text-slate-300">DESCRIPTION</span>
                 </div>
              </th>
              <th className="px-4 py-5 text-left text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">CATEGORY</th>
              <th className="px-4 py-5 text-left">
                <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  <span>REORDER</span>
                  <div className="flex flex-col -space-y-1">
                    <svg className={`w-2.5 h-2.5 ${reorderDir === "asc" ? "text-orange-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l8 8H4z" /></svg>
                    <svg className={`w-2.5 h-2.5 ${reorderDir === "desc" ? "text-orange-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l-8-8h16z" /></svg>
                  </div>
                </div>
              </th>
              <th className="px-4 py-5 text-left text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">SUPPLIER</th>
              <th className="pr-8 pl-4 py-5 text-right text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">TOOLS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {displayed.map((p, idx) => (
              <tr key={p.id ?? idx} className="group hover:bg-slate-50 transition-colors duration-300">
                <td className="pl-8 pr-4 py-4">
                   <div className="text-[11px] font-black text-white bg-slate-950 px-2 py-0.5 rounded shadow-sm inline-block tracking-tighter">ID-{p.id}</div>
                </td>
                <td className="px-4 py-4">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-tighter tabular-nums">{p.barcode}</span>
                   </div>
                </td>
                <td className="px-4 py-4 min-w-50">
                   <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight group-hover:text-orange-600 transition-colors">{p.product_name}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-widest">{p.category}</span>
                </td>
                <td className="px-4 py-4">
                   <span className="text-[12px] font-black text-slate-950 tabular-nums">{p.reorder_level}</span>
                </td>
                <td className="px-4 py-4">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.supplier}</span>
                </td>
                <td className="pr-8 pl-4 py-4">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    {canEdit && (
                      <button onClick={() => onEdit(p)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-950 transition-all active:scale-95 shadow-sm border border-transparent hover:border-slate-800" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => onDelete(p)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-red-600 transition-all active:scale-95 shadow-sm border border-transparent hover:border-red-500" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
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
    </div>
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
      <div className="flex flex-wrap items-center gap-3 border border-gray-100 bg-white rounded-xl p-2 shadow-sm transition-all hover:border-gray-200">
        {/* Desktop Stats */}
        <div className="hidden sm:flex items-center gap-3">

          {/* Accessories */}
          <div className="flex items-center gap-2 pr-3 border-r border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100/50">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.222-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Accessories</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-black text-slate-900 tabular-nums">{categoryStats.accessories.count.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Items</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 pl-1">
              <span className="text-[9px] font-black text-orange-500">{categoryStats.accessories.share}%</span>
              <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-linear-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${categoryStats.accessories.share}%` }} />
              </div>
            </div>
          </div>

          {/* Fasteners */}
          <div className="flex items-center gap-2 pr-3 border-r border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100/50">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5v2.25m0-2.25l2.25 1.313m0 9v2.25m0-2.25l-2.25-1.313m2.25 1.313l2.25-1.313m11.25 4.5l2.25-1.313m-2.25 1.313V16.5m0 2.25l-2.25-1.313M12 3v2.25m0-2.25l2.25 1.313M12 3L9.75 4.313M12 21v-2.25m0 2.25l2.25-1.313M12 21l-2.25-1.313m0-12.375L12 6l2.25 1.313M9.75 16.5L12 18l2.25-1.313M4.5 12L12 16.5l7.5-4.5L12 7.5 4.5 12z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fasteners</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-black text-slate-900 tabular-nums">{categoryStats.fasteners.count.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Items</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 pl-1">
              <span className="text-[9px] font-black text-orange-500">{categoryStats.fasteners.share}%</span>
              <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-linear-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${categoryStats.fasteners.share}%` }} />
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100/50">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-2.25v2.25m3-2.25v2.25m3-2.25v2.25m-13.5 0h16.5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-black text-slate-900 tabular-nums">{categoryStats.total.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Items</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: compact inline stats */}
        <div className="sm:hidden flex items-center gap-4 px-2 py-1">
          {[
            { label: "Acc", count: categoryStats.accessories.count, share: categoryStats.accessories.share },
            { label: "Fast", count: categoryStats.fasteners.count, share: categoryStats.fasteners.share },
            { label: "Total", count: categoryStats.total, share: 100 },
          ].map(({ label, count, share }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
              <span className="text-xs font-black text-slate-900 tabular-nums">{count.toLocaleString()}</span>
              <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full" style={{ width: `${share}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Toolbar: Advanced Filters ── */}
      <div className="hidden lg:block">
        <div className="flex flex-wrap items-center gap-3 border border-gray-100 bg-white rounded-xl p-2 shadow-sm transition-all hover:border-gray-200">
          
          {/* 1. Category Filter (Dropdown) */}
          <div className="flex items-center gap-2 pl-2">
             <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100/50">
               <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
               </svg>
             </div>
             <div className="w-44">
                <CustomSelect id="filter-category" value={categoryFilter} onChange={setCategoryFilter}
                  options={[
                    { value: "", label: "All Categories" },
                    { value: "Accessories", label: "Accessories" },
                    { value: "Fasteners", label: "Fasteners" },
                  ]} />
             </div>
          </div>

          <div className="w-px h-8 bg-gray-100 mx-1" />

          {/* 2. Reorder Level Sort (Toggle Group) */}
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="text-[10px] font-black text-slate-400 pl-1 uppercase tracking-widest">Reorder</span>
                <div className="flex items-center gap-1">
                   {[
                     { dir: "asc", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg> },
                     { dir: "desc", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg> }
                   ].map(({ dir, icon }) => (
                     <button
                       key={dir}
                       onClick={() => setReorderDir(reorderDir === dir ? "" : dir as SortDir)}
                       className={`
                         flex items-center justify-center w-8 h-8 rounded-md transition-all duration-300
                         ${reorderDir === dir 
                           ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105" 
                           : "text-slate-400 hover:bg-white hover:text-slate-900"}
                       `}
                     >
                       {icon}
                     </button>
                   ))}
                </div>
             </div>
          </div>

          <div className="w-px h-8 bg-gray-100 mx-1" />

          {/* 3. Search Module */}
          <div className="flex-1 flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2 border border-transparent focus-within:border-orange-500/20 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-500/5 transition-all group">
            <svg className="w-4 h-4 text-slate-400 group-focus-within:text-orange-500 shrink-0 transition-colors" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input id="product-search" name="product-search" type="text" placeholder="Search name, barcode, supplier..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 text-xs font-black text-slate-900 placeholder:text-slate-400 placeholder:font-bold bg-transparent outline-none" />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 text-white hover:bg-slate-950 transition-colors shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Toolbar: High Density ── */}
      <div className="flex lg:hidden gap-2 items-center px-4">
        {/* Filters dropdown */}
        <div className="relative shrink-0" ref={filtersRef}>
          {(() => {
            const activeCount = [categoryFilter, costDir, reorderDir].filter(Boolean).length;
            return (
              <button type="button" onClick={() => setFiltersOpen((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm ${filtersOpen ? "bg-slate-950 text-white border-slate-950" : "bg-white text-slate-700 border-gray-100"
                  }`}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                {activeCount > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-lg text-[9px] font-black bg-orange-500 text-white">
                    {activeCount}
                  </span>
                )}
                <span className="hidden sm:inline">Filters</span>
              </button>
            );
          })()}

          {filtersOpen && (
            <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                 <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Filters & Sorting</p>
                 <button onClick={() => setFiltersOpen(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Category</p>
                  <CustomSelect id="mob-filter-category" value={categoryFilter} onChange={setCategoryFilter}
                    options={[
                      { value: "", label: "All Categories" },
                      { value: "Accessories", label: "Accessories" },
                      { value: "Fasteners", label: "Fasteners" },
                    ]} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Reorder Level (sort)</p>
                  <CustomSelect id="mob-sort-reorder" value={reorderDir} onChange={(v) => setReorderDir(v as SortDir)}
                    options={[
                      { value: "", label: "Default Sort" },
                      { value: "asc", label: "Low → High" },
                      { value: "desc", label: "High → Low" },
                    ]} />
                </div>
              </div>

              {[categoryFilter, costDir, reorderDir].some(Boolean) && (
                <button type="button"
                  onClick={() => { setCategoryFilter(""); setCostDir(""); setReorderDir(""); }}
                  className="w-full py-2.5 text-[10px] font-black tracking-widest uppercase text-red-500 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all duration-300">
                  Reset Catalog Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex-1 flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-2.5 shadow-sm focus-within:ring-4 focus-within:ring-orange-500/5 focus-within:border-orange-500/20 transition-all">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input id="product-search-mobile" name="product-search" type="text"
            placeholder="Search catalog..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 text-[13px] font-black text-slate-900 placeholder:text-slate-400 placeholder:font-bold bg-transparent outline-none" />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-950 hover:text-white transition-all shrink-0">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
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
