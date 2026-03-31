"use client";

import React, { useEffect, useRef, useState } from "react";
import { TxTypeFilter } from "../utils/constants";

interface TypeFilterSelectProps {
  value: TxTypeFilter;
  onChange: (v: TxTypeFilter) => void;
}

const TypeFilterSelect: React.FC<TypeFilterSelectProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options: { key: TxTypeFilter; label: string }[] = [
    { key: "",        label: "All Types"  },
    { key: "Receive", label: "Receive"    },
    { key: "Sale",    label: "Sale"       },
  ];
  const current = options.find((o) => o.key === value) ?? options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-4 py-2 rounded-sm border text-sm font-medium text-left flex items-center justify-between gap-2 transition focus:outline-none bg-gray-50 ${
          open ? "border-black ring-1 ring-black" : "border-black hover:bg-slate-50"
        } ${value === "" ? "text-gray-300" : "text-gray-900"}`}
      >
        <span className="truncate">{current.label}</span>
        <svg className="w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <ul className="absolute z-200 top-full mt-1 w-full bg-white border border-black rounded-sm shadow-lg overflow-hidden">
          {options.map((o) => (
            <li key={o.key || "all"} className="border-b border-black last:border-b-0">
              <button
                type="button"
                onClick={() => { onChange(o.key); setOpen(false); }}
                className={`w-full text-left px-3 py-2.5 text-[11px] font-semibold tracking-wide transition ${
                  value === o.key ? "bg-black text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TypeFilterSelect;
