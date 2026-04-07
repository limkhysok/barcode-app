"use client";

import React from "react";

export type SortField = "transaction_date" | "items_count" | "total_qty" | "id";

interface SortToggleButtonProps {
  label: string;
  field: SortField;
  currentSort: string;
  onSort: (newSort: string) => void;
}

const SortToggleButton: React.FC<SortToggleButtonProps> = ({
  label,
  field,
  currentSort,
  onSort
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
      className={`px-3 py-1 rounded-md border text-[13px] transition-all flex items-center gap-2 focus:outline-none ${isSelected
        ? "border-orange-500 bg-orange-500 text-white shadow-sm font-black"
        : "border-black bg-gray-50 text-gray-900 hover:bg-orange-500 hover:text-white font-light transition-colors"
        }`}
    >
      <span className="truncate">{label}</span>
      <div className={`transition-transform duration-200 ${isDesc && isSelected ? "rotate-180" : "rotate-0"}`}>
        <svg className={`w-3 h-3 ${isSelected ? "text-white" : "text-gray-400"}`} fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
        </svg>
      </div>
    </button>
  );
};

export default SortToggleButton;
