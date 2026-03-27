"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InventoryRecord, InventoryPayload } from "@/src/types/inventory.types";
import type { Product } from "@/src/types/product.types";

// ─── Shared style constants ──────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-3 rounded-sm border border-black text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:ring-2 focus:border-transparent bg-gray-50 focus:bg-white transition";
const ringStyle = { "--tw-ring-color": "#FA4900" } as React.CSSProperties;

// ─── Field ───────────────────────────────────────────────────────────────────

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
        <span className="inline-block w-1 h-3 rounded-full" style={{ background: "#FA4900" }} />
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

// ─── SiteCombobox ─────────────────────────────────────────────────────────────

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
        <span className="inline-block w-1 h-3 rounded-full" style={{ background: "#FA4900" }} />
        <span>Site</span>
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
          <ul className="absolute z-200 top-full mt-1 w-full bg-white border border-black rounded-sm shadow-lg overflow-hidden">
            {filtered.map((site) => {
              const active = value === site;
              return (
                <li key={site} className="border-b border-black last:border-b-0">
                  <button
                    type="button"
                    onClick={() => select(site)}
                    className={`w-full text-left px-3 py-2.5 text-[11px] font-semibold tracking-wide flex items-center justify-between gap-2 transition ${
                      active ? "bg-black text-white" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {site}
                    {active && (
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
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
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
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

// ─── FilterableProductSelect ──────────────────────────────────────────────────

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

  // Sync display when value changes externally
  useEffect(() => {
    setSearch(selected ? `${selected.product_name} (${selected.barcode})` : "");
  }, [value, selected]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        // Restore display to selected value on blur
        setSearch(selected ? `${selected.product_name} (${selected.barcode})` : "");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    // When the full selected label is typed, show all products
    const selectedLabel = selected ? `${selected.product_name} (${selected.barcode})`.toLowerCase() : "";
    if (!q || q === selectedLabel) return products;
    return products.filter(
      (p) =>
        p.product_name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
    );
  }, [products, search, selected]);

  return (
    <div className="space-y-1.5" ref={ref}>
      <label htmlFor="product" className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400">
        <span className="inline-block w-1 h-3 rounded-full" style={{ background: "#FA4900" }} />
        <span>Product</span>
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
        {/* Scan / barcode hint icon */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-1">
          <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            {/* barcode lines */}
            <rect x="2"  y="4" width="1.5" height="16" rx="0.5" fill="currentColor" stroke="none" />
            <rect x="5"  y="4" width="1"   height="16" rx="0.5" fill="currentColor" stroke="none" />
            <rect x="7.5" y="4" width="2"  height="16" rx="0.5" fill="currentColor" stroke="none" />
            <rect x="11" y="4" width="1"   height="16" rx="0.5" fill="currentColor" stroke="none" />
            <rect x="13.5" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" stroke="none" />
            <rect x="16.5" y="4" width="1"   height="16" rx="0.5" fill="currentColor" stroke="none" />
            <rect x="19" y="4" width="1.5"   height="16" rx="0.5" fill="currentColor" stroke="none" />
            <rect x="21.5" y="4" width="1" height="16" rx="0.5" fill="currentColor" stroke="none" />
          </svg>
        </div>
        {open && (
          <ul className="absolute z-200 top-full mt-1 w-full bg-white border border-black rounded-sm shadow-lg overflow-hidden max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-xs text-gray-400 font-medium">No products found.</li>
            )}
            {filtered.map((p) => {
              const active = value === p.id;
              return (
                <li key={p.id} className="border-b border-black last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(p.id);
                      setSearch(`${p.product_name} (${p.barcode})`);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-[11px] font-semibold tracking-wide flex items-center justify-between gap-2 transition ${
                      active ? "bg-black text-white" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{p.product_name}</span>
                    <span className={`ml-auto font-mono shrink-0 ${active ? "text-white/60" : "text-gray-400"}`}>{p.barcode}</span>
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

// ─── InventoryModal (create / edit) ──────────────────────────────────────────

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:px-4">
      <div className="w-full sm:max-w-lg max-h-[95vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col">

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
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? "Edit Inventory Record" : "Create Inventory Record"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Fill in the fields below and save.</p>
            </div>
            <button onClick={onClose}
              className="mt-1 p-2 rounded-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSave} className="px-6 pb-6 space-y-4 flex-1">

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
            const costPerUnit = Number.parseFloat(selectedProduct.cost_per_unit);
            const stockValue = form.quantity_on_hand * costPerUnit;
            const needsReorder = form.quantity_on_hand <= selectedProduct.reorder_level;
            return (
              <div className="grid grid-cols-2 gap-3 px-4 py-3.5 bg-gray-50 rounded-sm border border-black">
                <div>
                  <p className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">
                    <span className="inline-block w-1 h-3 rounded-full" style={{ background: "#FA4900" }} />
                    <span>Stock Value</span>
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    ${stockValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">
                    <span className="inline-block w-1 h-3 rounded-full" style={{ background: "#FA4900" }} />
                    <span>Reorder Status</span>
                  </p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-full ${
                    needsReorder ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${needsReorder ? "bg-red-500" : "bg-gray-300"}`} />
                    {needsReorder ? "Needs Reorder" : "OK"}
                  </span>
                </div>
              </div>
            );
          })()}

          {formError && (
            <p className="text-xs font-medium text-red-500 bg-red-50 border border-red-100 rounded-sm px-4 py-2.5">
              {formError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-white hover:opacity-90 active:scale-[0.97] transition disabled:opacity-60"
              style={{ background: "#FA4900" }}
            >
              {saveLabel}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ─── DeleteModal ──────────────────────────────────────────────────────────────

export type DeleteModalProps = {
  target: InventoryRecord | null;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
};

export function DeleteModal({ target, onCancel, onConfirm, deleting }: Readonly<DeleteModalProps>) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm px-5 pt-4 pb-8 sm:p-7 space-y-5 text-center">
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
          <h2 className="text-base font-bold text-gray-900">Delete Record?</h2>
          <p className="text-sm text-gray-500">
            This will permanently remove the inventory record for{" "}
            <span className="font-semibold text-gray-700">{target.product_details.product_name}</span>{" "}
            at <span className="font-semibold text-gray-700">{target.site}</span>.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3 rounded-sm text-sm font-bold tracking-widest uppercase text-white bg-red-500 hover:bg-red-600 active:scale-[0.97] transition disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
