"use client";

import React, { useEffect, useRef, useState } from "react";

export type DateFilterValue = "" | "today" | "7d" | "30d" | (string & {});

interface DateFilterProps {
  value: DateFilterValue;
  onChange: (v: DateFilterValue) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCustomMode(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options: { key: DateFilterValue; label: string }[] = [
    { key: "", label: "All Dates" },
    { key: "today", label: "Today" },
    { key: "7d", label: "Last 7 Days" },
    { key: "30d", label: "Last 30 Days" },
  ];

  const getActiveLabel = () => {
    const opt = options.find((o) => o.key === value);
    if (opt) return opt.label;
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return "All Dates";
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`px-3 py-1 rounded-md border text-[13px] font-light transition-all duration-150 focus:outline-none flex items-center gap-2 ${open || value ? "border-black bg-white ring-1 ring-black" : "border-black/70 bg-slate-50 text-gray-900 hover:text-black hover:bg-white"
          }`}
      >
        <span className={value ? "text-black" : ""}>{getActiveLabel()}</span>
        <svg className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-[100] left-0 mt-1 min-w-[180px] bg-white border border-black rounded-sm shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden">
          <ul className="divide-y divide-black/5">
            {options.map((o) => (
              <li key={o.key}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.key);
                    setOpen(false);
                    setCustomMode(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[10px] font-black tracking-[0.1em] uppercase transition-colors flex items-center justify-between ${value === o.key ? "bg-slate-100 text-black" : "text-gray-500 hover:bg-gray-50 hover:text-black"
                    }`}
                >
                  {o.label}
                  {value === o.key && (
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
            <li>
              {customMode ? (
                <div className="p-3 bg-slate-50">
                  <input
                    type="date"
                    autoFocus
                    value={(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "")}
                    onChange={(e) => {
                      if (e.target.value) {
                        onChange(e.target.value);
                        setOpen(false);
                        setCustomMode(false);
                      }
                    }}
                    className="w-full border border-black/20 rounded-sm px-2 py-1.5 text-xs text-black font-semibold outline-none focus:border-black transition-all"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCustomMode(true)}
                  className={`w-full text-left px-4 py-2.5 text-[10px] font-black tracking-[0.1em] uppercase transition-colors flex items-center justify-between ${/^\d{4}-\d{2}-\d{2}$/.test(value) ? "bg-slate-100 text-black" : "text-gray-500 hover:bg-gray-50 hover:text-black"
                    }`}
                >
                  Custom Date
                </button>
              )}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DateFilter;
