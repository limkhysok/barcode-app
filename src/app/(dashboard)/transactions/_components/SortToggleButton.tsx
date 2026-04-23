"use client";

import React from "react";

export type SortField = "transaction_date" | "items_count" | "total_qty" | "id";

interface SortToggleButtonProps {
  label: string;
  field: SortField;
  currentSort: string;
  onSort: (newSort: string) => void;
  icon?: React.ReactNode;
}

const SortToggleButton: React.FC<SortToggleButtonProps> = ({
  label,
  field,
  currentSort,
  onSort,
  icon
}) => {
  const isSelected = currentSort === field || currentSort === `-${field}`;
  const isDesc = currentSort === `-${field}`;

  const handleClick = () => {
    if (!isSelected) {
      onSort(`-${field}`);
    } else if (isDesc) {
      onSort(field);
    } else {
      onSort(`-${field}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-3 h-8 rounded-sm border border-gray-200 text-[12px] transition-all flex items-center gap-2.5 focus:outline-none group shrink-0 ${isSelected
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
};

export default SortToggleButton;
