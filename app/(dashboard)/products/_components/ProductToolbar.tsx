"use client";

import React, { useState, useRef, useEffect } from "react";
import type { SortDir } from "./ProductsTable";
import { Search, X, ChevronDown, Filter, Tag, Users, List, LayoutGrid } from "lucide-react";

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

function DropdownFilter({
  label, value, onChange, options, icon: Icon, compact = false,
}: Readonly<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  icon: React.ElementType;
  compact?: boolean;
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

  const isActive = value !== "";
  let btnCls = "border-gray-100 bg-gray-50/50 text-gray-400 hover:text-white hover:bg-orange-500 hover:border-orange-300";
  if (isActive) btnCls = "border-orange-500 bg-orange-500 text-white font-black shadow-sm";
  else if (open) btnCls = "border-orange-500 bg-white text-gray-900 shadow-sm";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`px-2.5 py-1 rounded-sm border text-[11px] font-black transition-all duration-150 focus:outline-none flex items-center gap-2 group ${btnCls} h-8 ${compact ? "min-w-0" : "min-w-35"}`}
      >
        <div className={`transition-colors duration-200 shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}>
          <Icon size={13} strokeWidth={3} />
        </div>
        {!compact && (
          <span className="truncate flex-1 text-left uppercase tracking-wider">
            {value || `All ${label}s`}
          </span>
        )}
        {compact && isActive && (
          <span className="truncate max-w-20 text-left uppercase tracking-wider text-[10px]">
            {value}
          </span>
        )}
        <ChevronDown
          className={`w-3 h-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}
          strokeWidth={3}
        />
      </button>

      {open && (
        <div className="absolute z-50 left-0 mt-1 min-w-48 bg-white border border-gray-100 rounded-sm shadow-xl animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden max-h-64 overflow-y-auto">
          <ul className="divide-y divide-gray-50">
            <li>
              <button type="button" onClick={() => { onChange(""); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[10px] font-black tracking-widest uppercase transition-colors ${value === "" ? "bg-slate-50 text-orange-500 border-l-2 border-orange-500" : "text-gray-500 hover:bg-orange-500 hover:text-white"}`}>
                All {label}s
              </button>
            </li>
            {options.map((opt) => (
              <li key={opt}>
                <button type="button" onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-[10px] font-black tracking-widest uppercase transition-colors flex items-center justify-between ${value === opt ? "bg-slate-50 text-orange-500 border-l-2 border-orange-500" : "text-gray-500 hover:bg-orange-500 hover:text-white"}`}>
                  {opt}
                  {value === opt && (
                    <svg className="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
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

function ViewToggle({ viewMode, setViewMode }: Readonly<{ viewMode: "list" | "grid"; setViewMode: (v: "list" | "grid") => void }>) {
  return (
    <div className="flex items-center gap-0 bg-slate-100 border border-gray-100 rounded-sm h-8 overflow-hidden shrink-0">
      {(["list", "grid"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setViewMode(mode)}
          className={`flex items-center justify-center w-8 h-full transition-all duration-150 cursor-pointer ${viewMode === mode ? "bg-orange-500 text-white" : "text-gray-400 hover:text-orange-500"}`}
          title={mode === "list" ? "List view" : "Grid view"}
        >
          {mode === "list" ? <List size={13} strokeWidth={2.5} /> : <LayoutGrid size={13} strokeWidth={2.5} />}
        </button>
      ))}
    </div>
  );
}

function SearchBar({ search, setSearch, placeholder = "Search product..." }: Readonly<{ search: string; setSearch: (v: string) => void; placeholder?: string }>) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-gray-100 rounded-sm px-2.5 h-8 focus-within:border-orange-200 focus-within:bg-white transition-all overflow-hidden flex-1">
      <Search size={13} className="text-gray-400 shrink-0" strokeWidth={3} />
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-transparent border-none outline-none text-[11px] text-slate-900 placeholder:text-gray-300 w-full font-bold uppercase tracking-tight"
      />
      {search && (
        <button onClick={() => setSearch("")} className="text-gray-300 hover:text-slate-900 transition-colors cursor-pointer shrink-0">
          <X size={13} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

export function ProductToolbar({
  categoryFilter, setCategoryFilter,
  supplierFilter, setSupplierFilter,
  sortField: _sortField, setSortField,
  sortDir: _sortDir, setSortDir,
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
    setSortField("id");
    setSortDir("desc");
  };

  let mobileFilterBtnClass = "bg-white text-gray-400 border-gray-200";
  if (filtersOpen) mobileFilterBtnClass = "bg-orange-500 text-white border-orange-500";
  else if (isFiltered) mobileFilterBtnClass = "bg-orange-50 text-orange-500 border-orange-300";

  return (
    <div className="flex flex-col gap-2">

      {/* ── MOBILE (< sm) ── */}
      <div className="flex sm:hidden items-center gap-2">
        <div className="relative" ref={filtersRef}>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-3 h-8 rounded-sm border text-[11px] font-black tracking-widest transition-all cursor-pointer ${mobileFilterBtnClass}`}
          >
            <Filter size={13} strokeWidth={3} />
            <span>Filter</span>
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-orange-600 text-white text-[8px] rounded-full flex items-center justify-center font-black border border-white">
                {activeCount}
              </span>
            )}
          </button>

          {filtersOpen && (
            <div className="absolute left-0 mt-3 z-50 w-72 bg-white border border-gray-200 rounded-sm shadow-2xl p-4 flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-2">
                Showing {totalResults} Results
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Tag size={10} /> Category</span>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                  {["All Categories", ...categories].map((cat) => {
                    const val = cat === "All Categories" ? "" : cat;
                    return (
                      <button key={cat} onClick={() => setCategoryFilter(val)}
                        className={`w-full text-left px-3 py-2 text-[10px] font-black tracking-widest uppercase transition-colors rounded-sm ${categoryFilter === val ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-slate-50"}`}>
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Users size={10} /> Supplier</span>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                  {["All Suppliers", ...suppliers].map((sup) => {
                    const val = sup === "All Suppliers" ? "" : sup;
                    return (
                      <button key={sup} onClick={() => setSupplierFilter(val)}
                        className={`w-full text-left px-3 py-2 text-[10px] font-black tracking-widest uppercase transition-colors rounded-sm ${supplierFilter === val ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-slate-50"}`}>
                        {sup}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-50">
                <button onClick={clearAll} className="flex-1 py-2 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 border border-gray-100 rounded-sm cursor-pointer">Reset</button>
                <button onClick={() => setFiltersOpen(false)} className="flex-1 py-2 text-[10px] font-black uppercase bg-slate-900 text-white rounded-sm cursor-pointer">Done</button>
              </div>
            </div>
          )}
        </div>

        <SearchBar search={search} setSearch={setSearch} placeholder="Search..." />
      </div>

      {/* ── TABLET (sm → lg) ── */}
      <div className="hidden sm:flex lg:hidden items-center gap-2">
        <SearchBar search={search} setSearch={setSearch} />
        <DropdownFilter label="Category" value={categoryFilter} onChange={setCategoryFilter} options={categories} icon={Tag} compact />
        <DropdownFilter label="Supplier" value={supplierFilter} onChange={setSupplierFilter} options={suppliers} icon={Users} compact />
        {isFiltered && (
          <button onClick={clearAll} className="flex items-center gap-1.5 px-2.5 h-8 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors border border-dashed border-gray-200 rounded-sm hover:border-red-200 hover:bg-red-50 shrink-0 cursor-pointer">
            <X size={11} strokeWidth={3} />
            Clear
          </button>
        )}
        <span className="text-[10px] font-black text-slate-400 tabular-nums shrink-0 px-2.5 h-8 flex items-center bg-slate-50 border border-slate-100 rounded-sm">
          {totalResults}
        </span>
      </div>

      {/* ── DESKTOP (≥ lg) ── */}
      <div className="hidden lg:flex items-center gap-2">
        <DropdownFilter label="Category" value={categoryFilter} onChange={setCategoryFilter} options={categories} icon={Tag} />
        <DropdownFilter label="Supplier" value={supplierFilter} onChange={setSupplierFilter} options={suppliers} icon={Users} />
        {isFiltered && (
          <button onClick={clearAll} className="flex items-center gap-2 px-3 h-8 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors border border-dashed border-gray-200 rounded-sm hover:border-red-200 hover:bg-red-50 cursor-pointer">
            <X size={12} strokeWidth={3} />
            Clear All
          </button>
        )}
        <div className="flex items-center gap-2 px-3 h-8 bg-slate-50 border border-slate-100 rounded-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{totalResults} Products found</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SearchBar search={search} setSearch={setSearch} />
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </div>

      {/* ── Active Filter Pills (tablet + desktop) ── */}
      {isFiltered && (
        <div className="hidden sm:flex flex-wrap items-center gap-2 py-0.5">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mr-1">Active:</span>
          {search && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-900 text-[10px] font-bold border border-slate-200 rounded-sm">
              <Search size={9} className="text-slate-400" />
              &ldquo;{search}&rdquo;
              <button onClick={() => setSearch("")} className="ml-0.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"><X size={11} strokeWidth={3} /></button>
            </span>
          )}
          {categoryFilter && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold border border-orange-100 rounded-sm">
              <Tag size={9} className="text-orange-400" />
              {categoryFilter}
              <button onClick={() => setCategoryFilter("")} className="ml-0.5 text-orange-400 hover:text-red-500 transition-colors cursor-pointer"><X size={11} strokeWidth={3} /></button>
            </span>
          )}
          {supplierFilter && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 rounded-sm">
              <Users size={9} className="text-blue-400" />
              {supplierFilter}
              <button onClick={() => setSupplierFilter("")} className="ml-0.5 text-blue-400 hover:text-red-500 transition-colors cursor-pointer"><X size={11} strokeWidth={3} /></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
