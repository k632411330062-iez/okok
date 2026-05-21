import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  itemsPerPageOptions?: number[];
  layoutId?: string; // for framer-motion active page background sharing
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [6, 12, 24, 48],
  layoutId = 'activePage'
}: PaginationProps) {
  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/5 pt-6 mt-6">
      {/* Left side: Items per page & Info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hiển thị</span>
          <div className="relative group">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
              }}
              className="bg-slate-900 border border-white/5 rounded-xl py-2 pl-4 pr-10 text-[12px] font-bold text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500/50 transition-all hover:bg-slate-800"
            >
              {itemsPerPageOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none group-hover:text-white transition-colors" />
          </div>
        </div>
        <div className="h-4 w-px bg-white/5 hidden sm:block" />
        <span className="text-[11px] font-bold text-slate-500">
          <span className="text-white">{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} – {Math.min(currentPage * itemsPerPage, totalItems)}</span>
          <span className="mx-1">trong số</span>
          <span className="text-white">{totalItems}</span>
          <span className="ml-1">giao dịch</span>
        </span>
      </div>

      {/* Right side: Pagination controls */}
      <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const isNearCurrent = Math.abs(pageNum - currentPage) <= 1;
            const isEdge = pageNum === 1 || pageNum === totalPages;

            if (!isNearCurrent && !isEdge) {
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return <span key={pageNum} className="text-slate-600 px-1 text-[10px]">•••</span>;
              }
              return null;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "w-9 h-9 rounded-xl text-[12px] font-bold transition-all relative overflow-hidden group",
                  currentPage === pageNum
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-200"
                )}
              >
                {currentPage === pageNum && (
                  <motion.div
                    layoutId={layoutId}
                    className="absolute inset-0 bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{pageNum}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
