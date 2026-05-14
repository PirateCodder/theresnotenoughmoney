"use client";

import React from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/creditCalculator";

interface ResultCardsProps {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  principal: number;
  months: number;
}

function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      key={value.toFixed(2)}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="block"
    >
      {formatCurrency(value)}
    </motion.span>
  );
}

interface CardProps {
  title: string;
  value: number;
  subtitle: string;
  accentColor: string;
  delay: number;
}

function ResultCard({ title, value, subtitle, accentColor, delay }: CardProps) {
  return (
    <motion.div
      className="glass-card p-5 md:p-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {/* Background glow blob */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-15 pointer-events-none"
        style={{ background: accentColor }}
      />

      <div className="relative z-10">
        <div className="flex items-center mb-3">
          <p className="text-sm font-semibold text-onionwhite/85 tracking-wide">
            {title}
          </p>
        </div>

        <div className="text-xl md:text-2xl font-bold text-babyblossom overflow-hidden">
          <AnimatedNumber value={value} />
        </div>
        <p className="text-xs text-onionwhite/40 mt-2">{subtitle}</p>
      </div>
    </motion.div>
  );
}

export default function ResultCards({
  monthlyPayment,
  totalPayment,
  totalInterest,
  principal,
  months,
}: ResultCardsProps) {
  const interestRatio = totalPayment > 0 ? ((totalInterest / totalPayment) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-4">
      <motion.p
        className="text-xs font-semibold text-onionwhite/50 uppercase tracking-widest px-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Hesaplama Sonuçları
      </motion.p>

      <div className="grid grid-cols-1 gap-4">
        <ResultCard
          title="Aylık Taksit Tutarı"
          value={monthlyPayment}
          subtitle={`${months} ay boyunca sabit taksit`}
          accentColor="#F4A384"
          delay={0.1}
        />
        <ResultCard
          title="Toplam Geri Ödeme"
          value={totalPayment}
          subtitle="Ana para + toplam faiz"
          accentColor="#486D83"
          delay={0.2}
        />
        <ResultCard
          title="Toplam Ödenecek Faiz"
          value={totalInterest}
          subtitle={`Geri ödemenin %${interestRatio}'si faiz`}
          accentColor="#7A5063"
          delay={0.3}
        />
      </div>

      {/* Progress bar */}
      <motion.div
        className="glass-card p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-xs text-onionwhite/55 mb-3 font-medium">Ana Para / Faiz Dağılımı</p>
        <div className="w-full h-2.5 rounded-full overflow-hidden bg-white/10">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #486D83, #F4A384)" }}
            initial={{ width: 0 }}
            animate={{
              width: totalPayment > 0 ? `${(principal / totalPayment) * 100}%` : "0%",
            }}
            transition={{ duration: 0.8, delay: 0.6 }}
          />
        </div>
        <div className="flex justify-between mt-2.5">
          <span className="text-xs font-medium" style={{ color: "#486D83" }}>
            Ana Para · {totalPayment > 0 ? ((principal / totalPayment) * 100).toFixed(1) : 0}%
          </span>
          <span className="text-xs font-medium" style={{ color: "#F4A384" }}>
            Faiz · {interestRatio}%
          </span>
        </div>
      </motion.div>
    </div>
  );
}