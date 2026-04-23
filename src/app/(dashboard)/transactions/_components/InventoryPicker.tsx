"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { InventoryRecord } from "@/src/types/inventory.types";

interface InventoryPickerProps {
  inventory: InventoryRecord[];
  value: number;
  onChange: (id: number) => void;
  excludeIds: number[];
}

const InventoryPicker: React.FC<InventoryPickerProps> = ({ inventory, value, onChange, excludeIds }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = inventory.find((r) => r.id === value);

  useEffect(() => {
    setSearch(selected ? `${selected.product_details.product_name} (stock: ${selected.quantity_on_hand})` : "");
  }, [value, selected]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch(selected ? `${selected.product_details.product_name} (stock: ${selected.quantity_on_hand})` : "");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected]);

  useEffect(() => {
    if (!open) return;
    function onScroll() { setOpen(false); }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  function handleFocus() {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setSearch("");
    setOpen(true);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const selectedLabel = selected
      ? selected.product_details.product_name.toLowerCase()
      : "";
    const available = inventory.filter((r) => !excludeIds.includes(r.id) || r.id === value);
    if (!q || q === selectedLabel) return available;
    return available.filter((r) =>
      r.product_details?.product_name?.toLowerCase().includes(q) ||
      r.site?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.product_details?.barcode?.toLowerCase().includes(q)
    );
  }, [inventory, search, excludeIds, value, selected]);

  return (
    <div className="relative flex-1 min-w-0" ref={ref}>
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        placeholder="Search product name or barcode..."
        value={search}
        onFocus={handleFocus}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        className="w-full text-[11px] pr-1 py-1.5 outline-none transition placeholder:text-gray-400 text-gray-900 text-left bg-transparent focus:text-orange-600 font-semibold"
      />

      {open && (
        <div
          className="bg-white border border-slate-950/10 rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
        >
          <ul className="max-h-64 overflow-y-auto no-scrollbar scrollbar-none">
            {filtered.length === 0 && (
              <li className="px-5 py-6 text-center">
                <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No matching results</p>
              </li>
            )}
            {filtered.map((r) => (
              <li key={r.id} className="border-b border-slate-50 last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    onChange(r.id);
                    setSearch(`${r.product_details.product_name} (stock: ${r.quantity_on_hand})`);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3 flex items-start gap-4 transition-all duration-150 ${value === r.id ? "bg-orange-500 text-white" : "text-slate-700 hover:bg-orange-50"
                    }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                      <p className={`text-[12px] font-black uppercase tracking-tight truncate ${value === r.id ? "text-white" : "text-slate-900"}`}>
                        {r.product_details.product_name}
                      </p>
                      <span className={`text-[9px] font-black uppercase shrink-0 ${value === r.id ? "text-white/60" : "text-orange-500"}`}>
                        {r.quantity_on_hand} IN STOCK
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-mono tracking-wider ${value === r.id ? "text-white/70" : "text-slate-400"}`}>
                        {r.product_details.barcode || "NO-BARCODE"}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 mx-0.5" />
                      <span className={`text-[9px] font-bold uppercase tracking-widest truncate ${value === r.id ? "text-white/70" : "text-slate-400"}`}>
                        {r.site} · {r.location}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default InventoryPicker;
