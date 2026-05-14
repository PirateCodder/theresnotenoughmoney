"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartPieIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "@/lib/creditCalculator";

interface DonutChartProps {
  principal: number;
  totalInterest: number;
}

const COLORS = ["#486D83", "#F4A384"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(21, 40, 47, 0.95)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "12px",
          padding: "10px 14px",
          backdropFilter: "blur(10px)",
        }}
      >
        <p style={{ color: "#E2D5C2", fontSize: "11px", marginBottom: "4px" }}>
          {payload[0].name}
        </p>
        <p style={{ color: "#FAEFE9", fontSize: "14px", fontWeight: "700" }}>
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
}

interface LegendItemProps {
  color: string;
  label: string;
  value: number;
  pct: string;
}

function LegendItem({ color, label, value, pct }: LegendItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-sm text-onionwhite">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold text-babyblossom">{formatCurrency(value)}</span>
        <span className="text-xs text-onionwhite/45 ml-2">({pct}%)</span>
      </div>
    </div>
  );
}

export default function DonutChart({ principal, totalInterest }: DonutChartProps) {
  const totalPayment = principal + totalInterest;
  const data = [
    { name: "Ana Para", value: principal },
    { name: "Toplam Faiz", value: totalInterest },
  ];

  const principalPct = totalPayment > 0 ? ((principal / totalPayment) * 100).toFixed(1) : "0";
  const interestPct = totalPayment > 0 ? ((totalInterest / totalPayment) * 100).toFixed(1) : "0";

  const isEmpty = principal <= 0;

  return (
    <motion.div
      className="glass-card p-6 md:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(72, 109, 131, 0.2)" }}
        >
          <ChartPieIcon className="w-5 h-5" style={{ color: "#486D83" }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-babyblossom">Maliyet Dağılımı</h2>
          <p className="text-xs text-onionwhite/60">Ana para ve faiz oranları</p>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center h-52 text-onionwhite/35 text-sm">
          Hesaplama bekleniyor...
        </div>
      ) : (
        <>
          {/* Donut chart */}
          <div className="h-52 md:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 my-5" />

          {/* Legend */}
          <div className="flex flex-col gap-3">
            <LegendItem
              color="#486D83"
              label="Ana Para"
              value={principal}
              pct={principalPct}
            />
            <LegendItem
              color="#F4A384"
              label="Toplam Faiz"
              value={totalInterest}
              pct={interestPct}
            />
          </div>
        </>
      )}
    </motion.div>
  );
}