"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import type { DovizItem, AltinItem, MarketResponse } from "@/app/api/market/route";

// ─── Sabitler ────────────────────────────────────────────────────────
const DOVIZ_SIRASI = ["USD", "EUR", "GBP", "CHF", "RUB"];
const ALTIN_SIRASI = ["GA", "C", "Y", "T", "CMR", "ATA", "22", "GAG"];

const DOVIZ_META: Record<string, { label: string; sublabel: string; icon: string; accentColor: string }> = {
  USD: { label: "Amerikan Doları", sublabel: "USD", icon: "$",  accentColor: "#F4A384" },
  EUR: { label: "Euro",            sublabel: "EUR", icon: "€",  accentColor: "#8BAFC4" },
  GBP: { label: "İngiliz Sterlini",sublabel: "GBP", icon: "£",  accentColor: "#A89BC2" },
  CHF: { label: "İsviçre Frangı",  sublabel: "CHF", icon: "Fr", accentColor: "#7FBFA8" },
  RUB: { label: "Rus Rublesi",     sublabel: "RUB", icon: "₽",  accentColor: "#C28B7A" },
};

const ALTIN_META: Record<string, { label: string; icon: string }> = {
  GA:  { label: "Gram Altın",       icon: "Au" },
  C:   { label: "Çeyrek Altın",     icon: "¼"  },
  Y:   { label: "Yarım Altın",      icon: "½"  },
  T:   { label: "Tam Altın",        icon: "1"  },
  CMR: { label: "Cumhuriyet Altını",icon: "CR" },
  ATA: { label: "Ata Altın",        icon: "AT" },
  "22":{ label: "22 Ayar Bilezik",  icon: "22" },
  GAG: { label: "Gram Gümüş",       icon: "Ag" },
};

const GOLD_COLOR = "#D4AA60";

// ─── Yardımcılar ─────────────────────────────────────────────────────
function DegisimBadge({ degisim, yon }: { degisim: string; yon: "moneyUp" | "moneyDown" | "neutral" }) {
  const isUp = yon === "moneyUp";
  const isDown = yon === "moneyDown";
  const color = isUp ? "#F4A384" : isDown ? "#a0524e" : "rgba(255,255,255,0.3)";
  const bg    = isUp ? "rgba(244,163,132,0.12)" : isDown ? "rgba(160,82,78,0.12)" : "rgba(255,255,255,0.05)";
  const str   = degisim && degisim !== "0" ? `${degisim}%` : "";
  if (!str) return <span className="w-14 flex-shrink-0" />;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
      style={{ color, background: bg }}>
      {isUp ? "▲" : isDown ? "▼" : ""} {str}
    </span>
  );
}

// ─── Swap butonu ──────────────────────────────────────────────────────
function SwapButton({ onSwap }: { onSwap: () => void }) {
  return (
    <button
      onClick={onSwap}
      className="w-7 h-7 flex items-center justify-center flex-shrink-0 rounded-full transition-colors hover:bg-white/10"
      style={{ border: "1px solid rgba(255,255,255,0.18)" }}
      title="Yönü değiştir"
    >
      <ArrowsRightLeftIcon className="w-3.5 h-3.5 text-onionwhite/50" />
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-white/10" />
      <div className="flex-1 space-y-1.5">
        <div className="w-24 h-3 rounded bg-white/10" />
        <div className="w-14 h-2.5 rounded bg-white/8" />
      </div>
      <div className="w-28 h-4 rounded bg-white/10" />
      <div className="w-14 h-6 rounded-full bg-white/8" />
    </div>
  );
}

// ─── Satır bileşeni ───────────────────────────────────────────────────
interface BaseRowProps {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  accentColor: string;
  alisFiyat: string;
  satisFiyat: string;
  degisim: string;
  yon: "moneyUp" | "moneyDown" | "neutral";
  isSelected: boolean;
  onClick: () => void;
}

function MarketRow({ label, sublabel, icon, accentColor, alisFiyat, satisFiyat, degisim, yon, isSelected, onClick }: BaseRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-white/5"
      style={isSelected ? { background: "rgba(244,163,132,0.06)" } : {}}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{ background: `${accentColor}18`, color: accentColor }}>
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-babyblossom truncate">{label}</p>
        <p className="text-xs text-onionwhite/30">{sublabel}</p>
      </div>

      <div className="hidden sm:flex flex-col items-end gap-0.5">
        <p className="text-xs text-onionwhite/65">
          <span className="text-onionwhite/30 mr-1">Alış</span>{alisFiyat} ₺
        </p>
        <p className="text-xs text-onionwhite/40">
          <span className="text-onionwhite/20 mr-1">Satış</span>{satisFiyat} ₺
        </p>
      </div>
      <div className="sm:hidden">
        <p className="text-sm font-semibold text-babyblossom">{alisFiyat} ₺</p>
      </div>

      <DegisimBadge degisim={degisim} yon={yon} />
    </button>
  );
}

// ─── Dönüştürücü ─────────────────────────────────────────────────────
function Converter({
  alisFiyat,
  satisFiyat,
  sublabel,
  inputRef,
}: {
  alisFiyat: string;
  satisFiyat: string;
  sublabel: string;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  const [amount, setAmount] = useState("1000");
  const [useAlis, setUseAlis] = useState(true);
  const [direction, setDirection] = useState<"TRY_TO" | "TO_TRY">("TRY_TO");

  const fromLabel = direction === "TRY_TO" ? "₺" : sublabel;
  const toLabel   = direction === "TRY_TO" ? sublabel : "₺";

  const getResult = (): string => {
    const rateStr = useAlis ? alisFiyat : satisFiyat;
    const rate  = parseFloat(rateStr.replace(",", "."));
    const value = parseFloat(amount.replace(",", "."));
    if (isNaN(rate) || isNaN(value) || rate === 0) return "—";
    const result = direction === "TRY_TO" ? value / rate : value * rate;
    return result.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  return (
    <div className="px-5 py-4 space-y-3"
      style={{ background: "rgba(244,163,132,0.04)", borderTop: "1px solid rgba(244,163,132,0.1)" }}>
      <div className="flex flex-wrap items-center gap-3">
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

        <SwapButton onSwap={() => setDirection((d) => d === "TRY_TO" ? "TO_TRY" : "TRY_TO")} />

        <div className="flex gap-1.5">
          {([{ val: true, label: "Alış" }, { val: false, label: "Satış" }]).map(({ val, label }) => (
            <button key={String(val)} onClick={() => setUseAlis(val)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={useAlis === val
                ? { background: "rgba(244,163,132,0.2)", color: "#F4A384", border: "1px solid rgba(244,163,132,0.3)" }
                : { background: "rgba(255,255,255,0.05)", color: "#E2D5C2", border: "1px solid rgba(255,255,255,0.08)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-xs text-onionwhite/35">{amount || "—"} {fromLabel} =</span>
        <span className="text-xl font-bold text-babyblossom">{getResult()}</span>
        <span className="text-xs text-onionwhite/35">{toLabel}</span>
        <span className="text-xs text-onionwhite/25 ml-auto">
          Kur: {useAlis ? alisFiyat : satisFiyat} ₺
        </span>
      </div>
    </div>
  );
}

// ─── Ana bileşen ──────────────────────────────────────────────────────
export default function MarketList() {
  const [doviz, setDoviz] = useState<Record<string, DovizItem> | null>(null);
  const [altin, setAltin] = useState<Record<string, AltinItem> | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/market")
      .then((r) => r.ok ? r.json() as Promise<MarketResponse> : Promise.reject())
      .then((json) => {
        if (json.doviz) setDoviz(json.doviz);
        if (json.altin) setAltin(json.altin);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleClick = (id: string) => {
    setSelectedId((prev) => prev === id ? null : id);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const renderRow = (id: string, meta: { label: string; sublabel: string; icon: string; accentColor: string },
    alisFiyat: string, satisFiyat: string, degisim: string, yon: "moneyUp" | "moneyDown" | "neutral") => (
    <React.Fragment key={id}>
      <MarketRow
        id={id} label={meta.label} sublabel={meta.sublabel} icon={meta.icon}
        accentColor={meta.accentColor} alisFiyat={alisFiyat} satisFiyat={satisFiyat}
        degisim={degisim} yon={yon} isSelected={selectedId === id}
        onClick={() => handleClick(id)}
      />
      <AnimatePresence>
        {selectedId === id && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}>
            <Converter
              alisFiyat={alisFiyat} satisFiyat={satisFiyat}
              sublabel={meta.sublabel} inputRef={inputRef}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </React.Fragment>
  );

  return (
    <motion.div className="max-w-7xl mx-auto mb-6"
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
        <div className="divide-y divide-white/[0.06]">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          ) : (
            <>
              {/* Döviz satırları */}
              {doviz && DOVIZ_SIRASI.filter((k) => doviz[k]).map((kod) => {
                const meta = DOVIZ_META[kod];
                const item = doviz[kod];
                // Döviz: kullanıcı alış = bankanın satış, kullanıcı satış = bankanın alış
                return renderRow(kod, meta, item.satis, item.alis, item.degisim, item.yon);
              })}

              {/* Altın satırları */}
              {altin && ALTIN_SIRASI.filter((k) => altin[k]).map((sembol) => {
                const meta = { ...ALTIN_META[sembol] ?? { label: sembol, icon: sembol }, sublabel: sembol, accentColor: GOLD_COLOR };
                const item = altin[sembol];
                // Altın: kullanıcı alış = bankanın satış, kullanıcı satış = bankanın alış
                return renderRow(sembol, meta, item.satis, item.alis, item.degisim, item.yon);
              })}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}