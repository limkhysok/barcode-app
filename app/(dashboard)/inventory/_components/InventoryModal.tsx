"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InventoryRecord, InventoryPayload } from "@/src/types/inventory.types";
import type { Product } from "@/src/types/product.types";
import { 
  Package, 
  LayoutGrid,
  X, 
  Plus, 
  Check
} from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

const inputCls =
  "w-full px-3 py-1.5 rounded-sm border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:border-transparent bg-slate-50 focus:bg-white transition";
const ringStyle = { "--tw-ring-color": "#FA4900" } as React.CSSProperties;

function Field({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required = true,
}: Readonly<{
  label: string;
  id: string;
  type?: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
        style={ringStyle}
      />
    </div>
  );
}

const PRESET_SITES = ["Store A", "Store B", "Store C", "Store D"];

function SiteCombobox({
  value,
  onChange,
}: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setInput(value); }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = PRESET_SITES.filter((s) =>
    s.toLowerCase().includes(input.trim().toLowerCase())
  );
  const showCustom = input.trim() !== "" && !PRESET_SITES.includes(input.trim());

  function select(site: string) {
    setInput(site);
    onChange(site);
    setOpen(false);
  }

  return (
    <div className="space-y-1.5" ref={ref}>
      <label htmlFor="site" className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400">
        Site
      </label>
      <div className="relative">
        <input
          id="site"
          type="text"
          autoComplete="off"
          placeholder="Select or type a site…"
          value={input}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setInput(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          className={inputCls}
          style={ringStyle}
        />
        {open && (filtered.length > 0 || showCustom) && (
          <ul className="absolute z-200 top-full mt-1 w-full bg-white border border-slate-200 rounded-sm shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1">
            {filtered.map((site) => {
              const active = value === site;
              return (
                <li key={site} >
                  <button
                    type="button"
                    onClick={() => select(site)}
                    className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold tracking-wide flex items-center justify-between gap-2 transition ${active ? "bg-black text-white" : "text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    {site}
                    {active && <Check size={14} strokeWidth={3} />}
                  </button>
                </li>
              );
            })}
            {showCustom && (
              <li className="border-t border-black">
                <button
                  type="button"
                  onClick={() => select(input.trim())}
                  className="w-full text-left px-3 py-2.5 text-[11px] font-semibold tracking-wide text-orange-500 hover:bg-orange-50 transition flex items-center gap-2"
                >
                  <Plus size={14} strokeWidth={3} />
                  Use &ldquo;{input.trim()}&rdquo;
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function FilterableProductSelect({
  products,
  value,
  onChange,
}: Readonly<{
  products: Product[];
  value: number;
  onChange: (id: number) => void;
}>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = products.find((p) => p.id === value);

  useEffect(() => {
    setSearch(selected ? `${selected.product_name} (${selected.barcode})` : "");
  }, [value, selected]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch(selected ? `${selected.product_name} (${selected.barcode})` : "");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const selectedLabel = selected ? `${selected.product_name} (${selected.barcode})`.toLowerCase() : "";
    if (!q || q === selectedLabel) return products.slice(0, 50); // limit for performance
    return products.filter(
      (p) =>
        p.product_name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [products, search, selected]);

  return (
    <div className="space-y-1.5" ref={ref}>
      <label htmlFor="product" className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400">
        Product
      </label>
      <div className="relative">
        <input
          id="product"
          type="text"
          autoComplete="off"
          placeholder="Search/Scan by name or barcode…"
          value={search}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          className={`${inputCls} pr-10`}
          style={ringStyle}
        />
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <LayoutGrid size={18} strokeWidth={2.5} />
        </div>
        {open && (
          <ul className="absolute z-200 top-full mt-1 w-full bg-white border border-black rounded-sm shadow-lg overflow-hidden max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-2 py-3 text-xs text-gray-400 font-medium font-black uppercase tracking-widest text-center">No products found</li>
            )}
            {filtered.map((p) => {
              const active = value === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(p.id);
                      setSearch(`${p.product_name} (${p.barcode})`);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[11px] font-semibold tracking-wide flex items-center justify-between gap-2 transition ${active ? "bg-black text-white" : "text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <div className="w-8 h-8 rounded-sm bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {p.product_picture ? (
                        <img
                          src={`${BASE_URL}${p.product_picture}`}
                          alt={p.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={14} className="text-slate-200" />
                      )}
                    </div>
                    <span className="truncate uppercase font-black">{p.product_name}</span>
                    <span className={`ml-auto font-mono text-[10px] shrink-0 font-bold ${active ? "text-white/60" : "text-gray-400"}`}>{p.barcode}</span>
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

export type InventoryModalProps = {
  open: boolean;
  onClose: () => void;
  editing: InventoryRecord | null;
  form: InventoryPayload;
  setForm: React.Dispatch<React.SetStateAction<InventoryPayload>>;
  saving: boolean;
  formError: string;
  onSave: (e: React.SyntheticEvent) => void;
  products: Product[];
};

export function InventoryModal({
  open,
  onClose,
  editing,
  form,
  setForm,
  saving,
  formError,
  onSave,
  products,
}: Readonly<InventoryModalProps>) {
  if (!open) return null;

  let saveLabel = "Create Record";
  if (saving) saveLabel = "Saving…";
  else if (editing) saveLabel = "Save Changes";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
      <div className="bg-white rounded-t-sm sm:rounded-sm shadow-2xl w-full sm:max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center shrink-0">
              <Package size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">{editing ? "Edit Record" : "New Record"}</h2>
              <p className="text-[10px] text-gray-400 font-medium">{editing ? "Update inventory details below" : "Fill in the inventory details below"}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-sm text-gray-400 hover:text-black hover:bg-gray-100 transition-all shrink-0 active:scale-95">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSave} className="flex-1 overflow-y-auto p-5 space-y-4 bg-white min-h-0">

          <FilterableProductSelect
            products={products}
            value={form.product}
            onChange={(id) => setForm((f) => ({ ...f, product: id }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SiteCombobox
              value={form.site}
              onChange={(v) => setForm((f) => ({ ...f, site: v }))}
            />
            <Field
              label="Location"
              id="location"
              value={form.location}
              placeholder="A1-Shelf-5"
              onChange={(v) => setForm((f) => ({ ...f, location: v }))}
            />
          </div>

          <Field
            label="Qty on Hand"
            id="quantity_on_hand"
            type="number"
            value={form.quantity_on_hand}
            onChange={(v) => setForm((f) => ({ ...f, quantity_on_hand: Number.parseInt(v) || 0 }))}
          />

          {(() => {
            const selectedProduct = products.find((p) => p.id === form.product);
            if (!selectedProduct) return null;
            const needsReorder = form.quantity_on_hand <= selectedProduct.reorder_level;
            return (
              <div className="grid grid-cols-[80px_1fr] gap-4 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-sm">
                <div className="w-20 h-20 rounded-sm bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                  {selectedProduct.product_picture ? (
                    <img
                      src={`${BASE_URL}${selectedProduct.product_picture}`}
                      alt={selectedProduct.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={24} className="text-slate-100" />
                  )}
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 leading-none">Status Assessment</p>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border ${needsReorder ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${needsReorder ? "bg-red-500" : "bg-green-500"}`} />
                      {needsReorder ? "Needs Reorder" : "Optimal Stock"}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Threshold: {selectedProduct.reorder_level} units
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {formError && (
            <p className="text-xs font-black uppercase tracking-widest text-red-500 bg-red-50 border border-red-100 px-4 py-2.5">
              {formError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-sm text-[12px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-sm text-[12px] font-black uppercase tracking-wider text-white bg-orange-500 hover:bg-orange-600 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-50"
            >
              {saveLabel}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
