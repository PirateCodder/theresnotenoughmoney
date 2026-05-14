"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { CalculatorIcon } from "@heroicons/react/24/outline";
import CreditForm from "@/components/CreditForm";
import ResultCards from "@/components/ResultCards";
import PdfExport from "@/components/PdfExport";
import PageHeader from "@/components/PageHeader";
import { calculateAmortization } from "@/lib/creditCalculator";

const DonutChart = dynamic(() => import("@/components/DonutChart"), { ssr: false });
const AmortizationTable = dynamic(() => import("@/components/AmortizationTable"), { ssr: false });

export default function KrediPage() {
  const [principal, setPrincipal] = useState(250000);
  const [interestRate, setInterestRate] = useState(2.69);
  const [months, setMonths] = useState(36);

  const result = useMemo(
    () => calculateAmortization(principal, interestRate, months),
    [principal, interestRate, months]
  );

  return (
    <main className="min-h-screen px-4 py-8 md:px-6 md:py-12">
      <div className="max-w-7xl mx-auto">

        {/* ── Üst Bar + Başlık ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <PageHeader
            title="Kredi Simülasyonu"
            description="Aylık eşit taksit yöntemiyle (anapara + faiz) hesaplama"
            Icon={CalculatorIcon}
            iconAccent="#F4A384"
          />
        </motion.div>

        {/* ── Grid ── */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
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
        </motion.div>

        {/* Tam genişlik: Amortisman tablosu */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <AmortizationTable rows={result.amortizationTable} />
        </motion.div>

        {/* ── Footer ── */}
        <motion.footer
          className="text-center mt-12 text-xs leading-relaxed"
          style={{ color: "rgba(226,213,194,0.2)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>Bu uygulama bilgi amaçlıdır. Hesaplamalar aylık eşit taksit (anapara + faiz) yöntemine göredir.</p>
        </motion.footer>
      </div>
    </main>
  );
}