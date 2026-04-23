"use client";

interface ProductHeaderProps {
  onNew: () => void;
}

export function ProductHeader({ onNew }: Readonly<ProductHeaderProps>) {
  return (
    <>
      {/* ── MOBILE (< sm) ── */}
      <div className="sm:hidden flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-[13px] font-black text-slate-950 uppercase tracking-[0.2em] leading-none">Product</h1>
          <p className="text-[8px] text-orange-500 font-black uppercase tracking-widest mt-0.5">Catalog</p>
        </div>
        <button
          onClick={onNew}
          className="px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white active:scale-[0.98] transition-all cursor-pointer"
        >
          + New
        </button>
      </div>

      {/* ── TABLET (sm → lg) ── */}
      <div className="hidden sm:flex lg:hidden items-center justify-between">
        <div className="flex flex-col border-l-2 border-orange-500 pl-3">
          <h1 className="text-[15px] font-black text-slate-950 uppercase tracking-[0.2em] leading-tight">Product</h1>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Command Center / Catalog</p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-wider bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.97] transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>New Product</span>
        </button>
      </div>

      {/* ── DESKTOP (≥ lg) ── */}
      <div className="hidden lg:flex items-center justify-between gap-4">
        <div className="flex flex-col border-l-4 border-orange-500 pl-4">
          <h1 className="text-[16px] font-black text-slate-950 uppercase tracking-[0.25em] leading-tight">Product</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Command Center / Catalog</p>
          </div>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2.5 px-5 py-2 rounded-sm text-[11px] font-black uppercase tracking-wider bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.96] transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>New Product</span>
        </button>
      </div>
    </>
  );
}
