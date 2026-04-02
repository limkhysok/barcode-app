"use client";

import React, { useEffect, useRef, useState } from "react";

interface SortSelectProps {
  value: string;
  onChange: (v: string) => void;
}

const SortSelect: React.FC<SortSelectProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options = [
    { key: "-transaction_date", label: "Newest First" },
    { key: "transaction_date", label: "Oldest First" },
    { key: "-total_transaction_value", label: "High Value" },
    { key: "total_transaction_value", label: "Low Value" },
  ];

  const current = options.find((o) => o.key === value) ?? options[0];

  return (
    <div className="relative min-w-37.5" ref={ref}>
      <button
        type="button"
        onMouseEnter={() => { }}
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-3 py-1 rounded-md border border-black text-[13px] font-light text-left flex items-center justify-between gap-2 transition focus:outline-none bg-gray-50 text-gray-900 ${open ? "ring-1 ring-black" : "hover:bg-slate-50"}`}
      >
        <span className="truncate">{current.label}</span>
        <svg className="w-3.5 h-3.5 text-slate-800 shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <ul className="absolute z-200 top-full mt-1 w-full bg-white border border-black rounded-sm shadow-lg overflow-hidden">
          {options.map((o) => (
            <li key={o.key} className="border-b border-black last:border-b-0">
              <button
                type="button"
                onClick={() => { onChange(o.key); setOpen(false); }}
                className={`w-full text-left px-3 py-2.5 text-[11px] font-semibold tracking-wide transition ${value === o.key ? "bg-black text-white" : "text-slate-700 hover:bg-slate-50"
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

export default SortSelect;
