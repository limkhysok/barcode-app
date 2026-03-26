"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InventoryRecord, InventoryPayload } from "@/src/types/inventory.types";
import type { Product } from "@/src/types/product.types";

// ─── Shared style constants ──────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent transition";
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
      <label htmlFor={id} className="text-xs font-bold tracking-widest uppercase text-gray-500">
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
      <label htmlFor="site" className="text-xs font-bold tracking-widest uppercase text-gray-500">
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
          className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
            open ? "border-[#FA4900] ring-2 ring-[#FA4900]/20" : "border-gray-200"
          }`}
        />
        {open && (filtered.length > 0 || showCustom) && (
          <ul className="absolute z-50 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1">
            {filtered.map((site) => {
              const active = value === site;
              return (
                <li key={site}>
                  <button
                    type="button"
                    onClick={() => select(site)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition ${
                      active ? "font-bold text-white" : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={active ? { background: "linear-gradient(135deg, #FA4900, #b91c1c)" } : {}}
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
              <li>
                <button
                  type="button"
                  onClick={() => select(input.trim())}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#FA4900] font-semibold hover:bg-orange-50 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
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

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.product_name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
    );
  }, [products, search]);

  const selected = products.find((p) => p.id === value);

  return (
    <div className="space-y-1.5" ref={ref}>
      <label htmlFor="product" className="text-xs font-bold tracking-widest uppercase text-gray-500">
        Product
      </label>
      <div className="relative">
        <button
          id="product"
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`w-full px-4 py-3 rounded-xl border text-sm text-left flex items-center justify-between gap-2 transition focus:outline-none ${
            open
              ? "border-[#FA4900] ring-2 ring-[#FA4900]/20"
              : "border-gray-200 hover:border-gray-300"
          } ${selected ? "text-gray-900" : "text-gray-400"}`}
        >
          <span className="truncate">
            {selected ? `${selected.product_name} (${selected.barcode})` : "Select a product…"}
          </span>
          <svg
            className="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {open && (
          <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1">
            <div className="px-3 py-2">
              <input
                type="text"
                placeholder="Search by name or barcode…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent"
                style={{ ...ringStyle, marginBottom: 4 }}
              />
            </div>
            <ul className="max-h-60 overflow-y-auto">
              {filtered.length === 0 && (
                <li className="px-4 py-2.5 text-sm text-gray-400">No products found.</li>
              )}
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(p.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition ${
                      value === p.id
                        ? "font-bold text-white bg-linear-to-r from-orange-500 to-red-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="truncate">{p.product_name}</span>
                    <span className="ml-auto text-xs text-gray-400 font-mono">{p.barcode}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg px-5 pt-4 pb-8 sm:p-7 space-y-5 max-h-[95vh] overflow-y-auto">

        {/* Mobile drag handle */}
        <div className="flex justify-center sm:hidden mb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <h2 className="text-lg font-bold text-gray-900">
          {editing ? "Edit Inventory Record" : "Create Inventory Record"}
        </h2>

        <form onSubmit={onSave} className="space-y-4">
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

          {formError && <p className="text-xs text-red-500">{formError}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 active:scale-[0.97] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm active:scale-[0.97] transition"
              style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}
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
        <h2 className="text-base font-bold text-gray-900">Delete Record?</h2>
        <p className="text-sm text-gray-500">
          This will permanently remove the inventory record for{" "}
          <span className="font-semibold text-gray-700">
            {target.product_details.product_name}
          </span>{" "}
          at <span className="font-semibold text-gray-700">{target.site}</span>.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-sm font-bold text-gray-600 active:scale-[0.97] transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold active:scale-[0.97] transition hover:bg-red-600"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}