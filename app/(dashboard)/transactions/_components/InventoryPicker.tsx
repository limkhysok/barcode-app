"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { InventoryRecord } from "@/src/types/inventory.types";
import { ringStyle } from "../utils/constants";

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
    setSearch(selected ? `${selected.product_details.product_name} — ${selected.site}` : "");
  }, [value, selected]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch(selected ? `${selected.product_details.product_name} — ${selected.site}` : "");
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
      ? `${selected.product_details.product_name} — ${selected.site}`.toLowerCase()
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
        placeholder="Search by name or barcode…"
        value={search}
        onFocus={handleFocus}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        className="w-full pl-4 pr-10 py-2 rounded-sm border border-black text-sm bg-gray-50 outline-none focus:ring-2 focus:border-transparent focus:bg-white transition placeholder:text-gray-300 text-gray-900"
        style={ringStyle}
      />
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
          <rect x="5" y="4" width="1" height="16" rx="0.5" fill="currentColor" />
          <rect x="7.5" y="4" width="2" height="16" rx="0.5" fill="currentColor" />
          <rect x="11" y="4" width="1" height="16" rx="0.5" fill="currentColor" />
          <rect x="13.5" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
          <rect x="16.5" y="4" width="1" height="16" rx="0.5" fill="currentColor" />
          <rect x="19" y="4" width="1.5" height="16" rx="0.5" fill="currentColor" />
          <rect x="21.5" y="4" width="1" height="16" rx="0.5" fill="currentColor" />
        </svg>
      </div>
      {open && (
        <div
          className="bg-white border border-black rounded-sm shadow-lg overflow-hidden"
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
        >
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-xs text-gray-400 font-medium">No records found.</li>
            )}
            {filtered.map((r) => (
              <li key={r.id} className="border-b border-black last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    onChange(r.id);
                    setSearch(`${r.product_details.product_name} — ${r.site}`);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-[11px] font-semibold tracking-wide flex items-start gap-3 transition ${value === r.id ? "bg-black text-white" : "text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      {r.product_details.product_name}
                      {r.product_details.barcode && (
                        <span className={`ml-1.5 font-mono font-normal ${value === r.id ? "text-white/60" : "text-gray-400"}`}>
                          ({r.product_details.barcode})
                        </span>
                      )}
                    </p>
                    <p className={`text-[10px] truncate font-normal ${value === r.id ? "text-white/60" : "text-gray-400"}`}>
                      {r.site} · {r.location} · Qty: {r.quantity_on_hand}
                    </p>
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
