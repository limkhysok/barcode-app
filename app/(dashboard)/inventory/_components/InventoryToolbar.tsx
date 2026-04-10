"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Search, 
  X, 
  ArrowUpDown,
  ListFilter,
  ChevronDown,
  MapPin,
  Calendar
} from "lucide-react";

interface InventoryToolbarProps {
  siteFilter: string;
  setSiteFilter: (v: string) => void;
  siteOptions: string[];
  quantitySort: string;
  setQuantitySort: (v: string) => void;
  dateSort: string;
  setDateSort: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  filtersOpen: boolean;
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
  filtersRef: React.RefObject<HTMLDivElement | null>;
}

function FilterDropdown({ label, value, options, onChange, icon: Icon }: Readonly<{ 
  label: string; 
  value: string; 
  options: { key: string; label: string }[]; 
  onChange: (v: string) => void;
  icon: any;
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

  const activeLabel = options.find(o => o.key === value)?.label || label;
  const isActive = value !== "";

  let buttonStyles = "border-slate-100 bg-slate-50/50 text-slate-400 hover:text-white hover:bg-orange-500 hover:border-orange-300";
  if (isActive) {
    buttonStyles = "border-orange-500 bg-orange-500 text-white font-black shadow-sm";
  } else if (open) {
    buttonStyles = "border-orange-500 bg-white text-slate-900 shadow-sm";
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`px-2.5 py-1 rounded-sm border text-[12px] font-bold transition-all duration-150 focus:outline-none flex items-center gap-2.5 group ${buttonStyles} min-w-36`}
      >
        <div className={`transition-colors duration-200 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}>
          <Icon size={14} strokeWidth={3} />
        </div>
        <span className="truncate">{activeLabel}</span>
        <ChevronDown 
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}
          strokeWidth={3}
        />
      </button>

      {open && (
        <div className="absolute z-100 left-0 mt-1 min-w-48 bg-white border border-gray-100 rounded-sm shadow-xl animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden">
          <ul className="divide-y divide-gray-50">
            {options.map((o) => (
              <li key={o.key}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.key);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[10px] font-black tracking-widest uppercase transition-colors flex items-center justify-between group/opt ${value === o.key ? "bg-slate-50 text-orange-500 border-l-2 border-orange-500" : "text-gray-500 hover:bg-orange-500 hover:text-white"
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
          </ul>
        </div>
      )}
    </div>
  );
}

function SortToggleButton({ label, dir, onToggle, icon }: Readonly<{ label: string; dir: string; onToggle: () => void; icon?: React.ReactNode }>) {
  const isSelected = dir !== "";
  const isDesc = dir === "desc";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`px-3 py-1 rounded-sm border text-[12px] transition-all flex items-center gap-2.5 focus:outline-none group shrink-0 ${isSelected
        ? "border-orange-500 bg-orange-500 text-white shadow-sm font-black"
        : "border-slate-100 bg-slate-50/50 text-slate-400 hover:bg-orange-600 hover:border-orange-600 hover:text-white font-bold"
      }`}
    >
      {icon && (
        <div className={`transition-colors duration-200 shrink-0 ${isSelected ? "text-white" : "text-gray-400 group-hover:text-white/80"}`}>
          {icon}
        </div>
      )}
      <span className="truncate flex-1 tracking-wider uppercase font-black text-[11px]">{label}</span>
      <div className={`transition-transform duration-300 shrink-0 ${isDesc && isSelected ? "rotate-180" : "rotate-0 opacity-40 group-hover:opacity-100"}`}>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </button>
  );
}

export function InventoryToolbar({
  siteFilter,
  setSiteFilter,
  siteOptions,
  quantitySort,
  setQuantitySort,
  dateSort,
  setDateSort,
  search,
  setSearch,
  filtersOpen,
  setFiltersOpen,
  filtersRef,
}: Readonly<InventoryToolbarProps>) {
  const activeCount = [siteFilter, quantitySort, dateSort].filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-3 transition-all">
      
      {/* Desktop Toolbar */}
      <div className="hidden sm:flex items-center flex-1">
        <div className="flex items-center gap-2 pr-3 border-r border-gray-100">
           <FilterDropdown 
             label="All Sites" 
             value={siteFilter} 
             onChange={setSiteFilter} 
             icon={MapPin}
             options={[
               { key: "", label: "ALL SITES" },
               ...siteOptions.map(s => ({ key: s, label: s.toUpperCase() }))
             ]}
           />
        </div>

        <div className="flex items-center gap-2 px-2">
            <SortToggleButton
              label="Quantity"
              dir={quantitySort}
              onToggle={() => {
                if (!quantitySort) setQuantitySort("desc");
                else if (quantitySort === "desc") setQuantitySort("asc");
                else setQuantitySort("");
              }}
              icon={<ArrowUpDown size={14} strokeWidth={3} />}
            />
            <SortToggleButton
              label="Order Date"
              dir={dateSort}
              onToggle={() => {
                if (!dateSort) setDateSort("asc");
                else if (dateSort === "asc") setDateSort("desc");
                else setDateSort("");
              }}
              icon={<Calendar size={14} strokeWidth={3} />}
            />
        </div>

        <div className="ml-auto flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-sm px-2.5 py-1.5 focus-within:border-orange-200 focus-within:bg-white transition-all w-64 lg:w-80">
          <Search size={14} className="text-slate-400 shrink-0" strokeWidth={3} />
          <input 
            type="text" 
            placeholder="Search products, sites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-[11px] text-slate-900 placeholder:text-slate-300 w-full font-bold uppercase tracking-tight"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-900 transition-colors cursor-pointer">
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Toolbar */}
      <div className="sm:hidden flex items-center justify-between w-full px-1 py-1">
        <div className="relative" ref={filtersRef}>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-3 py-1 rounded-sm border transition-all cursor-pointer ${
              filtersOpen ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-400 border-slate-200 shadow-sm"
            } text-[11px] font-black uppercase tracking-widest`}
          >
            <ListFilter size={14} strokeWidth={3} />
            <span>Filter</span>
            {activeCount > 0 && <span className="ml-1 px-1 bg-orange-600 text-white rounded-full text-[9px]">{activeCount}</span>}
          </button>

          {filtersOpen && (
            <div className="absolute left-0 mt-3 z-50 w-70 bg-white border border-gray-200 rounded-sm shadow-xl p-4 flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter By Site</span>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                   {["", ...siteOptions].map((site) => (
                     <button
                       key={site}
                       onClick={() => { setSiteFilter(site); setFiltersOpen(false); }}
                       className={`w-full text-left px-4 py-2.5 text-[10px] font-black tracking-widest uppercase transition-colors flex items-center justify-between group/opt ${siteFilter === site ? "bg-slate-50 text-orange-500 border-l-2 border-orange-500" : "text-gray-500 hover:bg-orange-500 hover:text-white"
                         }`}
                     >
                       {site || "All Sites"}
                       {siteFilter === site && (
                         <X size={12} className="text-orange-500 group-hover/opt:text-white" />
                       )}
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Sort By Quantity</span>
                  <div className="flex gap-2">
                    {["", "asc", "desc"].map((d) => {
                      const isSelected = quantitySort === d;
                      const buttonStyles = isSelected 
                        ? "bg-black text-white border-black" 
                        : "bg-white text-gray-400 border-gray-100";
                      
                      let label = "Default";
                      if (d === "asc") label = "Low";
                      else if (d === "desc") label = "High";

                      return (
                        <button
                          key={d}
                          onClick={() => { setQuantitySort(d); setFiltersOpen(false); }}
                          className={`flex-1 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider border ${buttonStyles}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Sort By Date</span>
                  <div className="flex gap-2">
                    {["", "asc", "desc"].map((d) => {
                      const isSelected = dateSort === d;
                      const buttonStyles = isSelected 
                        ? "bg-black text-white border-black" 
                        : "bg-white text-gray-400 border-gray-100";
                      
                      let label = "Newest";
                      if (d === "asc") label = "Oldest";

                      return (
                        <button
                          key={d}
                          onClick={() => { setDateSort(d); setFiltersOpen(false); }}
                          className={`flex-1 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider border ${buttonStyles}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setFiltersOpen(false)}
                className="mt-2 w-full py-2 bg-black text-white text-[11px] font-black uppercase rounded shadow-md"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Mobile Search */}
        <div className="flex-1 ml-3 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-sm px-2.5 py-1.5">
          <Search size={14} className="text-gray-400 shrink-0" strokeWidth={2} />
          <input 
            type="text" 
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-slate-900 placeholder:text-gray-300 w-full font-medium"
          />
        </div>
      </div>
    </div>
  );
}
