"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import CreditForm from "@/components/CreditForm";
import ResultCards from "@/components/ResultCards";
import PdfExport from "@/components/PdfExport";
import MarketList from "@/components/MarketList";
import { calculateAmortization } from "@/lib/creditCalculator";

const DonutChart = dynamic(() => import("@/components/DonutChart"), { ssr: false });
const AmortizationTable = dynamic(() => import("@/components/AmortizationTable"), { ssr: false });

export default function Home() {
  const [principal, setPrincipal] = useState(250000);
  const [interestRate, setInterestRate] = useState(2.69);
  const [months, setMonths] = useState(36);

  const result = useMemo(
    () => calculateAmortization(principal, interestRate, months),
    [principal, interestRate, months]
  );

  return (
    <main className="min-h-screen px-4 py-8 md:px-6 md:py-12 lg:py-16">
      {/* ── Header ── */}
      <motion.div
        className="text-center mb-8 md:mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-babyblossom mb-2 leading-tight">
          Kredi Hesaplama
          <span
            className="block bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #F4A384 0%, #7A5063 50%, #486D83 100%)",
            }}
          >
            &amp; Ödeme Simülasyonu
          </span>
        </h1>
      </motion.div>

      {/* ── Piyasa Listesi ── */}
      <MarketList />

      {/* ── Main Grid ── */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Sol sütun: Form + PDF butonu */}
          <div className="lg:col-span-4 space-y-5">
            <CreditForm
              principal={principal}
              setPrincipal={setPrincipal}
              interestRate={interestRate}
              setInterestRate={setInterestRate}
              months={months}
              setMonths={setMonths}
            />
            <PdfExport
              principal={principal}
              interestRate={interestRate}
              months={months}
              monthlyPayment={result.monthlyPayment}
              totalPayment={result.totalPayment}
              totalInterest={result.totalInterest}
              rows={result.amortizationTable}
            />
          </div>

          {/* Orta sütun: Sonuç kartları */}
          <div className="lg:col-span-4 space-y-5">
            <ResultCards
              monthlyPayment={result.monthlyPayment}
              totalPayment={result.totalPayment}
              totalInterest={result.totalInterest}
              principal={principal}
              months={months}
            />
          </div>

          {/* Sağ sütun: Halka grafik */}
          <div className="lg:col-span-4">
            <DonutChart
              principal={principal}
              totalInterest={result.totalInterest}
            />
          </div>
        </div>

        {/* Tam genişlik: Amortisman tablosu */}
        <div className="mt-6">
          <AmortizationTable rows={result.amortizationTable} />
        </div>
      </div>

      {/* ── Footer ── */}
      <motion.footer
        className="text-center mt-12 text-xs text-onionwhite/25 leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <p>Bu uygulama bilgi amaçlıdır. Hesaplamalar aylık eşit taksit (anapara + faiz) yöntemine göredir.</p>
      </motion.footer>
    </main>
  );
}