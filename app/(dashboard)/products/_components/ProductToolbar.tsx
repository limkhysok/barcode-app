"use client";

import { CustomSelect } from "@/src/components/ui/CustomSelect";
import type { SortDir } from "./ProductsTable";

interface ProductToolbarProps {
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  reorderDir: SortDir;
  setReorderDir: (v: SortDir) => void;
  search: string;
  setSearch: (v: string) => void;
  filtersOpen: boolean;
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
  filtersRef: React.RefObject<HTMLDivElement | null>;
}

export function ProductToolbar({
  categoryFilter,
  setCategoryFilter,
  reorderDir,
  setReorderDir,
  search,
  setSearch,
  filtersOpen,
  setFiltersOpen,
  filtersRef,
}: Readonly<ProductToolbarProps>) {
  const activeCount = [categoryFilter, reorderDir].filter(Boolean).length;

  return (
    <>
      {/* ── Desktop Toolbar: Advanced Filters ── */}
      <div className="hidden lg:block">
        <div className="flex flex-wrap items-center gap-3 border border-gray-100 bg-white rounded-xl p-2 shadow-sm transition-all hover:border-gray-200">
          
          {/* 1. Category Filter (Dropdown) */}
          <div className="flex items-center gap-2 pl-2">
             <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100/50">
               <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
               </svg>
             </div>
             <div className="w-44">
                <CustomSelect id="filter-category" value={categoryFilter} onChange={setCategoryFilter}
                  options={[
                    { value: "", label: "All Categories" },
                    { value: "Accessories", label: "Accessories" },
                    { value: "Fasteners", label: "Fasteners" },
                  ]} />
             </div>
          </div>

          <div className="w-px h-8 bg-gray-100 mx-1" />

          {/* 2. Reorder Level Sort (Toggle Group) */}
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="text-[10px] font-black text-slate-400 pl-1 uppercase tracking-widest">Reorder</span>
                <div className="flex items-center gap-1">
                   {[
                     { dir: "asc", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg> },
                     { dir: "desc", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg> }
                   ].map(({ dir, icon }) => (
                     <button
                       key={dir}
                       onClick={() => setReorderDir(reorderDir === dir ? "" : dir as SortDir)}
                       className={`
                         flex items-center justify-center w-8 h-8 rounded-md transition-all duration-300
                         ${reorderDir === dir 
                           ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105" 
                           : "text-slate-400 hover:bg-white hover:text-slate-900"}
                       `}
                     >
                       {icon}
                     </button>
                   ))}
                </div>
             </div>
          </div>

          <div className="w-px h-8 bg-gray-100 mx-1" />

          {/* 3. Search Module */}
          <div className="flex-1 flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2 border border-transparent focus-within:border-orange-500/20 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-500/5 transition-all group">
            <svg className="w-4 h-4 text-slate-400 group-focus-within:text-orange-500 shrink-0 transition-colors" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input id="product-search" name="product-search" type="text" placeholder="Search name, barcode, supplier..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 text-xs font-black text-slate-900 placeholder:text-slate-400 placeholder:font-bold bg-transparent outline-none" />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 text-white hover:bg-slate-950 transition-colors shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Toolbar: High Density ── */}
      <div className="flex lg:hidden gap-2 items-center px-4">
        {/* Filters dropdown */}
        <div className="relative shrink-0" ref={filtersRef}>
          <button type="button" onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm ${filtersOpen ? "bg-slate-950 text-white border-slate-950" : "bg-white text-slate-700 border-gray-100"
              }`}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            {activeCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 rounded-lg text-[9px] font-black bg-orange-500 text-white">
                {activeCount}
              </span>
            )}
            <span className="hidden sm:inline">Filters</span>
          </button>

          {filtersOpen && (
            <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                 <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Filters & Sorting</p>
                 <button onClick={() => setFiltersOpen(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Category</p>
                  <CustomSelect id="mob-filter-category" value={categoryFilter} onChange={setCategoryFilter}
                    options={[
                      { value: "", label: "All Categories" },
                      { value: "Accessories", label: "Accessories" },
                      { value: "Fasteners", label: "Fasteners" },
                    ]} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Reorder Level (sort)</p>
                  <CustomSelect id="mob-sort-reorder" value={reorderDir} onChange={(v) => setReorderDir(v as SortDir)}
                    options={[
                      { value: "", label: "Default Sort" },
                      { value: "asc", label: "Low → High" },
                      { value: "desc", label: "High → Low" },
                    ]} />
                </div>
              </div>

              {[categoryFilter, reorderDir].some(Boolean) && (
                <button type="button"
                  onClick={() => { setCategoryFilter(""); setReorderDir(""); }}
                  className="w-full py-2.5 text-[10px] font-black tracking-widest uppercase text-red-500 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all duration-300">
                  Reset Catalog Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex-1 flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-2.5 shadow-sm focus-within:ring-4 focus-within:ring-orange-500/5 focus-within:border-orange-500/20 transition-all">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input id="product-search-mobile" name="product-search" type="text"
            placeholder="Search catalog..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 text-[13px] font-black text-slate-900 placeholder:text-slate-400 placeholder:font-bold bg-transparent outline-none" />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-950 hover:text-white transition-all shrink-0">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
