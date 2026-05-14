"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TableCellsIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { AmortizationRow, formatCurrency } from "@/lib/creditCalculator";

interface AmortizationTableProps {
  rows: AmortizationRow[];
}

const PAGE_SIZE = 12;

export default function AmortizationTable({ rows }: AmortizationTableProps) {
  const [showAll, setShowAll] = useState(false);
  const displayedRows = showAll ? rows : rows.slice(0, PAGE_SIZE);

  return (
    <motion.div
      className="glass-card p-6 md:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(122, 80, 99, 0.2)" }}
          >
            <TableCellsIcon className="w-5 h-5" style={{ color: "#7A5063" }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-babyblossom">Ödeme Planı</h2>
            <p className="text-xs text-onionwhite/60">
              {rows.length > 0 ? `${rows.length} aylık amortisman tablosu` : "Aylık amortisman tablosu"}
            </p>
          </div>
        </div>
        {rows.length > 0 && (
          <span
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: "rgba(122, 80, 99, 0.2)", color: "#E2D5C2" }}
          >
            {rows.length} Taksit
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-onionwhite/35 text-sm">
          Hesaplama bekleniyor...
        </div>
      ) : (
        <>
          {/* Scrollable table */}
          <div className="overflow-x-auto rounded-xl -mx-1 px-1" style={{ WebkitOverflowScrolling: "touch" }}>
            <table className="amortization-table">
              <thead>
                <tr>
                  <th>Ay</th>
                  <th>Taksit Tutarı</th>
                  <th>Ana Para</th>
                  <th>Faiz</th>
                  <th>Kalan Bakiye</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {displayedRows.map((row, index) => (
                    <motion.tr
                      key={row.month}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15, delay: Math.min(index * 0.008, 0.3) }}
                    >
                      <td>
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold"
                          style={{
                            background: "rgba(244, 163, 132, 0.12)",
                            color: "#F4A384",
                          }}
                        >
                          {row.month}
                        </span>
                      </td>
                      <td className="font-semibold text-babyblossom">
                        {formatCurrency(row.payment)}
                      </td>
                      <td style={{ color: "#7ab5d4" }}>
                        {formatCurrency(row.principal)}
                      </td>
                      <td style={{ color: "#F4A384" }}>
                        {formatCurrency(row.interest)}
                      </td>
                      <td className="text-onionwhite/75">
                        {formatCurrency(row.balance)}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Show more / less */}
          {rows.length > PAGE_SIZE && (
            <div className="mt-5 flex justify-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-onionwhite hover:text-creamypeach"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                {showAll ? (
                  <>
                    <ChevronUpIcon className="w-4 h-4" />
                    <span>Daha Az Göster</span>
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="w-4 h-4" />
                    <span>Tümünü Göster ({rows.length - PAGE_SIZE} daha)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}