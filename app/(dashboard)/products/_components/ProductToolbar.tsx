"use client";

import React, { useState, useRef, useEffect } from "react";
import type { SortDir } from "./ProductsTable";
import { Search, X, ChevronDown, Filter, Tag, Users } from "lucide-react";

interface ProductToolbarProps {
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  supplierFilter: string;
  setSupplierFilter: (v: string) => void;
  sortField: string;
  setSortField: (v: string) => void;
  sortDir: SortDir;
  setSortDir: (v: SortDir) => void;
  search: string;
  setSearch: (v: string) => void;
  categories: string[];
  suppliers: string[];
  totalResults: number;
  filtersOpen: boolean;
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
  filtersRef: React.RefObject<HTMLDivElement | null>;
  viewMode: "list" | "grid";
  setViewMode: (v: "list" | "grid") => void;
}

// Reusable Dropdown Component
function DropdownFilter({
  label,
  value,
  onChange,
  options,
  icon: Icon
}: Readonly<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  icon: React.ElementType;
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

  const activeLabel = value || `All ${label}s`;
  const isActive = value !== "";

  let buttonStyles = "border-gray-100 bg-gray-50/50 text-gray-400 hover:text-white hover:bg-orange-500 hover:border-orange-300";
  if (isActive) buttonStyles = "border-orange-500 bg-orange-500 text-white font-black shadow-sm";
  else if (open) buttonStyles = "border-orange-500 bg-white text-gray-900 shadow-sm";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`px-2.5 py-1 rounded-sm border text-[11px] font-black transition-all duration-150 focus:outline-none flex items-center gap-2.5 group ${buttonStyles} min-w-35 h-8`}
      >
        <div className={`transition-colors duration-200 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}>
          <Icon size={14} strokeWidth={3} />
        </div>
        <span className="truncate flex-1 text-left uppercase tracking-wider">{activeLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}
          strokeWidth={3}
        />
      </button>

      {open && (
        <div className="absolute z-100 left-0 mt-1 min-w-50 bg-white border border-gray-100 rounded-sm shadow-xl animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden max-h-64 overflow-y-auto">
          <ul className="divide-y divide-gray-50">
            <li>
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[10px] font-black tracking-widest uppercase transition-colors flex items-center justify-between group/opt ${value === "" ? "bg-slate-50 text-orange-500 border-l-2 border-orange-500" : "text-gray-500 hover:bg-orange-500 hover:text-white"}`}
              >
                All {label}s
              </button>
            </li>
            {options.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-[10px] font-black tracking-widest uppercase transition-colors flex items-center justify-between group/opt ${value === opt ? "bg-slate-50 text-orange-500 border-l-2 border-orange-500" : "text-gray-500 hover:bg-orange-500 hover:text-white"}`}
                >
                  {opt}
                  {value === opt && (
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

export function ProductToolbar({
  categoryFilter, setCategoryFilter,
  supplierFilter, setSupplierFilter,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sortField, setSortField,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sortDir, setSortDir,
  search, setSearch,
  categories, suppliers,
  totalResults,
  filtersOpen, setFiltersOpen, filtersRef,
  viewMode, setViewMode,
}: Readonly<ProductToolbarProps>) {
  const activeCount = [categoryFilter, supplierFilter, search].filter(Boolean).length;
  const isFiltered = activeCount > 0;

  const clearAll = () => {
    setCategoryFilter("");
    setSupplierFilter("");
    setSearch("");
    setSortField("product_name");
    setSortDir("asc");
  };

  let mobileFilterBtnClass = "bg-white text-gray-400 border-gray-200";
  if (filtersOpen) mobileFilterBtnClass = "bg-orange-500 text-white border-orange-500";
  else if (isFiltered) mobileFilterBtnClass = "bg-orange-50 text-orange-500 border-orange-300";

  return (
    <div className="flex flex-col gap-3">
      {/* ── Top Row: Search & View Modes ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Desktop Toolbar */}
        <div className="hidden sm:flex items-center flex-1 gap-2">
          <DropdownFilter 
            label="Category" 
            value={categoryFilter} 
            onChange={setCategoryFilter} 
            options={categories} 
            icon={Tag} 
          />
          <DropdownFilter 
            label="Supplier" 
            value={supplierFilter} 
            onChange={setSupplierFilter} 
            options={suppliers} 
            icon={Users} 
          />
          
          {isFiltered && (
             <button
                onClick={clearAll}
                className="px-3 h-8 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 border border-dashed border-gray-200 rounded-sm hover:border-red-200 hover:bg-red-50"
             >
                <X size={12} strokeWidth={3} />
                Clear All
             </button>
          )}

          {/* Search result count */}
          <div className="ml-2 flex items-center gap-2 px-3 h-8 bg-slate-50 border border-slate-100 rounded-sm">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {totalResults} Products found
             </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-gray-100 rounded-sm px-2.5 h-8 focus-within:border-orange-200 focus-within:bg-white transition-all w-64 lg:w-80 overflow-hidden">
              <Search size={14} className="text-gray-400 shrink-0" strokeWidth={3} />
              <input
                type="text"
                placeholder="Search product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-[11px] text-slate-900 placeholder:text-gray-300 w-full font-bold uppercase tracking-tight"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-300 hover:text-slate-900 transition-colors cursor-pointer">
                  <X size={14} strokeWidth={2} />
                </button>
              )}
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-0 bg-slate-100 border border-gray-100 rounded-sm h-8 overflow-hidden">
              {(["list", "grid"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center justify-center w-8 h-full transition-all duration-150 cursor-pointer ${viewMode === mode ? "bg-orange-500 text-white shadow-inner" : "text-gray-400 hover:text-orange-500"}`}
                >
                  {mode === "list" ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Filter Button */}
        <div className="sm:hidden relative" ref={filtersRef}>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-3 h-8 rounded-sm border text-[11px] font-black tracking-widest transition-all cursor-pointer ${mobileFilterBtnClass}`}
          >
            <Filter size={14} strokeWidth={3} />
            <span>FILTER</span>
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-orange-600 text-white text-[8px] rounded-full flex items-center justify-center font-black border border-white">
                {activeCount}
              </span>
            )}
          </button>
          
          {filtersOpen && (
            <div className="absolute left-0 mt-3 z-50 w-72 bg-white border border-gray-200 rounded-sm shadow-2xl p-4 flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
               {/* Mobile results feedback */}
               <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-2">
                  Showing {totalResults} Results
               </div>

               {/* Category filter */}
               <div className="space-y-2">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <Tag size={10} /> Category
                 </span>
                 <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                   {["All Categories", ...categories].map((cat) => {
                     const val = cat === "All Categories" ? "" : cat;
                     return (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(val)}
                        className={`w-full text-left px-3 py-2 text-[10px] font-black tracking-widest uppercase transition-colors flex items-center justify-between rounded-sm ${categoryFilter === val ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-slate-50"}`}
                      >
                        {cat}
                      </button>
                     );
                   })}
                 </div>
               </div>

               {/* Supplier filter */}
               <div className="space-y-2">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <Users size={10} /> Supplier
                 </span>
                 <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                   {["All Suppliers", ...suppliers].map((sup) => {
                     const val = sup === "All Suppliers" ? "" : sup;
                     return (
                      <button
                        key={sup}
                        onClick={() => setSupplierFilter(val)}
                        className={`w-full text-left px-3 py-2 text-[10px] font-black tracking-widest uppercase transition-colors flex items-center justify-between rounded-sm ${supplierFilter === val ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-slate-50"}`}
                      >
                        {sup}
                      </button>
                     );
                   })}
                 </div>
               </div>

               <div className="flex gap-2 pt-2 border-t border-slate-50">
                  <button onClick={clearAll} className="flex-1 py-2 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 border border-gray-100 rounded-sm">
                    Reset
                  </button>
                  <button onClick={() => setFiltersOpen(false)} className="flex-1 py-2 text-[10px] font-black uppercase bg-slate-900 text-white rounded-sm">
                    Done
                  </button>
               </div>
            </div>
          )}
        </div>

        {/* Mobile Search */}
        <div className="sm:hidden flex-1 flex items-center gap-2 bg-slate-50 border border-gray-100 rounded-sm px-2.5 h-8">
          <Search size={14} className="text-gray-400 shrink-0" strokeWidth={3} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-[11px] text-slate-900 placeholder:text-gray-300 w-full font-bold uppercase tracking-tight"
          />
        </div>
      </div>

      {/* ── Filter Pills Row (Desktop) ── */}
      {isFiltered && (
        <div className="hidden sm:flex flex-wrap items-center gap-2 py-1">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mr-1">Active Filters:</span>
          {search && (
            <span className="flex items-center gap-2 px-2 py-1 bg-slate-100 text-slate-900 text-[10px] font-bold border border-slate-200 rounded-sm shadow-sm">
              <Search size={10} className="text-slate-400" />
              "{search}"
              <button onClick={() => setSearch("")} className="ml-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"><X size={12} strokeWidth={3} /></button>
            </span>
          )}
          {categoryFilter && (
            <span className="flex items-center gap-2 px-2 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold border border-orange-100 rounded-sm shadow-sm">
              <Tag size={10} className="text-orange-400" />
              {categoryFilter}
              <button onClick={() => setCategoryFilter("")} className="ml-1 text-orange-400 hover:text-red-500 transition-colors cursor-pointer"><X size={12} strokeWidth={3} /></button>
            </span>
          )}
          {supplierFilter && (
            <span className="flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 rounded-sm shadow-sm">
              <Users size={10} className="text-blue-400" />
              {supplierFilter}
              <button onClick={() => setSupplierFilter("")} className="ml-1 text-blue-400 hover:text-red-500 transition-colors cursor-pointer"><X size={12} strokeWidth={3} /></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
