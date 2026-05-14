"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import type { AltinItem, MarketResponse } from "@/app/api/market/route";

const SEMBOL_SIRASI = ["GA", "C", "Y", "T", "CMR", "ATA", "22", "GAG"];

type RateType = "alis" | "satis";

// Sembol → kısa görünen ikon/harf
const SEMBOL_ICON: Record<string, string> = {
  GA:  "Au",
  C:   "¼",
  Y:   "½",
  T:   "1",
  CMR: "CR",
  ATA: "AT",
  "22": "22",
  GAG: "Ag",
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-white/10" />
      <div className="flex-1 space-y-1.5">
        <div className="w-28 h-3 rounded bg-white/10" />
        <div className="w-16 h-2.5 rounded bg-white/8" />
      </div>
      <div className="w-20 h-4 rounded bg-white/10" />
      <div className="w-16 h-4 rounded bg-white/10" />
    </div>
  );
}

function GoldRow({
  sembol,
  item,
  isSelected,
  onClick,
}: {
  sembol: string;
  item: AltinItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isUp = item.yon === "moneyUp";
  const isDown = item.yon === "moneyDown";
  const changeColor = isUp ? "#F4A384" : isDown ? "#a0524e" : "rgba(255,255,255,0.35)";
  const changeBg = isUp
    ? "rgba(244,163,132,0.12)"
    : isDown
    ? "rgba(160,82,78,0.12)"
    : "rgba(255,255,255,0.05)";
  const degisimStr = item.degisim && item.degisim !== "0" ? `${item.degisim}%` : "—";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-white/5"
      style={isSelected ? { background: "rgba(244,163,132,0.06)" } : {}}
    >
      {/* İkon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{ background: "rgba(244,163,132,0.12)", color: "#F4A384" }}
      >
        {SEMBOL_ICON[sembol] ?? sembol}
      </div>

      {/* İsim + sembol */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-babyblossom truncate">{item.adi}</p>
        <p className="text-xs text-onionwhite/30">{sembol}</p>
      </div>

      {/* Alış / Satış */}
      <div className="text-right hidden sm:flex sm:flex-col sm:items-end gap-0.5">
        <p className="text-xs text-onionwhite/65">
          <span className="text-onionwhite/30 mr-1">Alış</span>
          {item.satis} ₺
        </p>
        <p className="text-xs text-onionwhite/40">
          <span className="text-onionwhite/20 mr-1">Satış</span>
          {item.alis} ₺
        </p>
      </div>

      {/* Değişim */}
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ color: changeColor, background: changeBg }}
      >
        {isUp ? "▲" : isDown ? "▼" : "—"} {degisimStr}
      </span>
    </button>
  );
}

export default function GoldMarketGrid() {
  const [altin, setAltin] = useState<Record<string, AltinItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedSembol, setSelectedSembol] = useState<string | null>(null);
  const [amount, setAmount] = useState("1000");
  const [rateType, setRateType] = useState<RateType>("satis");
  const [direction, setDirection] = useState<"TRY_TO_ALTIN" | "ALTIN_TO_TRY">("TRY_TO_ALTIN");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/market")
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json() as Promise<MarketResponse>;
      })
      .then((json) => {
        if (json.altin) setAltin(json.altin);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleRowClick = (s: string) => {
    if (selectedSembol === s) {
      setSelectedSembol(null);
    } else {
      setSelectedSembol(s);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  };

  const getResult = (): string => {
    if (!altin || !selectedSembol) return "—";
    const item = altin[selectedSembol];
    if (!item) return "—";
    const rate = parseFloat(item[rateType].replace(",", "."));
    const value = parseFloat(amount.replace(",", "."));
    if (isNaN(rate) || isNaN(value) || rate === 0) return "—";
    const result = direction === "TRY_TO_ALTIN" ? value / rate : value * rate;
    return result.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  const selectedItem = selectedSembol && altin ? altin[selectedSembol] : null;
  const fromLabel = direction === "TRY_TO_ALTIN" ? "₺" : (selectedItem?.adi ?? "");
  const toLabel = direction === "TRY_TO_ALTIN" ? (selectedItem?.adi ?? "") : "₺";

  if (error) return null;

  return (
    <motion.div
      className="max-w-7xl mx-auto mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <p className="text-xs font-semibold text-onionwhite/35 uppercase tracking-widest px-1 mb-3">
        Altın &amp; Kıymetli Madenler
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
        {/* Satır listesi */}
        <div className="divide-y divide-white/[0.06]">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            : altin
            ? SEMBOL_SIRASI.filter((s) => altin[s]).map((s) => (
                <React.Fragment key={s}>
                  <GoldRow
                    sembol={s}
                    item={altin[s]}
                    isSelected={selectedSembol === s}
                    onClick={() => handleRowClick(s)}
                  />

                  {/* İnline dönüştürücü */}
                  <AnimatePresence>
                    {selectedSembol === s && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          className="px-5 py-4 space-y-3"
                          style={{ background: "rgba(244,163,132,0.04)", borderTop: "1px solid rgba(244,163,132,0.1)" }}
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
                                setDirection((d) =>
                                  d === "TRY_TO_ALTIN" ? "ALTIN_TO_TRY" : "TRY_TO_ALTIN"
                                )
                              }
                              className="p-2 rounded-lg transition-colors hover:bg-white/10"
                            >
                              <ArrowsRightLeftIcon className="w-4 h-4 text-onionwhite/50" />
                            </button>

                            {/* Alış / Satış */}
                            <div className="flex gap-1.5">
                              {([
                                { key: "satis" as RateType, label: "Satış" },
                                { key: "alis" as RateType, label: "Alış" },
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
                            {selectedItem && (
                              <span className="text-xs text-onionwhite/25 ml-auto">
                                Kur: {selectedItem[rateType]} ₺
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))
            : null}
        </div>
      </div>
    </motion.div>
  );
}