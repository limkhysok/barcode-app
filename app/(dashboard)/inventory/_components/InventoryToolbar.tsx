"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  ArrowUpDown,
  Filter,
  ChevronDown,
  MapPin,
  Calendar,
  Layers,
  Activity,
  BarChart3,
  List,
  LayoutGrid,
} from "lucide-react";

interface InventoryToolbarProps {
  siteFilter: string;
  setSiteFilter: (v: string) => void;
  siteOptions: string[];
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  quantitySort: string;
  setQuantitySort: (v: string) => void;
  dateSort: string;
  setDateSort: (v: string) => void;
  setOrdering: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  filtersOpen: boolean;
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
  filtersRef: React.RefObject<HTMLDivElement | null>;
  viewMode: "list" | "grid";
  setViewMode: (v: "list" | "grid") => void;
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
        className={`px-2.5 py-1 rounded-sm border text-[11px] font-black transition-all duration-150 focus:outline-none flex items-center gap-2.5 group ${buttonStyles} min-w-35 h-8`}
      >
        <div className={`transition-colors duration-200 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`}>
          <Icon size={14} strokeWidth={3} />
        </div>
        <span className="truncate flex-1 text-left uppercase tracking-wider">{activeLabel}</span>
        <ChevronDown 
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`}
          strokeWidth={3}
        />
      </button>

      {open && (
        <div className="absolute z-100 left-0 mt-1 min-w-50 bg-white border border-slate-100 rounded-sm shadow-xl animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden max-h-64 overflow-y-auto">
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
      className={`px-3 py-1 rounded-sm border text-[11px] transition-all flex items-center gap-2.5 focus:outline-none group shrink-0 h-8 ${isSelected
        ? "border-orange-500 bg-orange-500 text-white shadow-sm font-black"
        : "border-slate-100 bg-slate-50/50 text-slate-400 hover:bg-orange-600 hover:border-orange-600 hover:text-white font-bold"
      }`}
    >
      {icon && (
        <div className={`transition-colors duration-200 shrink-0 ${isSelected ? "text-white" : "text-slate-400 group-hover:text-white/80"}`}>
          {icon}
        </div>
      )}
      <span className="truncate flex-1 tracking-widest uppercase font-black">{label}</span>
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
  statusFilter,
  setStatusFilter,
  quantitySort,
  setQuantitySort,
  dateSort,
  setDateSort,
  setOrdering,
  search,
  setSearch,
  filtersOpen,
  setFiltersOpen,
  filtersRef,
  viewMode,
  setViewMode,
}: Readonly<InventoryToolbarProps>) {
  const activeCount = [siteFilter, statusFilter, quantitySort, dateSort].filter(Boolean).length;
  const isFiltered = activeCount > 0 || search !== "";

  // Mobile Filter Button Style
  let mobileFilterClass = "bg-white text-slate-400 border-slate-200 shadow-sm";
  if (filtersOpen) {
    mobileFilterClass = "bg-orange-500 text-white border-orange-500";
  } else if (activeCount > 0) {
    mobileFilterClass = "bg-orange-50 text-orange-500 border-orange-200";
  }

  return (
    <div className="flex flex-wrap items-center gap-3 transition-all">
      
      {/* Desktop Toolbar */}
      <div className="hidden sm:flex items-center flex-1 gap-2">
        <div className="flex items-center gap-1">
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
           <FilterDropdown
             label="All Status"
             value={statusFilter}
             onChange={setStatusFilter}
             icon={Activity}
             options={[
               { key: "", label: "ALL STATUS" },
               { key: "No", label: "GOOD" },
               { key: "LOW", label: "LOW" },
               { key: "no_stock", label: "NO STOCK" },
             ]}
           />
        </div>

        <div className="flex items-center gap-1 pl-1 border-l border-slate-100">
            <SortToggleButton
              label="Qty"
              dir={quantitySort}
              onToggle={() => {
                if (!quantitySort) setQuantitySort("asc");
                else if (quantitySort === "asc") setQuantitySort("desc");
                else setQuantitySort("");
              }}
              icon={<BarChart3 size={13} strokeWidth={3} />}
            />
            <SortToggleButton
              label="Date"
              dir={dateSort}
              onToggle={() => {
                if (!dateSort) setDateSort("desc");
                else if (dateSort === "desc") setDateSort("asc");
                else setDateSort("");
              }}
              icon={<Calendar size={13} strokeWidth={3} />}
            />
        </div>

        {isFiltered && (
           <button 
             onClick={() => { setSiteFilter(""); setStatusFilter(""); setOrdering("-updated_at"); setSearch(""); }}
             className="px-3 h-8 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-red-500 transition-colors border border-dashed border-slate-200 rounded-sm hover:border-red-200 hover:bg-red-50 cursor-pointer"
           >
             Clear All
           </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-sm px-2.5 h-8 focus-within:border-orange-200 focus-within:bg-white transition-all w-64 lg:w-80 overflow-hidden">
            <Search size={14} className="text-slate-400 shrink-0" strokeWidth={3} />
            <input
              type="text"
              placeholder="Search record..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] text-slate-900 placeholder:text-slate-300 w-full font-bold uppercase tracking-tight"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-900 transition-colors cursor-pointer">
                <X size={14} strokeWidth={3} />
              </button>
            )}
          </div>
          <div className="hidden lg:flex items-center border border-slate-200 rounded-sm overflow-hidden h-8">
            <button
              onClick={() => setViewMode("list")}
              className={`px-2 h-full transition-colors cursor-pointer ${viewMode === "list" ? "bg-black text-white" : "text-slate-400 hover:text-slate-600"}`}
              title="List view"
            >
              <List size={14} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2 h-full transition-colors cursor-pointer ${viewMode === "grid" ? "bg-black text-white" : "text-slate-400 hover:text-slate-600"}`}
              title="Grid view"
            >
              <LayoutGrid size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Toolbar */}
      <div className="sm:hidden flex items-center justify-between w-full gap-2">
        <div className="relative" ref={filtersRef}>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-3 h-8 rounded-sm border transition-all cursor-pointer ${mobileFilterClass} text-[11px] font-black uppercase tracking-widest`}
          >
            <Filter size={14} strokeWidth={3} />
            <span>Filter</span>
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-orange-600 text-white text-[8px] rounded-full flex items-center justify-center font-black border border-white">
                {activeCount}
              </span>
            )}
          </button>

          {filtersOpen && (
            <div className="absolute left-0 mt-3 z-50 w-72 bg-white border border-slate-200 rounded-sm shadow-2xl p-4 flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
              
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Layers size={10} /> Filter By Site
                </span>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                   {["All Sites", ...siteOptions].map((site) => {
                     const isSelected = (site === "All Sites" ? "" : site) === siteFilter;
                     return (
                       <button
                         key={site}
                         onClick={() => { setSiteFilter(site === "All Sites" ? "" : site); setFiltersOpen(false); }}
                         className={`w-full text-left px-3 py-2 text-[10px] font-black tracking-widest uppercase transition-colors flex items-center justify-between rounded-sm ${isSelected ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                       >
                         {site}
                       </button>
                     );
                   })}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Activity size={10} /> Reorder Status
                </span>
                <div className="flex flex-col gap-1 pr-1">
                   {[
                     { key: "", label: "ALL STATUS" },
                     { key: "No", label: "GOOD" },
                     { key: "LOW", label: "LOW" },
                     { key: "no_stock", label: "NO STOCK" },
                   ].map((s) => {
                     const isSelected = s.key === statusFilter;
                     return (
                       <button
                         key={s.label}
                         onClick={() => { setStatusFilter(s.key); setFiltersOpen(false); }}
                         className={`w-full text-left px-3 py-2 text-[10px] font-black tracking-widest uppercase transition-colors flex items-center justify-between rounded-sm ${isSelected ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                       >
                         {s.label}
                       </button>
                     );
                   })}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <ArrowUpDown size={10} /> Sort By
                </span>
                <div className="flex flex-wrap gap-2">
                    <SortToggleButton
                      label="Qty"
                      dir={quantitySort}
                      onToggle={() => {
                        if (!quantitySort) setQuantitySort("asc");
                        else if (quantitySort === "asc") setQuantitySort("desc");
                        else setQuantitySort("");
                      }}
                    />
                    <SortToggleButton
                      label="Date"
                      dir={dateSort}
                      onToggle={() => {
                        if (!dateSort) setDateSort("desc");
                        else if (dateSort === "desc") setDateSort("asc");
                        else setDateSort("");
                      }}
                    />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-50">
                <button
                  onClick={() => { setSiteFilter(""); setStatusFilter(""); setOrdering("-updated_at"); setFiltersOpen(false); }}
                  className="flex-1 py-2 border border-slate-100 text-slate-400 text-[10px] font-black uppercase rounded-sm hover:text-red-500"
                >
                  Reset
                </button>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="flex-1 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-sm"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Search + View Toggle */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-sm px-2.5 h-8">
            <Search size={14} className="text-slate-400 shrink-0" strokeWidth={3} />
            <input
              type="text"
              placeholder="Search record..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] text-slate-900 placeholder:text-slate-300 w-full font-bold uppercase tracking-tight"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
