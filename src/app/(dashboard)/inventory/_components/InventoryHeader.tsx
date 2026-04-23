"use client";

import React from "react";
import { FileDown, ChevronDown } from "lucide-react";

interface InventoryHeaderProps {
  onNew: () => void;
  canEdit: boolean;
  exportOpen: boolean;
  setExportOpen: (v: boolean) => void;
  exportRef: React.RefObject<HTMLDivElement | null>;
  onExport: (type: "no_stock" | "low" | "good" | "all") => void;
}

function ExportDropdown({ open, setOpen, exportRef, onExport, compact = false }: Readonly<{
  open: boolean;
  setOpen: (v: boolean) => void;
  exportRef: React.RefObject<HTMLDivElement | null>;
  onExport: (type: "no_stock" | "low" | "good" | "all") => void;
  compact?: boolean;
}>) {
  return (
    <div className="relative" ref={exportRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-sm text-[11px] font-black uppercase tracking-wider border border-slate-400 transition-all cursor-pointer ${
          open ? "bg-black text-white border-black" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
        } ${compact ? "px-3 py-1.5" : "px-4 py-2"}`}
      >
        <FileDown size={13} strokeWidth={3} className={open ? "text-white" : "text-slate-400"} />
        {!compact && <span>Export</span>}
        <ChevronDown size={10} strokeWidth={3} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-sm shadow-2xl z-50 py-1 animate-in fade-in slide-in-from-top-2">
          <button onClick={() => onExport("no_stock")} className="w-full text-left px-4 py-2.5 text-[10px] font-black text-red-500 hover:bg-red-50 uppercase tracking-widest transition-colors flex items-center justify-between">
            <span>No Stock</span><span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          </button>
          <button onClick={() => onExport("low")} className="w-full text-left px-4 py-2.5 text-[10px] font-black text-yellow-600 hover:bg-yellow-50 uppercase tracking-widest transition-colors flex items-center justify-between border-t border-slate-50">
            <span>Low Stock</span><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          </button>
          <button onClick={() => onExport("good")} className="w-full text-left px-4 py-2.5 text-[10px] font-black text-green-600 hover:bg-green-50 uppercase tracking-widest transition-colors flex items-center justify-between border-t border-slate-50">
            <span>Good Stock</span><span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          </button>
          <button onClick={() => onExport("all")} className="w-full text-left px-4 py-2.5 text-[10px] font-black text-slate-600 hover:bg-slate-50 uppercase tracking-widest transition-colors border-t border-slate-100">
            Full Inventory
          </button>
        </div>
      )}
    </div>
  );
}

export function InventoryHeader({ onNew, canEdit, exportOpen, setExportOpen, exportRef, onExport }: Readonly<InventoryHeaderProps>) {
  return (
    <>
      {/* ── MOBILE (< sm) ── */}
      <div className="sm:hidden flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-[13px] font-black text-slate-950 uppercase tracking-[0.2em] leading-none">Inventory</h1>
          <p className="text-[8px] text-orange-500 font-black uppercase tracking-widest mt-0.5">Operations</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <ExportDropdown open={exportOpen} setOpen={setExportOpen} exportRef={exportRef} onExport={onExport} compact />
          )}
          <button
            onClick={onNew}
            className="px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white active:scale-[0.98] transition-all cursor-pointer"
          >
            + New
          </button>
        </div>
      </div>

      {/* ── TABLET (sm → lg) ── */}
      <div className="hidden sm:flex lg:hidden items-center justify-between">
        <div className="flex flex-col border-l-2 border-orange-500 pl-3">
          <h1 className="text-[15px] font-black text-slate-950 uppercase tracking-[0.2em] leading-tight">Inventory</h1>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Command Center / Operations</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <ExportDropdown open={exportOpen} setOpen={setExportOpen} exportRef={exportRef} onExport={onExport} />
          )}
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-wider bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.97] transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>New Record</span>
          </button>
        </div>
      </div>

      {/* ── DESKTOP (≥ lg) ── */}
      <div className="hidden lg:flex items-center justify-between gap-4">
        <div className="flex flex-col border-l-4 border-orange-500 pl-4">
          <h1 className="text-[16px] font-black text-slate-950 uppercase tracking-[0.25em] leading-tight">Inventory</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Command Center / Operations</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <ExportDropdown open={exportOpen} setOpen={setExportOpen} exportRef={exportRef} onExport={onExport} />
          )}
          <button
            onClick={onNew}
            className="flex items-center gap-2.5 px-5 py-2 rounded-sm border  text-[11px] font-black uppercase tracking-wider bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.96] transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>New Record</span>
          </button>
        </div>
      </div>
    </>
  );
}
