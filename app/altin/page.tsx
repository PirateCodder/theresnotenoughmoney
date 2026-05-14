"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BanknotesIcon, ChevronDownIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { useMarket } from "@/context/MarketContext";
import PageHeader from "@/components/PageHeader";
import FloatingChatButton from "@/components/FloatingChatButton";

// ─── Sabitler ─────────────────────────────────────────────────────────
const ALTIN_SIRA = ["GA", "C", "Y", "T", "CMR", "ATA", "22", "14", "18", "GAG", "GAS", "PLATIN", "PALADYUM"];

const ALTIN_META: Record<string, { label: string; birim: string; icon: string; accent: string }> = {
  GA:       { label: "Gram Altın",        birim: "gr",   icon: "Au", accent: "#D4AA60" },
  C:        { label: "Çeyrek Altın",      birim: "adet", icon: "¼",  accent: "#D4AA60" },
  Y:        { label: "Yarım Altın",       birim: "adet", icon: "½",  accent: "#D4AA60" },
  T:        { label: "Tam Altın",         birim: "adet", icon: "1",  accent: "#D4AA60" },
  CMR:      { label: "Cumhuriyet Altını", birim: "adet", icon: "CR", accent: "#C2956E" },
  ATA:      { label: "Ata Altın",         birim: "adet", icon: "AT", accent: "#C2956E" },
  "22":     { label: "22 Ayar Bilezik",   birim: "gr",   icon: "22", accent: "#D4AA60" },
  "14":     { label: "14 Ayar Altın",     birim: "gr",   icon: "14", accent: "#C2956E" },
  "18":     { label: "18 Ayar Altın",     birim: "gr",   icon: "18", accent: "#D4AA60" },
  GAG:      { label: "Gram Gümüş",        birim: "gr",   icon: "Ag", accent: "#A8A8B8" },
  GAS:      { label: "Gümüş Ons",         birim: "ons",  icon: "Ag", accent: "#A8A8B8" },
  PLATIN:   { label: "Platin",            birim: "gr",   icon: "Pt", accent: "#8BAFC4" },
  PALADYUM: { label: "Paladyum",          birim: "gr",   icon: "Pd", accent: "#A89BC2" },
};

// Döviz seçenekleri (dönüştürücü için)
const DOVIZ_CODES = ["TRY", "USD", "EUR", "GBP", "CHF", "CAD", "AUD", "JPY"];
const DOVIZ_LABELS: Record<string, string> = {
  TRY: "Türk Lirası", USD: "Amerikan Doları", EUR: "Euro", GBP: "İngiliz Sterlini",
  CHF: "İsviçre Frangı", CAD: "Kanada Doları", AUD: "Avustralya Doları", JPY: "Japon Yeni",
};

// ─── Sayı Formatlama (Türkçe: 1.234,56) ──────────────────────────────
function fmtTRY(val: string | number, decimals = 2): string {
  const n = typeof val === "string" ? parseFloat(val.replace(",", ".")) : val;
  if (isNaN(n)) return "—";
  return n.toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ─── Skeleton ─────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
      <div className="w-9 h-9 rounded-lg bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="w-32 h-3.5 rounded bg-white/10" />
        <div className="w-10 h-2.5 rounded bg-white/8" />
      </div>
      <div className="w-28 h-4 rounded bg-white/10" />
      <div className="w-14 h-5 rounded-full bg-white/8" />
    </div>
  );
}

// ─── Değişim Rozeti ───────────────────────────────────────────────────
function DegisimBadge({ degisim, yon }: { degisim: string; yon: "moneyUp" | "moneyDown" | "neutral" }) {
  const isUp = yon === "moneyUp";
  const isDown = yon === "moneyDown";
  const color = isUp ? "#F4A384" : isDown ? "#e05a5a" : "rgba(255,255,255,0.3)";
  const bg = isUp ? "rgba(244,163,132,0.12)" : isDown ? "rgba(224,90,90,0.12)" : "rgba(255,255,255,0.05)";
  const str = degisim && degisim !== "0" ? `${degisim}%` : "—";
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color, background: bg }}>
      {isUp ? "▲ " : isDown ? "▼ " : ""}{str}
    </span>
  );
}

// ─── Portal Dropdown ─────────────────────────────────────────────────
function CurrencyDropdown({
  value, options, onChange,
}: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updateRect = useCallback(() => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(t) &&
          panelRef.current && !panelRef.current.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const update = () => updateRect();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); };
  }, [open, updateRect]);

  const panelStyle: React.CSSProperties = rect ? {
    position: "fixed", top: rect.bottom + 6, left: rect.left, zIndex: 9999,
    minWidth: Math.max(rect.width, 200), maxHeight: 280, overflowY: "auto",
    background: "rgba(15,30,37,0.97)", backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
  } : { display: "none" };

  return (
    <div className="relative flex-shrink-0">
      <button ref={triggerRef} type="button"
        onClick={() => { updateRect(); setOpen(o => !o); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: open ? "rgba(212,170,96,0.18)" : "rgba(255,255,255,0.08)",
          border: `1px solid ${open ? "rgba(212,170,96,0.4)" : "rgba(255,255,255,0.15)"}`,
          color: "#FAEFE9", minWidth: "72px",
        }}>
        <span className="flex-1 text-left">{value}</span>
        <ChevronDownIcon className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: "rgba(226,213,194,0.5)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div ref={panelRef} style={panelStyle}>
          {options.map((code, i) => (
            <button key={code} type="button"
              onClick={() => { onChange(code); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left"
              style={{
                background: value === code ? "rgba(212,170,96,0.15)" : "transparent",
                borderBottom: i < options.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}
              onMouseEnter={(e) => { if (value !== code) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { if (value !== code) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span className="text-xs font-bold flex-shrink-0 rounded-md px-1.5 py-0.5"
                style={{
                  background: value === code ? "rgba(212,170,96,0.25)" : "rgba(255,255,255,0.08)",
                  color: value === code ? "#D4AA60" : "rgba(226,213,194,0.55)",
                  minWidth: "38px", textAlign: "center",
                }}>{code}</span>
              <span className="text-xs truncate" style={{ color: value === code ? "#FAEFE9" : "rgba(226,213,194,0.45)" }}>
                {DOVIZ_LABELS[code] ?? code}
              </span>
              {value === code && (
                <svg className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: "#D4AA60" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>, document.body
      )}
    </div>
  );
}

// ─── Inline Dönüştürücü ───────────────────────────────────────────────
function AltinConverter({
  sembol, birim, alis, satis, doviz,
}: {
  sembol: string; birim: string; alis: string; satis: string;
  doviz: Record<string, { alis: string; satis: string }> | null;
}) {
  const [amount, setAmount] = useState("1");
  const [toCurrency, setToCurrency] = useState("TRY");
  // KOD_TO = altın sat (bozdurmak) → alış kuru | TO_KOD = altın al → satış kuru
  const [dir, setDir] = useState<"KOD_TO" | "TO_KOD">("KOD_TO");
  const [useAlis, setUseAlis] = useState(true); // KOD_TO=alış, TO_KOD=satış default
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const handleDirChange = () => {
    const nd = dir === "KOD_TO" ? "TO_KOD" : "KOD_TO";
    setDir(nd);
    setUseAlis(nd === "KOD_TO");
  };

  // TRY cinsinden altın birim fiyatı
  const altinTRY = (): number => parseFloat((useAlis ? alis : satis).replace(",", "."));

  // Hedef dövizin TRY değeri (TRY=1)
  const dovizTRY = (): number => {
    if (toCurrency === "TRY") return 1;
    if (!doviz) return 0;
    const entry = doviz[toCurrency];
    if (!entry) return 0;
    // KOD_TO: dövize çevirirken dövizin satış kuruyla bölünür (banka dövizi pahalıya satar)
    // TO_KOD: dövizi altına çevirirken dövizin alış kuruyla çarpılır (banka dövizi ucuza alır)
    return parseFloat((dir === "KOD_TO" ? entry.satis : entry.alis).replace(",", "."));
  };

  const hesapla = (): string => {
    const val = parseFloat(amount.replace(",", "."));
    if (isNaN(val) || val <= 0) return "—";
    const aRate = altinTRY();
    const dRate = dovizTRY();
    if (isNaN(aRate) || aRate === 0) return "—";

    if (dir === "KOD_TO") {
      // val birim altın → TRY → toCurrency
      const tryAmt = val * aRate;
      if (toCurrency === "TRY") return fmtTRY(tryAmt);
      if (isNaN(dRate) || dRate === 0) return "—";
      return (tryAmt / dRate).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    } else {
      // val toCurrency → TRY → altın birimi
      const tryAmt = toCurrency === "TRY" ? val : val * dRate;
      if (isNaN(tryAmt) || aRate === 0) return "—";
      return (tryAmt / aRate).toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    }
  };

  const inputUnit = dir === "KOD_TO" ? birim : toCurrency;
  const resultUnit = dir === "KOD_TO" ? toCurrency : birim;
  const activeRate = useAlis ? alis : satis;
  const rateLabel = useAlis ? "alış" : "satış";

  const availableCurrencies = doviz
    ? DOVIZ_CODES.filter(c => c === "TRY" || doviz[c])
    : ["TRY"];

  return (
    <div className="px-4 py-3 space-y-3"
      style={{ background: "rgba(212,170,96,0.04)", borderTop: "1px solid rgba(212,170,96,0.1)" }}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Miktar */}
        <input ref={inputRef} type="number" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="glass-input w-24 px-3 py-1.5 text-sm font-semibold"
          placeholder="Miktar" />

        {/* Sol — yöne göre */}
        {dir === "KOD_TO" ? (
          <span className="px-3 py-1.5 rounded-xl text-sm font-semibold flex-shrink-0"
            style={{ background: "rgba(212,170,96,0.15)", color: "#D4AA60", border: "1px solid rgba(212,170,96,0.3)" }}>
            {birim}
          </span>
        ) : (
          <CurrencyDropdown value={toCurrency} options={availableCurrencies} onChange={setToCurrency} />
        )}

        {/* Swap */}
        <button type="button" onClick={handleDirChange} title="Yönü değiştir"
          className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-white/10 flex-shrink-0"
          style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
          <ArrowsRightLeftIcon className="w-4 h-4" style={{ color: "rgba(226,213,194,0.5)" }} />
        </button>

        {/* Sağ — yöne göre */}
        {dir === "KOD_TO" ? (
          <CurrencyDropdown value={toCurrency} options={availableCurrencies} onChange={setToCurrency} />
        ) : (
          <span className="px-3 py-1.5 rounded-xl text-sm font-semibold flex-shrink-0"
            style={{ background: "rgba(212,170,96,0.15)", color: "#D4AA60", border: "1px solid rgba(212,170,96,0.3)" }}>
            {birim}
          </span>
        )}

        {/* Alış / Satış */}
        <div className="flex gap-1 ml-auto">
          {([{ v: true, label: "Alış" }, { v: false, label: "Satış" }]).map(({ v, label }) => (
            <button key={String(v)} type="button" onClick={() => setUseAlis(v)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={useAlis === v
                ? { background: "rgba(212,170,96,0.2)", color: "#D4AA60", border: "1px solid rgba(212,170,96,0.35)" }
                : { background: "rgba(255,255,255,0.05)", color: "rgba(226,213,194,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sonuç */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-xs" style={{ color: "rgba(226,213,194,0.35)" }}>
          {amount || "—"} {inputUnit} =
        </span>
        <span className="text-xl font-bold" style={{ color: "#FAEFE9" }}>{hesapla()}</span>
        <span className="text-xs" style={{ color: "rgba(226,213,194,0.35)" }}>{resultUnit}</span>
        <span className="text-xs ml-auto" style={{ color: "rgba(226,213,194,0.22)" }}>
          Kur ({rateLabel}): {fmtTRY(activeRate)} ₺/{birim}
        </span>
      </div>
    </div>
  );
}

// ─── Sayfa ────────────────────────────────────────────────────────────
export default function AltinPage() {
  const { altin, doviz, loading, error } = useMarket();
  const [selectedSembol, setSelectedSembol] = useState<string | null>(null);

  const keys = altin
    ? [...ALTIN_SIRA.filter((k) => altin[k]), ...Object.keys(altin).filter((k) => !ALTIN_SIRA.includes(k))]
    : [];

  return (
    <main className="min-h-screen px-4 py-8 md:px-6 md:py-12">
      <div className="max-w-4xl mx-auto">

        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <PageHeader
            title="Altın & Değerli Madenler"
            description="Tüm fiyatlar TL karşılığı — 5 dakikada bir güncellenir"
            Icon={BanknotesIcon}
            iconAccent="#D4AA60"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <div className="rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(212,170,96,0.15)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)", overflow: "visible",
            }}>

            {/* Başlık satırı */}
            <div className="grid px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-t-2xl"
              style={{
                gridTemplateColumns: "1fr 110px 110px 72px",
                color: "rgba(226,213,194,0.35)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
              <span>Değerli Maden</span>
              <span className="text-center">Alış</span>
              <span className="text-center">Satış</span>
              <span className="text-center">Değişim</span>
            </div>

            {/* Satırlar */}
            <div className="divide-y divide-white/[0.05]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error || !altin ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm" style={{ color: "rgba(226,213,194,0.4)" }}>Veri alınamadı. Lütfen daha sonra tekrar deneyin.</p>
                </div>
              ) : (
                keys.map((sembol, rowIndex) => {
                  const item = altin[sembol];
                  if (!item) return null;
                  const meta = ALTIN_META[sembol] ?? { label: item.adi || sembol, birim: "gr", icon: sembol.slice(0, 2), accent: "#D4AA60" };
                  const isOpen = selectedSembol === sembol;
                  const isLast = rowIndex === keys.length - 1;

                  return (
                    <React.Fragment key={sembol}>
                      <button
                        onClick={() => setSelectedSembol(isOpen ? null : sembol)}
                        className="w-full grid px-4 py-3 items-center text-left transition-colors hover:bg-white/[0.03]"
                        style={{
                          gridTemplateColumns: "1fr 110px 110px 72px",
                          background: isOpen ? "rgba(212,170,96,0.05)" : undefined,
                          borderRadius: isLast && !isOpen ? "0 0 1rem 1rem" : undefined,
                        }}
                      >
                        <div className="flex items-center min-w-0">
                          <div className="min-w-0">
                            <p className="text-sm font-medium" style={{ color: "#FAEFE9" }}>{meta.label}</p>
                            <p className="text-xs" style={{ color: "rgba(226,213,194,0.3)" }}>{sembol} · {meta.birim}</p>
                          </div>
                        </div>
                        <p className="text-sm text-center" style={{ color: "rgba(226,213,194,0.6)" }}>
                          {fmtTRY(item.alis)}
                        </p>
                        <p className="text-sm font-semibold text-center" style={{ color: "#FAEFE9" }}>
                          {fmtTRY(item.satis)}
                        </p>
                        <div className="flex justify-center">
                          <DegisimBadge degisim={item.degisim} yon={item.yon} />
                        </div>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            style={{ overflow: "visible" }}
                          >
                            <AltinConverter
                              sembol={sembol}
                              birim={meta.birim}
                              alis={item.alis}
                              satis={item.satis}
                              doviz={doviz}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>

          {!loading && !error && keys.length > 0 && (
            <p className="text-center mt-3 text-xs" style={{ color: "rgba(226,213,194,0.2)" }}>
              Dönüştürmek için bir satıra tıklayın
            </p>
          )}
        </motion.div>
      </div>

      <FloatingChatButton pageFocus="altin" />
    </main>
  );
}
