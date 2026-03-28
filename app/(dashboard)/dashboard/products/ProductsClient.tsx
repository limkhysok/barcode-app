"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import type { Product, ProductPayload } from "@/src/types/product.types";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/src/services/product.service";

const REORDER_PRESETS = new Set([5, 10, 15, 20]);

type SortDir = "asc" | "desc" | "";

function filterAndSort(
  products: Product[],
  search: string,
  category: string,
  costDir: SortDir,
  reorderDir: SortDir,
): Product[] {
  let list = [...products];
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((p) => p.product_name.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q));
  }
  if (category) list = list.filter((p) => p.category === category);
  if (costDir || reorderDir) {
    list.sort((a, b) => {
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
  return list;
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
  "w-full px-4 py-3 rounded-sm border border-black text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:ring-2 focus:border-transparent bg-gray-50 focus:bg-white transition";
const ringStyle = { "--tw-ring-color": "#FA4900" } as React.CSSProperties;

function CustomSelect({ id, label, value, onChange, options, placeholder, openUp }: Readonly<{
  id: string; label?: string; value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  openUp?: boolean;
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
    <div className={label ? "space-y-1.5" : ""} ref={ref}>
      {label && (
        <label htmlFor={id} className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400">
          <span className="inline-block w-1 h-3 rounded-full" style={{ background: "#FA4900" }} /> 
          {label}
        </label>
      )}
      <div className="relative">
        <button
          id={id} type="button" onClick={() => setOpen((v) => !v)}
          className={`w-full px-3 py-2 rounded-sm border text-sm font-medium text-left flex items-center justify-between gap-2 transition focus:outline-none bg-gray-50 ${
            open ? "border-black ring-1 ring-black" : "border-black hover:bg-slate-50"
          } ${selected && String(selected.value) !== "" ? "text-slate-900" : "text-slate-400"}`}
        >
          <span className="truncate">{selected ? selected.label : (placeholder ?? "Select…")}</span>
          <svg className="w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {open && (
          <ul className={`absolute z-200 w-full bg-white border border-black rounded-sm shadow-lg overflow-hidden ${openUp ? "bottom-full mb-1" : "top-full mt-1"}`}>
            {options.map((opt) => {
              const active = String(opt.value) === String(value);
              return (
                <li key={opt.value} className="border-b border-black last:border-b-0">
                  <button type="button"
                    onClick={() => { onChange(String(opt.value)); setOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 text-[11px] font-semibold tracking-wide flex items-center justify-between gap-2 transition ${
                      active ? "bg-black text-white" : "text-slate-700 hover:bg-slate-50"
                    }`}>
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

function Field({ label, id, type = "text", value, onChange, placeholder }: Readonly<{
  label: string; id: string; type?: string;
  value: string | number; onChange: (v: string) => void; placeholder?: string;
}>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400">
        <span className="inline-block w-1 h-3 rounded-full" style={{ background: "#FA4900" }} />
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

function ProductTable({ loading, error, displayed, products, costDir, reorderDir, onEdit, onDelete }: Readonly<{
  loading: boolean; error: string;
  displayed: Product[]; products: Product[];
  costDir: SortDir; reorderDir: SortDir;
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
    <>
      {/* Mobile cards - shown on mobile only */}
      <div className="sm:hidden divide-y divide-black">
        {displayed.map((p, idx) => (
          <div key={p.id ?? idx} className="px-4 py-4 flex items-start gap-3 active:bg-gray-50 transition-colors">
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-800 text-sm leading-snug">{p.product_name}</span>
                <span className="text-[11px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-md border border-orange-200 bg-orange-50 text-orange-600 shrink-0">{p.category}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-mono text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">
                  <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-1.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-1.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-1.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  </svg>
                  {p.barcode}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                <span>{p.supplier}</span>
                <span className="font-bold text-gray-700">${Number.parseFloat(p.cost_per_unit).toFixed(2)}</span>
                <span className="text-gray-400">Reorder: {p.reorder_level}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              <button onClick={() => { console.log("onEdit called with row:", p); onEdit(p); }}
                className="p-2.5 rounded-sm text-gray-400 hover:text-blue-500 hover:bg-blue-50 active:scale-95 transition" title="Edit">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
              <button onClick={() => onDelete(p)}
                className="p-2.5 rounded-sm text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-95 transition" title="Delete">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table - hidden on mobile */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-black">
            <tr>
              <th className="px-5 py-3 text-left text-[11px] font-bold tracking-widest uppercase text-slate-900">#</th>
              <th className="px-5 py-3 text-left text-[11px] font-bold tracking-widest uppercase text-slate-900">Barcode</th>
              <th className="px-5 py-3 text-left text-[11px] font-bold tracking-widest uppercase text-slate-900">Product Name</th>
              <th className="px-5 py-3 text-left text-[11px] font-bold tracking-widest uppercase text-slate-900">Category</th>
              <th className="px-5 py-3 text-left text-[11px] font-bold tracking-widest uppercase text-slate-900">
                <span className="inline-flex items-center gap-1">
                  {"Cost / Unit"}{" "}
                  <span className="flex flex-col leading-none">
                    <svg className={`w-2.5 h-2.5 ${costDir === "asc" ? "text-orange-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l8 8H4z" /></svg>
                    <svg className={`w-2.5 h-2.5 ${costDir === "desc" ? "text-orange-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l-8-8h16z" /></svg>
                  </span>
                </span>
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-bold tracking-widest uppercase text-slate-900">
                <span className="inline-flex items-center gap-1">
                  {"Reorder Level"}{" "}
                  <span className="flex flex-col leading-none">
                    <svg className={`w-2.5 h-2.5 ${reorderDir === "asc" ? "text-orange-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l8 8H4z" /></svg>
                    <svg className={`w-2.5 h-2.5 ${reorderDir === "desc" ? "text-orange-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l-8-8h16z" /></svg>
                  </span>
                </span>
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-bold tracking-widest uppercase text-slate-900">Supplier</th>
              <th className="px-5 py-3 text-left text-[11px] font-bold tracking-widest uppercase text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black bg-white text-[11px]">
            {displayed.map((p, idx) => (
              <tr key={p.id ?? idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-bold text-gray-400">#{p.id}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                    <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-1.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-1.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-1.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                    </svg>
                    {p.barcode}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-semibold text-gray-800 text-[11px]">{p.product_name}</td>
                <td className="px-5 py-3.5">
                  <span className="text-[11px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-md border border-orange-200 bg-orange-50 text-orange-600">
                    {p.category}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-bold text-gray-700">${Number.parseFloat(p.cost_per_unit).toFixed(2)}</td>
                <td className="px-5 py-3.5 text-gray-500">{p.reorder_level}</td>
                <td className="px-5 py-3.5 text-gray-500">{p.supplier}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { console.log("onEdit called with row:", p); onEdit(p); }}
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
    </>
  );
}

function getSaveLabel(saving: boolean, editing: Product | null) {
  if (saving) return "Saving…";
  return editing ? "Save Changes" : "Add Product";
}

export default function ProductsClient({ initialProducts }: Readonly<{ initialProducts: Product[] }>) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [costDir, setCostDir] = useState<SortDir>("");
  const [reorderDir, setReorderDir] = useState<SortDir>("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setFiltersOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    () => filterAndSort(products, debouncedSearch, categoryFilter, costDir, reorderDir),
    [products, debouncedSearch, categoryFilter, costDir, reorderDir],
  );

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
    console.log("openEdit called with product:", product);
    setEditing(product);
    const isCustom = !REORDER_PRESETS.has(product.reorder_level);
    setReorderCustom(isCustom);
    setForm({
      barcode:       product.barcode,
      product_name:  product.product_name,
      category:      product.category,
      cost_per_unit: Number.parseFloat(product.cost_per_unit),
      reorder_level: product.reorder_level,
      supplier:      product.supplier,
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
    <>
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={4000}
        style={{ fontFamily: "var(--font-roboto)" }}
        toastOptions={{
          style: { fontFamily: "var(--font-roboto)", fontSize: "12px", borderRadius: "3px" },
        }}
      />
      <div className="px-4 py-4 sm:px-8 sm:py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>Product</p>
          <h1 className="text-2xl font-bold text-gray-900 uppercase italic">Management</h1>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 sm:px-5 rounded-sm text-xs font-bold tracking-widest uppercase bg-orange-500 text-white hover:opacity-90 active:scale-[0.97] transition shadow-sm"
          >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Category stat cards — mobile: compact summary / desktop: stitched cards */}

      {/* Mobile compact summary */}
      <div className="sm:hidden rounded-sm border border-black overflow-hidden bg-white">
        {/* Accent header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-black" >
          <p className="text-[11px] font-bold tracking-widest uppercase text-black ">Products Overview</p>
          <p className="text-sm font-bold text-black tabular-nums">{categoryStats.total} <span className="text-[10px] font-normal opacity-80">items</span></p>
        </div>

        {/* Category rows */}
        <div className="divide-y divide-black/10">
          {/* Accessories */}
          <div className="px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest uppercase text-orange-500">Accessories</span>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900 tabular-nums">{categoryStats.accessories.count}</span>
                <span className="text-[10px] text-slate-400 ml-1">units</span>
              </div>
            </div>
            <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.round((categoryStats.accessories.count / Math.max(categoryStats.total, 1)) * 100)}%`, background: "#FA4900" }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400">{Math.round((categoryStats.accessories.count / Math.max(categoryStats.total, 1)) * 100)}% of total</span>
              <span className="text-[10px] font-semibold text-slate-600 tabular-nums">${categoryStats.accessories.cost.toFixed(2)}</span>
            </div>
          </div>

          {/* Fasteners */}
          <div className="px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Fasteners</span>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900 tabular-nums">{categoryStats.fasteners.count}</span>
                <span className="text-[10px] text-slate-400 ml-1">units</span>
              </div>
            </div>
            <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-slate-400 transition-all duration-700" style={{ width: `${Math.round((categoryStats.fasteners.count / Math.max(categoryStats.total, 1)) * 100)}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400">{Math.round((categoryStats.fasteners.count / Math.max(categoryStats.total, 1)) * 100)}% of total</span>
              <span className="text-[10px] font-semibold text-slate-600 tabular-nums">${categoryStats.fasteners.cost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Total value footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-black/10">
          <p className="text-[9px] font-bold tracking-widest uppercase text-slate-400">Total Value</p>
          <p className="text-sm font-bold text-slate-900 tabular-nums">${(categoryStats.accessories.cost + categoryStats.fasteners.cost).toFixed(2)}</p>
        </div>
      </div>

      {/* Desktop stitched cards */}
      <div className="hidden sm:flex rounded-sm border border-black overflow-hidden divide-x divide-black">

        {/* Accessories */}
        <div className="flex-1 bg-white p-3 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-block text-[11px] font-semibold tracking-widest uppercase text-white bg-orange-500 px-2 py-0.5 rounded-none">Accessories</p>
              <p className="text-3xl font-bold text-slate-900 mt-2 leading-none tabular-nums">{categoryStats.accessories.count}</p>
              <p className="text-xs text-slate-400 mt-1">products</p>
            </div>
            <div className="w-9 h-9 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
              </svg>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Total cost / unit</span>
              <span className="font-semibold text-slate-900 tabular-nums">${categoryStats.accessories.cost.toFixed(2)}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-black transition-all duration-700"
                style={{ width: `${Math.round((categoryStats.accessories.count / Math.max(categoryStats.total, 1)) * 100)}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 text-right">
              {Math.round((categoryStats.accessories.count / Math.max(categoryStats.total, 1)) * 100)}% of total
            </p>
          </div>
        </div>

        {/* Fasteners */}
        <div className="flex-1 bg-white p-3 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-block text-[11px] font-semibold tracking-widest uppercase text-white bg-orange-500 px-2 py-0.5 rounded-none">Fasteners</p>
              <p className="text-3xl font-bold text-slate-900 mt-2 leading-none tabular-nums">{categoryStats.fasteners.count}</p>
              <p className="text-xs text-slate-400 mt-1">products</p>
            </div>
            <div className="w-9 h-9 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.736.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z" />
              </svg>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Total cost / unit</span>
              <span className="font-semibold text-slate-900 tabular-nums">${categoryStats.fasteners.cost.toFixed(2)}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-black transition-all duration-700"
                style={{ width: `${Math.round((categoryStats.fasteners.count / Math.max(categoryStats.total, 1)) * 100)}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 text-right">
              {Math.round((categoryStats.fasteners.count / Math.max(categoryStats.total, 1)) * 100)}% of total
            </p>
          </div>
        </div>

        {/* Total Value */}
        <div className="flex-1 bg-white p-3 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-block text-[11px] font-semibold tracking-widest uppercase text-white bg-orange-500 px-2 py-0.5 rounded-none">Total Value</p>
              <p className="text-3xl font-bold text-slate-900 mt-2 leading-none tabular-nums">
                ${(categoryStats.accessories.cost + categoryStats.fasteners.cost).toFixed(2)}
              </p>
              <p className="text-xs text-slate-400 mt-1">combined cost / unit</p>
            </div>
            <div className="w-9 h-9 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Accessories</span>
              <span className="font-semibold text-slate-900 tabular-nums">${categoryStats.accessories.cost.toFixed(2)}</span>
            </div>
            <div className="h-px w-full bg-slate-100" />
            <div className="flex items-center justify-between text-slate-500">
              <span>Fasteners</span>
              <span className="font-semibold text-slate-900 tabular-nums">${categoryStats.fasteners.cost.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Toolbar */}
      {/* Filters — four card tiles */}
      {/* Desktop filters — 4 columns */}
      <div className="hidden lg:grid grid-cols-4 gap-2.5">
        <div className="bg-white rounded-sm">
          <CustomSelect id="filter-category" value={categoryFilter} onChange={setCategoryFilter}
            options={[
              { value: "",            label: "All Categories" },
              { value: "Accessories", label: "Accessories"    },
              { value: "Fasteners",   label: "Fasteners"      },
            ]} />
        </div>
        <div className="bg-white rounded-sm">
          <CustomSelect id="sort-cost" value={costDir} onChange={(v) => setCostDir(v as SortDir)}
            options={[
              { value: "",     label: "All Cost / Unit" },
              { value: "asc",  label: "Low → High"      },
              { value: "desc", label: "High → Low"      },
            ]} />
        </div>
        <div className="bg-white rounded-sm">
          <CustomSelect id="sort-reorder" value={reorderDir} onChange={(v) => setReorderDir(v as SortDir)}
            options={[
              { value: "",     label: "All Reorder Level" },
              { value: "asc",  label: "Low → High"        },
              { value: "desc", label: "High → Low"        },
            ]} />
        </div>
        <div className="flex items-center gap-2 bg-white rounded-sm border border-black px-3 py-2">
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input id="product-search" name="product-search" type="text" placeholder="Search Name"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent outline-none" />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="text-slate-300 hover:text-black transition shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile filters — Filters button + Search */}
      <div className="flex lg:hidden gap-2">
        {/* Filters dropdown */}
        <div className="relative" ref={filtersRef}>
          {(() => {
            const activeCount = [categoryFilter, costDir, reorderDir].filter(Boolean).length;
            return (
              <button type="button" onClick={() => setFiltersOpen((v) => !v)}
                className={`flex items-center gap-2 px-3 py-3 rounded-sm border text-[11px] font-bold tracking-widest uppercase transition ${
                  filtersOpen ? "bg-black text-white border-black" : "bg-white text-slate-700 border-black hover:bg-slate-50"
                }`}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Filters
                {activeCount > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold bg-orange-500 text-white">
                    {activeCount}
                  </span>
                )}
              </button>
            );
          })()}

          {filtersOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-white border border-black rounded-sm shadow-xl p-3 space-y-3">
              <p className="text-[9px] font-bold tracking-widest uppercase text-slate-400">Filters &amp; Sorting</p>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500">Category</p>
                <CustomSelect id="mob-filter-category" value={categoryFilter} onChange={setCategoryFilter}
                  options={[
                    { value: "",            label: "All Categories" },
                    { value: "Accessories", label: "Accessories"    },
                    { value: "Fasteners",   label: "Fasteners"      },
                  ]} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500">Cost / Unit</p>
                <CustomSelect id="mob-sort-cost" value={costDir} onChange={(v) => setCostDir(v as SortDir)}
                  options={[
                    { value: "",     label: "All Cost / Unit" },
                    { value: "asc",  label: "Low → High"      },
                    { value: "desc", label: "High → Low"      },
                  ]} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500">Reorder Level</p>
                <CustomSelect id="mob-sort-reorder" value={reorderDir} onChange={(v) => setReorderDir(v as SortDir)}
                  options={[
                    { value: "",     label: "All Reorder Level" },
                    { value: "asc",  label: "Low → High"        },
                    { value: "desc", label: "High → Low"        },
                  ]} />
              </div>
              {[categoryFilter, costDir, reorderDir].some(Boolean) && (
                <button type="button"
                  onClick={() => { setCategoryFilter(""); setCostDir(""); setReorderDir(""); }}
                  className="w-full py-1.5 text-[10px] font-bold tracking-widest uppercase text-red-500 border border-red-200 rounded-sm hover:bg-red-50 transition">
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex-1 flex items-center gap-2 bg-white rounded-sm border border-black px-3 py-2">
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input id="product-search-mobile" name="product-search" type="text" placeholder="Search Name" value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 text-sm font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal bg-transparent outline-none" />
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
      <div className="rounded-sm border border-black overflow-hidden bg-white ">
        <ProductTable
          loading={loading} error={error}
          displayed={displayed} products={products}
          costDir={costDir} reorderDir={reorderDir}
          onEdit={openEdit} onDelete={setDeleteTarget}
        />
      </div>

      {!loading && !error && (
        <p className="text-xs text-gray-400 px-1 ">
          Showing <span className="font-bold text-gray-600">{displayed.length}</span> of{" "}
          <span className="font-bold text-gray-600">{products.length}</span> products
        </p>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:px-4">
          <div className="w-full sm:max-w-lg max-h-[95vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col">

            {/* Orange accent strip + header */}
            <div className="relative px-6 pt-6 pb-5">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl sm:rounded-t-2xl" style={{ background: "#FA4900" }} />
              {/* Mobile drag handle */}
              <div className="flex justify-center sm:hidden mb-4">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-block text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full mb-2"
                    style={{ background: "#FFF0E8", color: "#FA4900" }}>
                    {editing ? "Editing" : "New"}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900">{editing ? "Edit Product" : "Add Product"}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Fill in the fields below and save.</p>
                </div>
                <button onClick={() => setModalOpen(false)}
                  className="mt-1 p-2 rounded-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="px-6 pb-6 space-y-4 flex-1">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Product Name" id="product_name" value={form.product_name} placeholder="Engine Oil Filter"
                  onChange={(v) => setForm((f) => ({ ...f, product_name: v }))} />
                <Field label="Barcode" id="barcode" value={form.barcode} placeholder="SN-ABC123"
                  onChange={(v) => setForm((f) => ({ ...f, barcode: v }))} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomSelect id="category" label="Category" value={form.category} placeholder="Select…"
                  onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  options={[
                    { value: "Accessories", label: "Accessories" },
                    { value: "Fasteners",   label: "Fasteners"   },
                  ]} />
                <div className="space-y-1.5">
                  <CustomSelect id="reorder_level" label="Reorder Level" openUp
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
                      { value: 5,        label: "5"       },
                      { value: 10,       label: "10"      },
                      { value: 15,       label: "15"      },
                      { value: 20,       label: "20"      },
                      { value: "custom", label: "Custom…" },
                    ]} />
                  {reorderCustom && (
                    <input type="number" min={1} placeholder="Enter value" required
                      value={form.reorder_level || ""}
                      onChange={(e) => setForm((f) => ({ ...f, reorder_level: Number.parseInt(e.target.value) || 0 }))}
                      className={`${inputCls} mt-1`} style={ringStyle} />
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
                  className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-white hover:opacity-90 active:scale-[0.97] transition disabled:opacity-60"
                  style={{ background: "#FA4900" }}>
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
            {/* drag handle mobile only */}
            <div className="flex justify-center sm:hidden mb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
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
                className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-white bg-red-500 hover:bg-red-600 active:scale-[0.97] transition disabled:opacity-60">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </>
  );
}
