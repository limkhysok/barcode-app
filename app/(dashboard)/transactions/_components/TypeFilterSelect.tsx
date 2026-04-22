"use client";

import React, { useEffect, useRef, useState } from "react";
type TxTypeFilter = "" | "Receive" | "Sale";

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
    { key: "", label: "All Types" },
    { key: "Receive", label: "Receive" },
    { key: "Sale", label: "Sale" },
  ];
  const current = options.find((o) => o.key === value) ?? options[0];

  const isActive = value !== "";
  let buttonStyles = "border-gray-100 bg-gray-50/50 text-gray-400 hover:bg-orange-500 hover:border-orange-200 hover:text-white";
  if (isActive) {
    buttonStyles = "border-orange-500 bg-orange-500 text-white font-black";
  } else if (open) {
    buttonStyles = "border-orange-500 bg-white text-gray-900 shadow-sm";
  }

  const iconColorClass = isActive ? "text-white" : "text-slate-500";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-2.5 h-8 rounded-sm border border-slate-500 text-[12px] font-bold text-left flex items-center justify-between gap-2.5 transition-all focus:outline-none group ${buttonStyles} min-w-30`}
      >
        <div className="flex items-center gap-2 truncate">
          <div className={`transition-colors duration-200 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-9.75 0h9.75" />
            </svg>
          </div>
          <span className="truncate">{current.label}</span>
        </div>
        <svg
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:text-white ${iconColorClass}`}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <ul className="absolute z-200 top-full mt-1 w-full bg-white border border-gray-100 rounded-sm shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {options.map((o) => (
            <li key={o.key || "all"} >
              <button
                type="button"
                onClick={() => { onChange(o.key); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-[10px] font-black tracking-widest uppercase transition-colors text-gray-800 hover:bg-orange-500 hover:text-white flex items-center justify-between group/opt"
              >
                {o.label}
                {value === o.key && (
                  <svg className="w-3.5 h-3.5 text-orange-500 shrink-0 group-hover/opt:text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TypeFilterSelect;
