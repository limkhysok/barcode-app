"use client";

import { CustomSelect } from "@/src/components/ui/CustomSelect";
import type { Product, ProductPayload } from "@/src/types/product.types";

const REORDER_PRESETS = new Set([5, 10, 15, 20]);

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

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  editing: Product | null;
  form: ProductPayload;
  setForm: React.Dispatch<React.SetStateAction<ProductPayload>>;
  reorderCustom: boolean;
  setReorderCustom: (val: boolean) => void;
  saving: boolean;
  formError: string;
  onSave: (e: React.SyntheticEvent) => Promise<void>;
}

export function ProductModal({
  open,
  onClose,
  editing,
  form,
  setForm,
  reorderCustom,
  setReorderCustom,
  saving,
  formError,
  onSave,
}: Readonly<ProductModalProps>) {
  if (!open) return null;

  let saveLabel = "Add Product";
  if (saving) saveLabel = "Saving…";
  else if (editing) saveLabel = "Save Changes";

  return (
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
          <button onClick={onClose}
            className="p-1.5 rounded-sm text-gray-400 hover:text-black hover:bg-gray-100 transition-all shrink-0 active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSave} className="flex-1 overflow-y-auto p-5 space-y-4 bg-white min-h-0">
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
            <button type="button" onClick={onClose}
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
  );
}
