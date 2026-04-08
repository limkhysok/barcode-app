"use client";

import type { Product } from "@/src/types/product.types";

export type SortDir = "asc" | "desc" | "";

interface ProductsTableProps {
  loading: boolean;
  error: string;
  displayed: Product[];
  products: Product[];
  costDir: SortDir;
  reorderDir: SortDir;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function ProductsTable({
  loading,
  error,
  displayed,
  products,
  costDir,
  reorderDir,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: Readonly<ProductsTableProps>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 rounded-full border-[3px] border-orange-500/20 border-t-orange-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center text-sm font-black text-red-500 uppercase tracking-widest bg-red-50/50 rounded-2xl border border-red-100 mx-4 my-8">
        {error}
      </div>
    );
  }

  if (displayed.length === 0) {
    const msg = products.length === 0 ? "Empty Catalog" : "No Match Found";
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-300">
        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
          <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>
        <p className="text-sm font-black uppercase tracking-[0.3em]">{msg}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Mobile: High Density Cards ── */}
      <div className="sm:hidden space-y-3 px-4 py-4">
        {displayed.map((p, idx) => (
          <div key={p.id ?? idx} className="relative group bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-orange-500/30 transition-all duration-300">
            {/* Stretched Link Overlay */}
            {canEdit && (
              <button
                onClick={() => onEdit(p)}
                className="absolute inset-0 z-0 w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20 rounded-2xl"
                aria-label={`Edit ${p.product_name}`}
              />
            )}

            <div className="relative z-10 pointer-events-none">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-white bg-slate-950 px-2 py-0.5 rounded-md shadow-sm">ID-{p.id}</span>
                  <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-orange-100">{p.category}</span>
                </div>

                {/* Secondary Action: Delete */}
                {canDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(p); }}
                    className="pointer-events-auto p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>

              <h3 className="text-sm font-black text-slate-950 uppercase tracking-tighter mb-1 line-clamp-1">{p.product_name}</h3>

              <div className="flex items-center gap-3 py-2 bg-slate-50/50 rounded-xl px-3 border border-slate-100/50 mb-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
                  </svg>
                  <span className="text-[10px] font-mono font-bold text-slate-500 truncate">{p.barcode}</span>
                </div>
                <div className="w-px h-3 bg-slate-200" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{p.supplier}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reorder Level</span>
                  <span className="text-xs font-black text-slate-950 tabular-nums">{p.reorder_level}</span>
                </div>
                <p className="text-[9px] font-black text-orange-500 font-mono tracking-tighter uppercase tabular-nums">
                  {new Date(p.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop: Brutalist Table ── */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/50 border-b border-gray-100">
            <tr>
              <th className="pl-8 pr-4 py-5 text-left text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">IDENTIFIER</th>
              <th className="px-4 py-5 text-left text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">BARCODE</th>
              <th className="px-4 py-5 text-left text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase leading-none">
                <div className="flex flex-col">
                  <span>NAME</span>
                  <span className="text-[8px] tracking-widest font-bold text-slate-300">DESCRIPTION</span>
                </div>
              </th>
              <th className="px-4 py-5 text-left text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">CATEGORY</th>
              <th className="px-4 py-5 text-left">
                <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  <span>REORDER</span>
                  <div className="flex flex-col -space-y-1">
                    <svg className={`w-2.5 h-2.5 ${reorderDir === "asc" ? "text-orange-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l8 8H4z" /></svg>
                    <svg className={`w-2.5 h-2.5 ${reorderDir === "desc" ? "text-orange-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l-8-8h16z" /></svg>
                  </div>
                </div>
              </th>
              <th className="px-4 py-5 text-left text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">SUPPLIER</th>
              <th className="pr-8 pl-4 py-5 text-right text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">TOOLS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {displayed.map((p, idx) => (
              <tr key={p.id ?? idx} className="group hover:bg-slate-50 transition-colors duration-300">
                <td className="pl-8 pr-4 py-4">
                  <div className="text-[11px] font-black text-white bg-slate-950 px-2 py-0.5 rounded shadow-sm inline-block tracking-tighter">ID-{p.id}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-tighter tabular-nums">{p.barcode}</span>
                  </div>
                </td>
                <td className="px-4 py-4 min-w-50">
                  <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight group-hover:text-orange-600 transition-colors">{p.product_name}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-widest">{p.category}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-[12px] font-black text-slate-950 tabular-nums">{p.reorder_level}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.supplier}</span>
                </td>
                <td className="pr-8 pl-4 py-4">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    {canEdit && (
                      <button onClick={() => onEdit(p)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-950 transition-all active:scale-95 shadow-sm border border-transparent hover:border-slate-800" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => onDelete(p)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-red-600 transition-all active:scale-95 shadow-sm border border-transparent hover:border-red-500" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
