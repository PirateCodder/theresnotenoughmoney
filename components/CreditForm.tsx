"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BanknotesIcon,
  ChartBarIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

interface CreditFormProps {
  principal: number;
  setPrincipal: (v: number) => void;
  interestRate: number;
  setInterestRate: (v: number) => void;
  months: number;
  setMonths: (v: number) => void;
}

const MONTH_OPTIONS = [12, 24, 60, 120];

// Slider sınırları
const SLIDER_MIN_PRINCIPAL = 0;
const SLIDER_MAX_PRINCIPAL = 3000000;
const SLIDER_MIN_RATE = 0;
const SLIDER_MAX_RATE = 10;
const MIN_MONTHS = 1;
const MAX_MONTHS = 180;

/**
 * Serbest yazım destekli input bileşeni.
 * - Yazarken hiçbir kısıtlama yok (0 dahil her değer girilebilir)
 * - Slider ile sürüklemede anlık güncelleme olur
 */
function SliderInput({
  label,
  value,
  sliderMin,
  sliderMax,
  step,
  onChange,
  displaySuffix,
  inputDecimals,
  icon,
  showCurrencyIcon,
}: {
  label: string;
  value: number;
  sliderMin: number;
  sliderMax: number;
  step: number;
  onChange: (v: number) => void;
  displaySuffix: string;
  inputDecimals: number;
  icon: React.ReactNode;
  showCurrencyIcon?: boolean;
}) {
  const formatForDisplay = (v: number) =>
    inputDecimals > 0 ? v.toFixed(inputDecimals) : v.toLocaleString("tr-TR");

  const [inputVal, setInputVal] = useState(formatForDisplay(value));
  const [isFocused, setIsFocused] = useState(false);

  // Dışarıdan value değişince (örn. slider) input'u güncelle — odak yokken
  useEffect(() => {
    if (!isFocused) {
      setInputVal(formatForDisplay(value));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inputDecimals, isFocused]);

  const percentage = Math.min(100, Math.max(0, ((value - sliderMin) / (sliderMax - sliderMin)) * 100));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-onionwhite">
          <span className="text-creamypeach w-4 h-4">{icon}</span>
          <span>{label}</span>
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            inputMode={inputDecimals > 0 ? "decimal" : "numeric"}
            value={inputVal}
            onChange={(e) => {
              const raw = e.target.value.replace(/\./g, "").replace(",", ".");
              setInputVal(e.target.value);
              const parsed = inputDecimals > 0 ? parseFloat(raw) : parseInt(raw);
              if (!isNaN(parsed) && parsed >= 0) {
                onChange(parsed);
              }
            }}
            onFocus={() => {
              setIsFocused(true);
              // Odaklanınca formatsız sayıyı göster
              setInputVal(inputDecimals > 0 ? value.toFixed(inputDecimals) : String(value));
            }}
            onBlur={() => {
              setIsFocused(false);
              const raw = inputVal.replace(/\./g, "").replace(",", ".");
              const parsed = inputDecimals > 0 ? parseFloat(raw) : parseInt(raw);
              const safe = isNaN(parsed) || parsed < 0 ? 0 : parsed;
              onChange(safe);
              setInputVal(formatForDisplay(safe));
            }}
            className={`glass-input w-36 py-1.5 text-right text-sm font-semibold text-babyblossom ${showCurrencyIcon ? "pl-3 pr-7" : "px-3"}`}
          />
          {showCurrencyIcon && (
            <span className="absolute right-2.5 text-sm font-semibold text-creamypeach pointer-events-none select-none">
              ₺
            </span>
          )}
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${percentage}%`,
            background: "linear-gradient(90deg, #486D83, #F4A384)",
            height: "6px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1,
          }}
        />
        <input
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={step}
          value={Math.min(sliderMax, Math.max(sliderMin, value))}
          onChange={(e) => {
            const v = inputDecimals > 0 ? parseFloat(e.target.value) : parseInt(e.target.value);
            onChange(v);
          }}
          className="custom-slider"
          style={{ position: "relative", zIndex: 2 }}
        />
      </div>

      {/* Alt etiketler */}
      <div className="flex justify-between text-xs text-onionwhite/50">
        <span>{sliderMin}{displaySuffix === " ₺" ? " ₺" : displaySuffix === "%" ? "%" : ""}</span>
        <span className="text-creamypeach font-medium">
          {inputDecimals > 0 ? value.toFixed(inputDecimals) : value.toLocaleString("tr-TR")}{displaySuffix}
        </span>
        <span>{sliderMax.toLocaleString("tr-TR")}{displaySuffix === " ₺" ? " ₺" : displaySuffix === "%" ? "%" : ""}</span>
      </div>
    </div>
  );
}

export default function CreditForm({
  principal,
  setPrincipal,
  interestRate,
  setInterestRate,
  months,
  setMonths,
}: CreditFormProps) {
  const [monthInput, setMonthInput] = useState(String(months));

  useEffect(() => {
    setMonthInput(String(months));
  }, [months]);

  const monthPct = Math.min(100, Math.max(0, ((months - MIN_MONTHS) / (MAX_MONTHS - MIN_MONTHS)) * 100));

  return (
    <motion.div
      className="glass-card p-6 md:p-8 space-y-7"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Card Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(244, 163, 132, 0.15)" }}
        >
          <BanknotesIcon className="w-5 h-5 text-creamypeach" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-babyblossom">Kredi Parametreleri</h2>
          <p className="text-xs text-onionwhite/60">Değerleri ayarlayarak simülasyonu başlatın</p>
        </div>
      </div>

      <div className="h-px bg-white/10" />

      {/* Kredi Tutarı */}
      <SliderInput
        label="Kredi Tutarı (TL)"
        value={principal}
        sliderMin={SLIDER_MIN_PRINCIPAL}
        sliderMax={SLIDER_MAX_PRINCIPAL}
        step={10000}
        onChange={setPrincipal}
        displaySuffix=" ₺"
        inputDecimals={0}
        icon={<BanknotesIcon className="w-4 h-4" />}
        showCurrencyIcon
      />

      {/* Faiz Oranı */}
      <SliderInput
        label="Aylık Faiz Oranı (%)"
        value={interestRate}
        sliderMin={SLIDER_MIN_RATE}
        sliderMax={SLIDER_MAX_RATE}
        step={0.01}
        onChange={setInterestRate}
        displaySuffix="%"
        inputDecimals={2}
        icon={<ChartBarIcon className="w-4 h-4" />}
      />

      {/* Vade */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-onionwhite">
            <CalendarDaysIcon className="w-4 h-4 text-creamypeach" />
            <span>Vade (Ay)</span>
          </label>
          <input
            type="number"
            value={monthInput}
            min={0}
            onChange={(e) => {
              const raw = e.target.value;
              setMonthInput(raw);
              const v = parseInt(raw);
              if (!isNaN(v) && v >= 0) setMonths(v);
            }}
            onBlur={() => {
              const v = parseInt(monthInput);
              const safe = isNaN(v) || v < 0 ? 0 : v > MAX_MONTHS ? MAX_MONTHS : v;
              setMonths(safe);
              setMonthInput(String(safe));
            }}
            className="glass-input w-24 px-3 py-1.5 text-right text-sm font-semibold text-babyblossom"
          />
        </div>

        {/* Vade Slider */}
        <div className="relative">
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: `${monthPct}%`,
              background: "linear-gradient(90deg, #486D83, #F4A384)",
              height: "6px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1,
            }}
          />
          <input
            type="range"
            min={MIN_MONTHS}
            max={MAX_MONTHS}
            step={1}
            value={Math.min(MAX_MONTHS, Math.max(MIN_MONTHS, months))}
            onChange={(e) => setMonths(parseInt(e.target.value))}
            className="custom-slider"
            style={{ position: "relative", zIndex: 2 }}
          />
        </div>

        <div className="flex justify-between text-xs text-onionwhite/50">
          <span>1 ay</span>
          <span className="text-creamypeach font-medium">{months} ay</span>
          <span>{MAX_MONTHS} ay</span>
        </div>

        {/* Kısayol butonları */}
        <div className="flex flex-wrap gap-2 pt-1">
          {MONTH_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setMonths(opt)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={
                months === opt
                  ? {
                      background: "#F4A384",
                      color: "#15282F",
                      boxShadow: "0 4px 14px rgba(244, 163, 132, 0.4)",
                    }
                  : {
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#E2D5C2",
                    }
              }
            >
              {opt} ay
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}