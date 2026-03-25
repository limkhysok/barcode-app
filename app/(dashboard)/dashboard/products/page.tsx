"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product, ProductPayload } from "@/src/types/product.types";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/src/services/product.service";

const REORDER_PRESETS = new Set([5, 10, 15, 20]);

type SortKey = "product_name" | "category" | "cost_per_unit" | "reorder_level" | "supplier";

function sortValue(p: Product, key: SortKey): string | number {
  if (key === "cost_per_unit") return Number.parseFloat(p.cost_per_unit);
  return p[key];
}

function filterAndSort(
  products: Product[],
  search: string,
  category: string,
  sortKey: SortKey | null,
  sortDir: "asc" | "desc",
): Product[] {
  let list = [...products];
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((p) => p.product_name.toLowerCase().includes(q));
  }
  if (category) list = list.filter((p) => p.category === category);
  if (sortKey) {
    list.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }
  return list;
}

function totalCost(list: Product[]): number {
  return list.reduce((s, p) => s + Number.parseFloat(p.cost_per_unit), 0);
}

function flipDir(dir: "asc" | "desc"): "asc" | "desc" {
  return dir === "asc" ? "desc" : "asc";
}

const emptyForm: ProductPayload = {
  product_name: "",
  category: "",
  cost_per_unit: 0,
  reorder_level: 0,
  supplier: "",
};

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent transition";
const ringStyle = { "--tw-ring-color": "#FA4900" } as React.CSSProperties;

function CustomSelect({
  id, label, value, onChange, options, placeholder,
}: Readonly<{
  id: string; label: string; value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className="space-y-1.5" ref={ref}>
      <label htmlFor={id} className="text-xs font-bold tracking-widest uppercase text-gray-500">
        {label}
      </label>
      <div className="relative">
        <button
          id={id}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`w-full px-4 py-2.5 rounded-xl border text-sm text-left flex items-center justify-between gap-2 transition focus:outline-none ${
            open ? "border-[#FA4900] ring-2 ring-[#FA4900]/20" : "border-gray-200 hover:border-gray-300"
          } ${selected ? "text-gray-900" : "text-gray-400"}`}
        >
          <span className="truncate">{selected ? selected.label : (placeholder ?? "Select…")}</span>
          <svg
            className="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {open && (
          <ul className="absolute z-50 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1">
            {options.map((opt) => {
              const active = String(opt.value) === String(value);
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => { onChange(String(opt.value)); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition ${
                      active
                        ? "font-bold text-white"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={active ? { background: "linear-gradient(135deg, #FA4900, #b91c1c)" } : {}}
                  >
                    {opt.label}
                    {active && (
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({
  label, id, type = "text", value, onChange, placeholder,
}: Readonly<{
  label: string; id: string; type?: string;
  value: string | number; onChange: (v: string) => void; placeholder?: string;
}>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-bold tracking-widest uppercase text-gray-500">
        {label}
      </label>
      <input
        id={id} type={type} placeholder={placeholder} value={value} required
        onChange={(e) => onChange(e.target.value)}
        className={inputCls} style={ringStyle}
      />
    </div>
  );
}

const SORT_COLS = [
  { label: "Product Name",  key: "product_name"  },
  { label: "Category",      key: "category"      },
  { label: "Cost / Unit",   key: "cost_per_unit" },
  { label: "Reorder Level", key: "reorder_level" },
  { label: "Supplier",      key: "supplier"      },
] as { label: string; key: SortKey }[];

function ProductTable({ loading, error, displayed, products, sortKey, sortDir, onSort, onEdit, onDelete }: Readonly<{
  loading: boolean; error: string;
  displayed: Product[]; products: Product[];
  sortKey: SortKey | null; sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-5 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-gray-400">#</th>
            {SORT_COLS.map(({ label, key }) => (
              <th key={key}
                className="px-5 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-gray-400 cursor-pointer select-none hover:text-gray-700 transition-colors"
                onClick={() => onSort(key)}>
                <span className="inline-flex items-center gap-1">
                  {label}
                  <span className="flex flex-col leading-none">
                    <svg className={`w-2.5 h-2.5 ${sortKey === key && sortDir === "asc" ? "text-orange-500" : "text-gray-300"}`}
                      fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l8 8H4z" /></svg>
                    <svg className={`w-2.5 h-2.5 ${sortKey === key && sortDir === "desc" ? "text-orange-500" : "text-gray-300"}`}
                      fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l-8-8h16z" /></svg>
                  </span>
                </span>
              </th>
            ))}
            <th className="px-5 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {displayed.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 text-xs font-bold text-gray-400">#{p.id}</td>
              <td className="px-5 py-3.5 font-semibold text-gray-800">{p.product_name}</td>
              <td className="px-5 py-3.5">
                <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-orange-50 text-orange-500">
                  {p.category}
                </span>
              </td>
              <td className="px-5 py-3.5 font-bold text-gray-700">${Number.parseFloat(p.cost_per_unit).toFixed(2)}</td>
              <td className="px-5 py-3.5 text-gray-500">{p.reorder_level}</td>
              <td className="px-5 py-3.5 text-gray-500">{p.supplier}</td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit(p)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition" title="Edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button onClick={() => onDelete(p)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Delete">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getSaveLabel(saving: boolean, editing: Product | null) {
  if (saving) return "Saving…";
  return editing ? "Save Changes" : "Add Product";
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [reorderCustom, setReorderCustom] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Search / filter / sort ────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => clearTimeout(t);
  }, [search]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(flipDir(sortDir));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  const categoryStats = useMemo(() => {
    const acc = products.filter((p) => p.category === "Accessories");
    const fas = products.filter((p) => p.category === "Fasteners");
    return {
      accessories: { count: acc.length, cost: totalCost(acc) },
      fasteners:   { count: fas.length, cost: totalCost(fas) },
      total:       products.length,
    };
  }, [products]);

  const displayed = useMemo(
    () => filterAndSort(products, debouncedSearch, categoryFilter, sortKey, sortDir),
    [products, debouncedSearch, categoryFilter, sortKey, sortDir],
  );

  useEffect(() => { fetchProducts(); }, []);

  function fetchProducts() {
    setLoading(true);
    setError("");
    getProducts()
      .then((data) => setProducts(data))
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
      await (editing ? updateProduct(editing.id, form) : createProduct(form));
      setModalOpen(false);
      fetchProducts();
    } catch {
      setFormError("Failed to save. Please check your inputs.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      fetchProducts();
    } catch {
      setDeleting(false);
    }
  }

  const saveLabel = getSaveLabel(saving, editing);

  return (
    <div className="px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>Management</p>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-white hover:opacity-90 active:scale-[0.97] transition shadow-sm"
          style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Category stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Accessories card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(to right, #FA4900, #fb923c)" }} />
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Accessories</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1 leading-none">
                  {loading ? "—" : categoryStats.accessories.count}
                </p>
                <p className="text-xs text-gray-400 mt-1">products</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
                style={{ background: "linear-gradient(135deg, #FA4900, #fb923c)" }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                </svg>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Total cost / unit</span>
                <span className="font-bold text-gray-800">
                  {loading ? "—" : `$${categoryStats.accessories.cost.toFixed(2)}`}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-orange-50 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: loading ? "0%" : `${Math.round((categoryStats.accessories.count / Math.max(categoryStats.total, 1)) * 100)}%`,
                    background: "linear-gradient(to right, #FA4900, #fb923c)",
                  }} />
              </div>
              <p className="text-[10px] text-gray-400 text-right">
                {loading ? "" : `${Math.round((categoryStats.accessories.count / Math.max(categoryStats.total, 1)) * 100)}% of total`}
              </p>
            </div>
          </div>
        </div>

        {/* Fasteners card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(to right, #b91c1c, #ef4444)" }} />
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Fasteners</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1 leading-none">
                  {loading ? "—" : categoryStats.fasteners.count}
                </p>
                <p className="text-xs text-gray-400 mt-1">products</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
                style={{ background: "linear-gradient(135deg, #b91c1c, #ef4444)" }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.736.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z" />
                </svg>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Total cost / unit</span>
                <span className="font-bold text-gray-800">
                  {loading ? "—" : `$${categoryStats.fasteners.cost.toFixed(2)}`}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-red-50 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: loading ? "0%" : `${Math.round((categoryStats.fasteners.count / Math.max(categoryStats.total, 1)) * 100)}%`,
                    background: "linear-gradient(to right, #b91c1c, #ef4444)",
                  }} />
              </div>
              <p className="text-[10px] text-gray-400 text-right">
                {loading ? "" : `${Math.round((categoryStats.fasteners.count / Math.max(categoryStats.total, 1)) * 100)}% of total`}
              </p>
            </div>
          </div>
        </div>

        {/* Total cost card */}
        <div className="rounded-2xl overflow-hidden shadow-sm text-white"
          style={{ background: "linear-gradient(135deg, #FA4900 0%, #b91c1c 100%)" }}>
          <div className="p-5 space-y-4 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-white/70">Total Value</p>
                <p className="text-3xl font-extrabold mt-1 leading-none">
                  {loading ? "—" : `$${(categoryStats.accessories.cost + categoryStats.fasteners.cost).toFixed(2)}`}
                </p>
                <p className="text-xs text-white/60 mt-1">combined cost / unit</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">Accessories</span>
                <span className="font-bold">{loading ? "—" : `$${categoryStats.accessories.cost.toFixed(2)}`}</span>
              </div>
              <div className="h-px w-full bg-white/20" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">Fasteners</span>
                <span className="font-bold">{loading ? "—" : `$${categoryStats.fasteners.cost.toFixed(2)}`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text" placeholder="Search name or supplier…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent transition"
            style={{ "--tw-ring-color": "#FA4900" } as React.CSSProperties}
          />
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-2 shrink-0">
          {["", "Accessories", "Fasteners"].map((cat) => (
            <button key={cat || "all"} onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition ${
                categoryFilter === cat
                  ? "text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
              style={categoryFilter === cat ? { background: "linear-gradient(135deg, #FA4900, #b91c1c)" } : {}}>
              {cat || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <ProductTable
          loading={loading} error={error}
          displayed={displayed} products={products}
          sortKey={sortKey} sortDir={sortDir}
          onSort={handleSort} onEdit={openEdit} onDelete={setDeleteTarget}
        />
      </div>

      {/* Results summary */}
      {!loading && !error && (
        <p className="text-xs text-gray-400">
          Showing <span className="font-bold text-gray-600">{displayed.length}</span> of{" "}
          <span className="font-bold text-gray-600">{products.length}</span> products
        </p>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <Field label="Product Name" id="product_name" value={form.product_name} placeholder="Engine Oil Filter"
                onChange={(v) => setForm((f) => ({ ...f, product_name: v }))} />

              <div className="grid grid-cols-2 gap-4">
                <CustomSelect
                  id="category" label="Category"
                  value={form.category} placeholder="Select…"
                  onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  options={[
                    { value: "Accessories", label: "Accessories" },
                    { value: "Fasteners",   label: "Fasteners"   },
                  ]}
                />
                <Field label="Supplier" id="supplier" value={form.supplier} placeholder="CTK Supply Co."
                  onChange={(v) => setForm((f) => ({ ...f, supplier: v }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Cost / Unit ($)" id="cost_per_unit" type="number" value={form.cost_per_unit} placeholder="12.50"
                  onChange={(v) => setForm((f) => ({ ...f, cost_per_unit: Number.parseFloat(v) || 0 }))} />

                {/* Reorder Level — preset or custom */}
                <div className="space-y-1.5">
                  <CustomSelect
                    id="reorder_level" label="Reorder Level"
                    value={reorderCustom ? "custom" : form.reorder_level}
                    placeholder="Select…"
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
                      { value: 5,        label: "5"       },
                      { value: 10,       label: "10"      },
                      { value: 15,       label: "15"      },
                      { value: 20,       label: "20"      },
                      { value: "custom", label: "Custom…" },
                    ]}
                  />
                  {reorderCustom && (
                    <input type="number" min={1} placeholder="Enter value" required
                      value={form.reorder_level || ""}
                      onChange={(e) => setForm((f) => ({ ...f, reorder_level: Number.parseInt(e.target.value) || 0 }))}
                      className={`${inputCls} mt-1`} style={ringStyle}
                    />
                  )}
                </div>
              </div>

              {formError && (
                <p className="text-xs font-medium text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-white hover:opacity-90 transition shadow-sm disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}>
                  {saveLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 space-y-5 text-center">
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
                className="flex-1 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-60">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
