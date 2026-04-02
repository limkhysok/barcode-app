"use client";

import { useEffect, useRef, useState } from "react";

export function CustomSelect({ id, label, value, onChange, options, placeholder, openUp, triggerLabel }: Readonly<{
  id: string;
  label?: string;
  value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  openUp?: boolean;
  triggerLabel?: string;
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
    <div className={label ? "space-y-1.5" : ""} ref={ref}>
      {label && (
        <label htmlFor={id} className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400">
          <span className="inline-block w-1 h-3 rounded-full" style={{ background: "#FA4900" }} />
          {label}
        </label>
      )}
      <div className="relative">
        <button
          id={id} type="button" onClick={() => setOpen((v) => !v)}
          className={`w-full px-3 py-1 rounded-md border border-black text-[13px] font-light text-left flex items-center justify-between gap-2 transition focus:outline-none bg-gray-50 text-gray-900 ${open ? "ring-1 ring-black" : "hover:bg-slate-50"}`}
        >
          <span className="truncate">{triggerLabel ?? (selected ? selected.label : (placeholder ?? "Select…"))}</span>
          <svg className="w-3.5 h-3.5 text-slate-800 shrink-0 transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {open && (
          <ul className={`absolute z-200 w-full bg-white border border-black rounded-sm shadow-lg overflow-hidden ${openUp ? "bottom-full mb-1" : "top-full mt-1"}`}>
            {options.map((opt) => {
              const active = String(opt.value) === String(value);
              return (
                <li key={opt.value} >
                  <button type="button"
                    onClick={() => { onChange(String(opt.value)); setOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-[11px] font-semibold tracking-wide transition text-slate-700 hover:bg-gray-100 flex items-center justify-between">
                    {opt.label}
                    {active && (
                      <svg className="w-3.5 h-3.5 text-black shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
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
