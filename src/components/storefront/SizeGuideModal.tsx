"use client";

import { X } from "lucide-react";
import type { SizeGuide } from "@/lib/types";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizeGuide?: SizeGuide | null;
}

export function SizeGuideModal({
  isOpen,
  onClose,
  sizeGuide,
}: SizeGuideModalProps) {
  if (!isOpen) return null;

  // Standard luxury bridal measurements if custom size guide is not assigned
  const defaultColumns = [
    "Size",
    "Bust (in)",
    "Waist (in)",
    "Hip (in)",
    "Blouse Length (in)",
    "Lehenga Length (in)",
  ];

  const defaultRows = [
    ["XS", "32", "26", "36", "13.5", "42"],
    ["S", "34", "28", "38", "14.0", "42"],
    ["M", "36", "30", "40", "14.5", "43"],
    ["L", "38", "32", "42", "15.0", "43"],
    ["XL", "40", "34", "44", "15.5", "44"],
  ];

  const columns = sizeGuide?.columns?.length ? sizeGuide.columns : defaultColumns;
  const rows = sizeGuide?.rows?.length ? sizeGuide.rows : defaultRows;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative bg-[#FFFDF9] rounded-sm border border-[#E8DDD1] shadow-2xl max-w-2xl w-full p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD1]">
          <div>
            <h3 className="font-serif text-2xl text-[#2B211C] font-normal">
              {sizeGuide?.name || "Bridal Fitting & Size Guide"}
            </h3>
            <p className="text-xs text-[#7A6A5F] mt-0.5">
              All measurements are in inches. Custom fittings are provided for all rentals.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#7A6A5F] hover:text-[#2B211C]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Measurements Table */}
        <div className="mt-6 overflow-x-auto border border-[#E8DDD1] rounded-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4ECE1] text-[#2B211C] font-sans font-semibold uppercase tracking-wider">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className="px-4 py-3 border-b border-[#E8DDD1]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DDD1] text-[#2B211C]">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#FAF6F0]/80 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-4 py-3 ${
                        cIdx === 0 ? "font-semibold text-[#B06F5E]" : "font-sans"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fitting Note */}
        <div className="mt-6 p-4 bg-[#FAF6F0] rounded-xs border border-[#E8DDD1] text-xs text-[#7A6A5F] leading-relaxed">
          <strong className="text-[#2B211C] font-medium block mb-1">
            Personal Fitting Assistance
          </strong>
          {sizeGuide?.notes ||
            "Every bridal rental includes a complimentary fitting session with our in-house master tailor. Slight alteration adjustments to waist, blouse hooks, and dupatta draping are done free of charge prior to your rental date."}
        </div>
      </div>
    </div>
  );
}
