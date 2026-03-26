"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InventoryRecord, InventoryPayload } from "@/src/types/inventory.types";
import type { Product } from "@/src/types/product.types";

// ─── Shared style constants ──────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent transition";
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

// ─── CustomSelect ─────────────────────────────────────────────────────────────

function CustomSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
}: Readonly<{
  id: string;
  label: string;
  value: string | number;
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
            open
              ? "border-[#FA4900] ring-2 ring-[#FA4900]/20"
              : "border-gray-200 hover:border-gray-300"
          } ${selected ? "text-gray-900" : "text-gray-400"}`}
        >
          <span className="truncate">{selected ? selected.label : (placeholder ?? "Select…")}</span>
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
          <ul className="absolute z-50 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1 max-h-52 overflow-y-auto">
            {options.map((opt) => {
              const active = String(opt.value) === String(value);
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(String(opt.value));
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition ${
                      active ? "font-bold text-white" : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={
                      active ? { background: "linear-gradient(135deg, #FA4900, #b91c1c)" } : {}
                    }
                  >
                    <span className="truncate">{opt.label}</span>
                    {active && (
                      <svg
                        className="w-4 h-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
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

// ─── FilterableProductSelect ──────────────────────────────────────────────────

function FilterableProductSelect({
  products,
  value,
  onChange,
}: {
  products: Product[];
  value: number;
  onChange: (id: number) => void;
}) {
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
          className={`w-full px-4 py-2.5 rounded-xl border text-sm text-left flex items-center justify-between gap-2 transition focus:outline-none ${
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
}: InventoryModalProps) {
  if (!open) return null;

  const saveLabel = saving ? "Saving…" : editing ? "Save Changes" : "Create Record";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 space-y-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">
          {editing ? "Edit Inventory Record" : "Create Inventory Record"}
        </h2>

        <form onSubmit={onSave} className="space-y-4">
          <FilterableProductSelect
            products={products}
            value={form.product}
            onChange={(id) => setForm((f) => ({ ...f, product: id }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              id="site"
              label="Site"
              value={form.site}
              placeholder="Select a site…"
              onChange={(v) => setForm((f) => ({ ...f, site: v }))}
              options={[
                { value: "Store A", label: "Store A" },
                { value: "Store B", label: "Store B" },
              ]}
            />
            <Field
              label="Location"
              id="location"
              value={form.location}
              placeholder="A1-Shelf-5"
              onChange={(v) => setForm((f) => ({ ...f, location: v }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Qty"
              id="quantity_on_hand"
              type="number"
              value={form.quantity_on_hand}
              onChange={(v) => setForm((f) => ({ ...f, quantity_on_hand: parseInt(v) || 0 }))}
            />
          </div>

          {formError && <p className="text-xs text-red-500">{formError}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-500 bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm"
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

export function DeleteModal({ target, onCancel, onConfirm, deleting }: DeleteModalProps) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 space-y-5 text-center">
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
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 transition hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold transition hover:bg-red-600"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}