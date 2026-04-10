"use client";

import React, { useState, useRef, useEffect } from "react";
import type { SortDir } from "./ProductsTable";
import { Search, X, ArrowUpDown, ChevronDown, LayoutGrid, DollarSign } from "lucide-react";

interface ProductToolbarProps {
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  costDir: SortDir;
  setCostDir: (v: SortDir) => void;
  reorderDir: SortDir;
  setReorderDir: (v: SortDir) => void;
  search: string;
  setSearch: (v: string) => void;
  filtersOpen: boolean;
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
  filtersRef: React.RefObject<HTMLDivElement | null>;
  viewMode: "list" | "grid";
  setViewMode: (v: "list" | "grid") => void;
}

function CategoryFilter({ value, onChange }: Readonly<{ value: string; onChange: (v: string) => void }>) {
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
    { key: "", label: "All Categories" },
    { key: "Accessories", label: "Accessories" },
    { key: "Fasteners", label: "Fasteners" },
  ];

  const activeLabel = options.find(o => o.key === value)?.label || "All Categories";
  const isActive = value !== "";

  let buttonStyles = "border-gray-100 bg-gray-50/50 text-gray-400 hover:text-white hover:bg-orange-500 hover:border-orange-300";
  if (isActive) buttonStyles = "border-orange-500 bg-orange-500 text-white font-black shadow-sm";
  else if (open) buttonStyles = "border-orange-500 bg-white text-gray-900 shadow-sm";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`px-2.5 py-1 rounded-sm border text-[12px] font-bold transition-all duration-150 focus:outline-none flex items-center gap-2.5 group ${buttonStyles} min-w-36`}
      >
        <div className={`transition-colors duration-200 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}>
          <LayoutGrid size={14} strokeWidth={3} />
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
                  onClick={() => { onChange(o.key); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-[10px] font-black tracking-widest uppercase transition-colors flex items-center justify-between group/opt ${value === o.key ? "bg-slate-50 text-orange-500 border-l-2 border-orange-500" : "text-gray-500 hover:bg-orange-500 hover:text-white"}`}
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

function SortToggleButton({ label, dir, onToggle, icon }: Readonly<{ label: string; dir: SortDir; onToggle: () => void; icon?: React.ReactNode }>) {
  const isSelected = dir !== "";
  const isDesc = dir === "desc";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`px-3 py-1 rounded-sm border text-[12px] transition-all flex items-center gap-2.5 focus:outline-none group shrink-0 ${isSelected
        ? "border-orange-500 bg-orange-500 text-white shadow-sm font-black"
        : "border-gray-100 bg-gray-50/50 text-gray-400 hover:bg-orange-600 hover:border-orange-600 hover:text-white font-bold"
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

function cycleDir(current: SortDir, set: (v: SortDir) => void) {
  if (!current) set("desc");
  else if (current === "desc") set("asc");
  else set("");
}

export function ProductToolbar({
  categoryFilter, setCategoryFilter,
  costDir, setCostDir,
  reorderDir, setReorderDir,
  search, setSearch,
  filtersOpen, setFiltersOpen, filtersRef,
  viewMode, setViewMode,
}: Readonly<ProductToolbarProps>) {
  const activeCount = [categoryFilter, costDir, reorderDir].filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-3">

      {/* ── Desktop Toolbar ── */}
      <div className="hidden sm:flex items-center flex-1">
        {/* Filters */}
        <div className="flex items-center gap-1">
          <CategoryFilter value={categoryFilter} onChange={setCategoryFilter} />
        </div>

        {/* Sort buttons */}
        <div className="flex items-center gap-1 shrink-0 pl-1">
          <SortToggleButton
            label="Cost"
            dir={costDir}
            onToggle={() => cycleDir(costDir, setCostDir)}
            icon={<DollarSign size={14} strokeWidth={3} />}
          />
          <SortToggleButton
            label="Reorder"
            dir={reorderDir}
            onToggle={() => cycleDir(reorderDir, setReorderDir)}
            icon={<ArrowUpDown size={14} strokeWidth={3} />}
          />
        </div>

        {/* Right side: search + view toggle */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 border border-gray-100 rounded-sm px-2.5 py-1.5 focus-within:border-gray-300 focus-within:bg-white transition-all w-64 lg:w-80 overflow-hidden">
            <Search size={14} className="text-gray-400 shrink-0" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-slate-900 placeholder:text-gray-300 w-full font-medium"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-300 hover:text-slate-900 transition-colors cursor-pointer">
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-0 bg-slate-100 border border-gray-100 rounded-sm">
            {(["list", "grid"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                title={mode === "list" ? "List view" : "Grid view"}
                className={`flex items-center gap-1.5 px-1.5 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase transition-all duration-150 cursor-pointer ${viewMode === mode ? "bg-orange-500 text-white" : "text-gray-400 hover:text-orange-500"}`}
              >
                {mode === "list" ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile Bundle Button ── */}
      <div className="sm:hidden relative" ref={filtersRef}>
        {(() => {
          let btnCls = "bg-white text-black border-gray-200";
          if (filtersOpen) btnCls = "bg-orange-500 text-white border-orange-500";
          else if (categoryFilter || costDir || reorderDir) btnCls = "bg-orange-50 text-orange-500 border-orange-300";
          return (
            <>
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`relative flex items-center gap-2 px-3 py-1 rounded-sm border text-[11px] font-light text-gray-400 tracking-widest transition-all cursor-pointer ${btnCls}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
                <span>Filter</span>
                {activeCount > 0 && !filtersOpen && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-orange-500 text-white text-[8px] font-black">
                    {activeCount}
                  </span>
                )}
              </button>

              {filtersOpen && (
                <div className="absolute left-0 mt-3 z-50 w-70 bg-white border border-gray-200 rounded-sm shadow-xl p-4 flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-200">

                  {/* Active filter pills */}
                  {(categoryFilter || costDir || reorderDir) && (
                    <div className="flex flex-wrap gap-1.5">
                      {categoryFilter && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-orange-50 text-orange-500 border border-orange-200 rounded-full">
                          {categoryFilter}
                          <button type="button" onClick={() => setCategoryFilter("")} className="text-orange-400 hover:text-orange-600 cursor-pointer transition-colors">✕</button>
                        </span>
                      )}
                      {costDir && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-orange-50 text-orange-500 border border-orange-200 rounded-full">
                          Cost {costDir}
                          <button type="button" onClick={() => setCostDir("")} className="text-orange-400 hover:text-orange-600 cursor-pointer transition-colors">✕</button>
                        </span>
                      )}
                      {reorderDir && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-orange-50 text-orange-500 border border-orange-200 rounded-full">
                          Reorder {reorderDir}
                          <button type="button" onClick={() => setReorderDir("")} className="text-orange-400 hover:text-orange-600 cursor-pointer transition-colors">✕</button>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Category filter */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter By Category</span>
                    <div className="flex flex-col gap-2">
                      {["", "Accessories", "Fasteners"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => { setCategoryFilter(cat); }}
                          className={`w-full text-left px-4 py-2.5 text-[10px] font-black tracking-widest uppercase transition-colors flex items-center justify-between group/opt ${categoryFilter === cat ? "bg-slate-50 text-orange-500 border-l-2 border-orange-500" : "text-gray-500 hover:bg-orange-500 hover:text-white"}`}
                        >
                          {cat || "All Categories"}
                          {categoryFilter === cat && (
                            <svg className="w-3 h-3 text-orange-500 group-hover/opt:text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cost sort */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort By Cost</span>
                    <div className="flex flex-wrap gap-2">
                      {([{ label: "Default", val: "" }, { label: "Low → High", val: "asc" }, { label: "High → Low", val: "desc" }] as const).map((opt) => (
                        <button
                          key={opt.val}
                          onClick={() => setCostDir(opt.val)}
                          className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider border ${costDir === opt.val ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-400 border-gray-100 hover:border-orange-300 hover:text-orange-500"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reorder sort */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort By Reorder</span>
                    <div className="flex flex-wrap gap-2">
                      {([{ label: "Default", val: "" }, { label: "Low → High", val: "asc" }, { label: "High → Low", val: "desc" }] as const).map((opt) => (
                        <button
                          key={opt.val}
                          onClick={() => setReorderDir(opt.val)}
                          className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider border ${reorderDir === opt.val ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-400 border-gray-100 hover:border-orange-300 hover:text-orange-500"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    {(categoryFilter || costDir || reorderDir) && (
                      <button
                        onClick={() => { setCategoryFilter(""); setCostDir(""); setReorderDir(""); }}
                        className="flex-1 py-2 border border-gray-200 text-gray-400 text-[11px] font-black uppercase rounded hover:border-red-300 hover:text-red-400 transition-all cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      onClick={() => setFiltersOpen(false)}
                      className="flex-1 py-2 bg-black text-white text-[11px] font-black uppercase rounded hover:bg-gray-800 transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Mobile Search */}
      <div className="sm:hidden flex-1 flex items-center gap-2 bg-slate-50 border border-gray-100 rounded-sm px-2.5 py-1.5">
        <Search size={14} className="text-gray-400 shrink-0" strokeWidth={2} />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-slate-900 placeholder:text-gray-300 w-full font-medium"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-gray-300 hover:text-slate-900 transition-colors cursor-pointer">
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
