"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";

interface CurrencyRate {
  buying: string;  // ForexBuying  = Banka Alış
  selling: string; // ForexSelling = Banka Satış
}

interface CurrencyData {
  USD: CurrencyRate;
  EUR: CurrencyRate;
  date: string;
}

type CurrencyCode = "USD" | "EUR";
type RateType = "buying" | "selling";

const CURRENCIES: { code: CurrencyCode; symbol: string; accentColor: string }[] = [
  { code: "USD", symbol: "$", accentColor: "#F4A384" },
  { code: "EUR", symbol: "€", accentColor: "#8BAFC4" },
];

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-white/10" />
      <div className="flex-1 space-y-1.5">
        <div className="w-20 h-3 rounded bg-white/10" />
        <div className="w-12 h-2.5 rounded bg-white/8" />
      </div>
      <div className="w-28 h-4 rounded bg-white/10" />
      <div className="w-28 h-4 rounded bg-white/10" />
    </div>
  );
}

function CurrencyRow({
  code,
  symbol,
  accentColor,
  buying,
  selling,
  isSelected,
  onClick,
}: {
  code: string;
  symbol: string;
  accentColor: string;
  buying: string;
  selling: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-white/5"
      style={isSelected ? { background: "rgba(244,163,132,0.06)" } : {}}
    >
      {/* İkon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
        style={{ background: `${accentColor}18`, color: accentColor }}
      >
        {symbol}
      </div>

      {/* Kod */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: accentColor }}>{code}</p>
        <p className="text-xs text-onionwhite/30">Türk Lirası</p>
      </div>

      {/* Alış / Satış */}
      <div className="hidden sm:flex flex-col items-end gap-0.5">
        <p className="text-xs text-onionwhite/65">
          <span className="text-onionwhite/30 mr-1">Alış</span>
          {selling} ₺
        </p>
        <p className="text-xs text-onionwhite/40">
          <span className="text-onionwhite/20 mr-1">Satış</span>
          {buying} ₺
        </p>
      </div>

      {/* Mobil için sadece satış */}
      <div className="sm:hidden">
        <p className="text-sm font-semibold text-babyblossom">{selling} ₺</p>
      </div>
    </button>
  );
}

export default function CurrencyBar() {
  const [data, setData] = useState<CurrencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedCode, setSelectedCode] = useState<CurrencyCode | null>(null);
  const [amount, setAmount] = useState("1000");
  const [rateType, setRateType] = useState<RateType>("selling");
  const [direction, setDirection] = useState<"TRY_TO_FX" | "FX_TO_TRY">("TRY_TO_FX");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/currency")
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((json: CurrencyData & { error?: string }) => {
        if (json.error) setError(true);
        else setData(json);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleRowClick = (code: CurrencyCode) => {
    if (selectedCode === code) {
      setSelectedCode(null);
    } else {
      setSelectedCode(code);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  };

  const getResult = (): string => {
    if (!data || !selectedCode) return "—";
    const rateStr = data[selectedCode][rateType];
    const rate = parseFloat(rateStr.replace(",", "."));
    const value = parseFloat(amount.replace(",", "."));
    if (isNaN(rate) || isNaN(value) || rate === 0) return "—";
    const result = direction === "TRY_TO_FX" ? value / rate : value * rate;
    return result.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const selectedCurrency = CURRENCIES.find((c) => c.code === selectedCode);
  const fromLabel = direction === "TRY_TO_FX" ? "₺" : (selectedCurrency ? `${selectedCurrency.symbol} ${selectedCurrency.code}` : "");
  const toLabel = direction === "TRY_TO_FX" ? (selectedCurrency ? `${selectedCurrency.symbol} ${selectedCurrency.code}` : "") : "₺";

  if (error) return null;

  return (
    <motion.div
      className="max-w-7xl mx-auto mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="text-xs font-semibold text-onionwhite/35 uppercase tracking-widest px-1 mb-3">
        Döviz Kurları
      </p>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="divide-y divide-white/[0.06]">
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : data ? (
            CURRENCIES.map(({ code, symbol, accentColor }) => (
              <React.Fragment key={code}>
                <CurrencyRow
                  code={code}
                  symbol={symbol}
                  accentColor={accentColor}
                  buying={data[code].buying}
                  selling={data[code].selling}
                  isSelected={selectedCode === code}
                  onClick={() => handleRowClick(code)}
                />

                {/* İnline dönüştürücü */}
                <AnimatePresence>
                  {selectedCode === code && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        className="px-5 py-4 space-y-3"
                        style={{
                          background: "rgba(244,163,132,0.04)",
                          borderTop: "1px solid rgba(244,163,132,0.1)",
                        }}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Miktar */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-onionwhite/40 whitespace-nowrap">{fromLabel}</span>
                            <input
                              ref={inputRef}
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="glass-input w-28 px-3 py-1.5 text-sm font-semibold text-babyblossom"
                              placeholder="Miktar"
                            />
                          </div>

                          {/* Yön swap */}
                          <button
                            onClick={() =>
                              setDirection((d) => d === "TRY_TO_FX" ? "FX_TO_TRY" : "TRY_TO_FX")
                            }
                            className="p-2 rounded-lg transition-colors hover:bg-white/10"
                          >
                            <ArrowsRightLeftIcon className="w-4 h-4 text-onionwhite/50" />
                          </button>

                          {/* Alış / Satış */}
                          <div className="flex gap-1.5">
                            {([
                              { key: "selling" as RateType, label: "Alış" },
                              { key: "buying" as RateType, label: "Satış" },
                            ]).map(({ key, label }) => (
                              <button
                                key={key}
                                onClick={() => setRateType(key)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                style={
                                  rateType === key
                                    ? { background: "rgba(244,163,132,0.2)", color: "#F4A384", border: "1px solid rgba(244,163,132,0.3)" }
                                    : { background: "rgba(255,255,255,0.05)", color: "#E2D5C2", border: "1px solid rgba(255,255,255,0.08)" }
                                }
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sonuç */}
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-xs text-onionwhite/35">
                            {amount || "—"} {fromLabel} =
                          </span>
                          <span className="text-xl font-bold text-babyblossom">{getResult()}</span>
                          <span className="text-xs text-onionwhite/35">{toLabel}</span>
                          <span className="text-xs text-onionwhite/25 ml-auto">
                            Kur: {data[code][rateType]} ₺
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}