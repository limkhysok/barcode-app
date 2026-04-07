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

  const isActive = value !== "";
  let buttonStyles = "border-gray-100 bg-gray-50/50 text-gray-400 hover:text-white hover:bg-orange-500 hover:border-orange-300";
  if (isActive) {
    buttonStyles = "border-orange-500 bg-orange-500 text-white font-black shadow-sm";
  } else if (open) {
    buttonStyles = "border-orange-500 bg-white text-gray-900 shadow-sm";
  }

  const iconColorClass = isActive ? "text-white" : "text-gray-400";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`px-2.5 py-1.5 rounded-lg border text-[12px] font-bold transition-all duration-150 focus:outline-none flex items-center gap-2.5 group ${buttonStyles} min-w-[130px]`}
      >
        <div className={`transition-colors duration-200 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </div>
        <span className={`truncate ${isActive ? "text-white" : ""}`}>{getActiveLabel()}</span>
        <svg
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:text-white ${
            open ? "rotate-180" : ""
          } ${iconColorClass}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-[100] left-0 mt-1 min-w-[190px] bg-white border border-gray-100 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden">
          <ul className="divide-y divide-gray-50">
            {options.map((o) => (
              <li key={o.key}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.key);
                    setOpen(false);
                    setCustomMode(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[10px] font-black tracking-[0.1em] uppercase transition-colors flex items-center justify-between group/opt ${value === o.key ? "bg-slate-50 text-orange-500 border-l-2 border-orange-500" : "text-gray-500 hover:bg-orange-500 hover:text-white"
                    }`}
                >
                  {o.label}
                  {value === o.key && (
                    <svg className="w-3 h-3 text-orange-500 group-hover/opt:text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
            <li>
              {customMode ? (
                <div className="p-3 bg-slate-50/50">
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
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-black font-semibold outline-none focus:border-orange-500 bg-white transition-all shadow-inner"
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
