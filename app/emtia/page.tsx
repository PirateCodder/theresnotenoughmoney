"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GlobeAltIcon, ChevronDownIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { useMarket } from "@/context/MarketContext";
import PageHeader from "@/components/PageHeader";
import FloatingChatButton from "@/components/FloatingChatButton";

// ─── Emtia meta (sadece etiket, artık ikon yok) ───────────────────────
const EMTIA_META: Record<string, { label: string }> = {
  PETROL:    { label: "Ham Petrol (Brent)" },
  BRENT:     { label: "Brent Petrol" },
  WTI:       { label: "WTI Ham Petrol" },
  ALTIN:     { label: "Altın Ons" },
  GUMUS:     { label: "Gümüş Ons" },
  PLATIN:    { label: "Platin" },
  PALADYUM:  { label: "Paladyum" },
  DOGALGAZ:  { label: "Doğal Gaz" },
  BAKIR:     { label: "Bakır" },
  ALUMINYUM: { label: "Alüminyum" },
  NIKEL:     { label: "Nikel" },
  BUDAY:     { label: "Buğday" },
  MISIR:     { label: "Mısır" },
  SEKER:     { label: "Şeker" },
  KAHVE:     { label: "Kahve" },
  // Sembol→isim eşleştirmesi (API COCOA, COFFEE… gibi dönüyor olabilir)
  COCOA:     { label: "Kakao" },
  COFFEE:    { label: "Kahve" },
  COIL:      { label: "Ham Petrol (Coil)" },
  COPPER:    { label: "Bakır" },
  CORN:      { label: "Mısır" },
  COTTON:    { label: "Pamuk" },
  NGAS:      { label: "Doğal Gaz" },
  SOYBEAN:   { label: "Soya Fasulyesi" },
  SUGAR:     { label: "Şeker" },
  WHEAT:     { label: "Buğday" },
  OIL:       { label: "Ham Petrol" },
  GOLD:      { label: "Altın Ons" },
  SILVER:    { label: "Gümüş Ons" },
  PLATINUM:  { label: "Platin" },
  PALLADIUM: { label: "Paladyum" },
  NATGAS:    { label: "Doğal Gaz" },
};

function getLabel(sembol: string, adi?: string): string {
  const key = sembol.toUpperCase();
  return EMTIA_META[key]?.label ?? adi ?? sembol;
}

// ─── Sayı formatlama (Türkçe: 1.234,56) ─────────────────────────────
function fmtNum(val: string | number, decimals = 2): string {
  const n = typeof val === "string" ? parseFloat(val.replace(",", ".")) : val;
  if (isNaN(n)) return "—";
  const dec = n < 0.01 ? 6 : n < 1 ? 4 : decimals;
  return n.toLocaleString("tr-TR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// ─── Skeleton ─────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="w-36 h-3.5 rounded bg-white/10" />
        <div className="w-16 h-2.5 rounded bg-white/8" />
      </div>
      <div className="w-28 h-4 rounded bg-white/10" />
      <div className="w-14 h-6 rounded-full bg-white/8" />
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
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
      style={{ color, background: bg }}>
      {isUp ? "▲ " : isDown ? "▼ " : ""}{str}
    </span>
  );
}

// ─── Para birimi seçenekleri ──────────────────────────────────────────
const CURRENCY_CODES = ["USD", "TRY", "EUR", "GBP", "CHF", "CAD", "AUD", "JPY"];
const CURRENCY_LABELS: Record<string, string> = {
  USD: "Amerikan Doları", TRY: "Türk Lirası", EUR: "Euro", GBP: "İngiliz Sterlini",
  CHF: "İsviçre Frangı", CAD: "Kanada Doları", AUD: "Avustralya Doları", JPY: "Japon Yeni",
};

// ─── Portal Dropdown ─────────────────────────────────────────────────
function CurrencyDropdown({ value, options, onChange }: {
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
          panelRef.current && !panelRef.current.contains(t)) setOpen(false);
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
    minWidth: Math.max(rect.width, 210), maxHeight: 280, overflowY: "auto",
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
          background: open ? "rgba(127,191,168,0.18)" : "rgba(255,255,255,0.08)",
          border: `1px solid ${open ? "rgba(127,191,168,0.4)" : "rgba(255,255,255,0.15)"}`,
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
                background: value === code ? "rgba(127,191,168,0.15)" : "transparent",
                borderBottom: i < options.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}
              onMouseEnter={(e) => { if (value !== code) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { if (value !== code) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span className="text-xs font-bold flex-shrink-0 rounded-md px-1.5 py-0.5"
                style={{
                  background: value === code ? "rgba(127,191,168,0.25)" : "rgba(255,255,255,0.08)",
                  color: value === code ? "#7FBFA8" : "rgba(226,213,194,0.55)",
                  minWidth: "38px", textAlign: "center",
                }}>{code}</span>
              <span className="text-xs truncate" style={{ color: value === code ? "#FAEFE9" : "rgba(226,213,194,0.45)" }}>
                {CURRENCY_LABELS[code] ?? code}
              </span>
              {value === code && (
                <svg className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: "#7FBFA8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
// Emtia fiyatı USD cinsindendir (kripto ile aynı mantık).
function EmtiaConverter({
  sembol, label, fiyatUSD, doviz,
}: {
  sembol: string; label: string; fiyatUSD: number;
  doviz: Record<string, { alis: string; satis: string }> | null;
}) {
  const [amount, setAmount] = useState("1");
  const [toCurrency, setToCurrency] = useState("TRY");
  const [dir, setDir] = useState<"EMTIA_TO" | "PARA_TO">("EMTIA_TO");
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const handleDirChange = () => setDir(d => d === "EMTIA_TO" ? "PARA_TO" : "EMTIA_TO");

  const getCurrencyPerUSD = (currency: string): number => {
    if (currency === "USD") return 1;
    if (!doviz) return 0;
    if (currency === "TRY") return parseFloat((doviz["USD"]?.satis ?? "0").replace(",", "."));
    const usdTRY = parseFloat((doviz["USD"]?.satis ?? "0").replace(",", "."));
    const currTRY = parseFloat((doviz[currency]?.satis ?? "0").replace(",", "."));
    if (currTRY === 0) return 0;
    return usdTRY / currTRY;
  };

  const getUSDRate = (currency: string): number => {
    if (currency === "USD") return 1;
    if (!doviz) return 0;
    if (currency === "TRY") {
      const usdTRY = parseFloat((doviz["USD"]?.satis ?? "0").replace(",", "."));
      return usdTRY > 0 ? 1 / usdTRY : 0;
    }
    const currTRY = parseFloat((doviz[currency]?.satis ?? "0").replace(",", "."));
    const usdTRY = parseFloat((doviz["USD"]?.satis ?? "0").replace(",", "."));
    if (currTRY === 0 || usdTRY === 0) return 0;
    return currTRY / usdTRY;
  };

  const hesapla = (): string => {
    const val = parseFloat(amount.replace(",", "."));
    if (isNaN(val) || val <= 0 || fiyatUSD <= 0) return "—";

    if (dir === "EMTIA_TO") {
      const valueInUSD = val * fiyatUSD;
      if (toCurrency === "USD") return fmtNum(valueInUSD);
      const rate = getCurrencyPerUSD(toCurrency);
      if (rate === 0) return "—";
      return fmtNum(valueInUSD * rate);
    } else {
      const usdRate = getUSDRate(toCurrency);
      if (usdRate === 0) return "—";
      const valueInUSD = val * usdRate;
      return (valueInUSD / fiyatUSD).toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    }
  };

  const inputUnit = dir === "EMTIA_TO" ? sembol : toCurrency;
  const resultUnit = dir === "EMTIA_TO" ? toCurrency : sembol;

  const availableCurrencies = doviz
    ? CURRENCY_CODES.filter(c => c === "USD" || c === "TRY" || doviz[c])
    : ["USD", "TRY"];

  return (
    <div className="px-4 py-3 space-y-3"
      style={{ background: "rgba(127,191,168,0.04)", borderTop: "1px solid rgba(127,191,168,0.1)" }}>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={inputRef} type="number" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="glass-input w-24 px-3 py-1.5 text-sm font-semibold"
          placeholder="Miktar" />

        {dir === "EMTIA_TO" ? (
          <span className="px-3 py-1.5 rounded-xl text-sm font-semibold flex-shrink-0 max-w-[140px] truncate"
            style={{ background: "rgba(127,191,168,0.15)", color: "#7FBFA8", border: "1px solid rgba(127,191,168,0.3)" }}
            title={label}>
            {label.length > 16 ? sembol : label}
          </span>
        ) : (
          <CurrencyDropdown value={toCurrency} options={availableCurrencies} onChange={setToCurrency} />
        )}

        <button type="button" onClick={handleDirChange} title="Yönü değiştir"
          className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-white/10 flex-shrink-0"
          style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
          <ArrowsRightLeftIcon className="w-4 h-4" style={{ color: "rgba(226,213,194,0.5)" }} />
        </button>

        {dir === "EMTIA_TO" ? (
          <CurrencyDropdown value={toCurrency} options={availableCurrencies} onChange={setToCurrency} />
        ) : (
          <span className="px-3 py-1.5 rounded-xl text-sm font-semibold flex-shrink-0 max-w-[140px] truncate"
            style={{ background: "rgba(127,191,168,0.15)", color: "#7FBFA8", border: "1px solid rgba(127,191,168,0.3)" }}
            title={label}>
            {label.length > 16 ? sembol : label}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-xs" style={{ color: "rgba(226,213,194,0.35)" }}>
          {amount || "—"} {inputUnit} =
        </span>
        <span className="text-xl font-bold" style={{ color: "#FAEFE9" }}>{hesapla()}</span>
        <span className="text-xs" style={{ color: "rgba(226,213,194,0.35)" }}>{resultUnit}</span>
        <span className="text-xs ml-auto" style={{ color: "rgba(226,213,194,0.22)" }}>
          1 {sembol} = {fmtNum(fiyatUSD, 2)} $
        </span>
      </div>
    </div>
  );
}

// ─── Sayfa ────────────────────────────────────────────────────────────
export default function EmtiaPage() {
  const { emtia, doviz, loading, error } = useMarket();
  const [selectedSembol, setSelectedSembol] = useState<string | null>(null);
  const rows = emtia ? Object.entries(emtia) : [];

  return (
    <main className="min-h-screen px-4 py-8 md:px-6 md:py-12">
      <div className="max-w-4xl mx-auto">

        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <PageHeader
            title="Emtia Fiyatları"
            description="Küresel emtia piyasası, USD karşılığı — 5 dakikada bir güncellenir"
            Icon={GlobeAltIcon}
            iconAccent="#7FBFA8"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <div className="rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(127,191,168,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)", overflow: "visible",
            }}>

            {/* Başlık */}
            <div className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider rounded-t-2xl"
              style={{
                gridTemplateColumns: "1fr 130px 80px",
                color: "rgba(226,213,194,0.35)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
              <span>Emtia</span>
              <span className="text-center">Fiyat</span>
              <span className="text-center">Değişim</span>
            </div>

            {/* Satırlar */}
            <div className="divide-y divide-white/[0.05]">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error || !emtia ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm" style={{ color: "rgba(226,213,194,0.4)" }}>
                    Emtia verileri alınamadı. Lütfen daha sonra tekrar deneyin.
                  </p>
                </div>
              ) : rows.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm" style={{ color: "rgba(226,213,194,0.4)" }}>Gösterilecek emtia verisi bulunamadı.</p>
                </div>
              ) : (
                rows.map(([sembol, item], rowIndex) => {
                  const label = getLabel(sembol, item.adi);
                  const fiyatUSD = parseFloat(item.satis.replace(",", "."));
                  const isOpen = selectedSembol === sembol;
                  const isLast = rowIndex === rows.length - 1;

                  return (
                    <React.Fragment key={sembol}>
                      <button
                        onClick={() => setSelectedSembol(isOpen ? null : sembol)}
                        className="w-full grid px-5 py-3.5 items-center text-left transition-colors hover:bg-white/[0.03]"
                        style={{
                          gridTemplateColumns: "1fr 130px 80px",
                          background: isOpen ? "rgba(127,191,168,0.05)" : undefined,
                          borderRadius: isLast && !isOpen ? "0 0 1rem 1rem" : undefined,
                        }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium" style={{ color: "#FAEFE9" }}>{label}</p>
                          <p className="text-xs" style={{ color: "rgba(226,213,194,0.3)" }}>{sembol.toUpperCase()}</p>
                        </div>
                        <p className="text-sm font-semibold text-center" style={{ color: "#FAEFE9" }}>
                          {fmtNum(item.satis)} $
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
                            <EmtiaConverter
                              sembol={sembol.toUpperCase()}
                              label={label}
                              fiyatUSD={isNaN(fiyatUSD) ? 0 : fiyatUSD}
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

          {!loading && !error && rows.length > 0 && (
            <p className="text-center mt-3 text-xs" style={{ color: "rgba(226,213,194,0.2)" }}>
              Dönüştürmek için bir satıra tıklayın
            </p>
          )}

          <motion.footer className="text-center mt-8 text-xs leading-relaxed"
            style={{ color: "rgba(226,213,194,0.2)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <p>Veriler bilgi amaçlıdır. Yatırım tavsiyesi niteliği taşımaz.</p>
          </motion.footer>
        </motion.div>
      </div>

      <FloatingChatButton pageFocus="emtia" />
    </main>
  );
}
