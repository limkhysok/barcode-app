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
    { key: "transaction_date",  label: "Oldest First" },
    { key: "-total_transaction_value", label: "High Value" },
    { key: "total_transaction_value",  label: "Low Value" },
  ];

  const current = options.find((o) => o.key === value) ?? options[0];

  return (
    <div className="relative min-w-[150px]" ref={ref}>
      <button
        type="button"
        onMouseEnter={() => {}}
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-4 py-2 rounded-sm border-2 text-[10px] font-black tracking-widest uppercase text-left flex items-center justify-between gap-2 transition focus:outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-slate-50 border-black text-gray-900`}
      >
        <span className="truncate">{current.label}</span>
        <svg className="w-3.5 h-3.5 text-slate-800 shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <ul className="absolute z-[200] bottom-full mb-1 w-full bg-white border-2 border-black rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          {options.map((o) => (
            <li key={o.key} className="border-b-2 border-black last:border-b-0 text-gray-900">
              <button
                type="button"
                onClick={() => { onChange(o.key); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-[9px] font-black tracking-[0.2em] uppercase transition ${
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

export default SortSelect;
