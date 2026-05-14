"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CpuChipIcon, ChevronDownIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { useMarket } from "@/context/MarketContext";
import PageHeader from "@/components/PageHeader";

// ─── Sayı formatlama (Türkçe: 1.234,56) ─────────────────────────────
function fmtNum(val: string | number, decimals = 2): string {
  const n = typeof val === "string" ? parseFloat(val.replace(",", ".")) : val;
  if (isNaN(n)) return "—";
  // Küçük değerler için daha fazla ondalık
  const dec = n < 0.01 ? 6 : n < 1 ? 4 : decimals;
  return n.toLocaleString("tr-TR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// ─── Skeleton ─────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="w-24 h-3.5 rounded bg-white/10" />
        <div className="w-12 h-2.5 rounded bg-white/8" />
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
          background: open ? "rgba(168,155,194,0.18)" : "rgba(255,255,255,0.08)",
          border: `1px solid ${open ? "rgba(168,155,194,0.4)" : "rgba(255,255,255,0.15)"}`,
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
                background: value === code ? "rgba(168,155,194,0.15)" : "transparent",
                borderBottom: i < options.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}
              onMouseEnter={(e) => { if (value !== code) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { if (value !== code) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span className="text-xs font-bold flex-shrink-0 rounded-md px-1.5 py-0.5"
                style={{
                  background: value === code ? "rgba(168,155,194,0.25)" : "rgba(255,255,255,0.08)",
                  color: value === code ? "#A89BC2" : "rgba(226,213,194,0.55)",
                  minWidth: "38px", textAlign: "center",
                }}>{code}</span>
              <span className="text-xs truncate" style={{ color: value === code ? "#FAEFE9" : "rgba(226,213,194,0.45)" }}>
                {CURRENCY_LABELS[code] ?? code}
              </span>
              {value === code && (
                <svg className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: "#A89BC2" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
// Kripto fiyatı USD cinsindendir.
// USD→diğer: USD satış kuruyla TRY'e çevir, sonra hedef döviz satış kuruyla böl.
// diğer→miktar kripto: hedef dövizi USD'ye çevir, sonra kripto fiyatına böl.
function KriptoConverter({
  sembol, fiyatUSD, doviz,
}: {
  sembol: string;
  fiyatUSD: number; // kripto fiyatı USD cinsinden
  doviz: Record<string, { alis: string; satis: string }> | null;
}) {
  const [amount, setAmount] = useState("1");
  const [toCurrency, setToCurrency] = useState("TRY");
  // "KRIPTO_TO" = kripto → para birimi | "PARA_TO" = para birimi → kripto
  const [dir, setDir] = useState<"KRIPTO_TO" | "PARA_TO">("KRIPTO_TO");
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const handleDirChange = () => setDir(d => d === "KRIPTO_TO" ? "PARA_TO" : "KRIPTO_TO");

  // toCurrency'nin USD karşılığını bul (satış kuru üzerinden)
  const getUSDRate = (currency: string): number => {
    if (currency === "USD") return 1;
    if (!doviz) return 0;
    if (currency === "TRY") {
      // 1 USD = kaç TRY (USD satış kurunu kullan)
      const usdTRY = parseFloat((doviz["USD"]?.satis ?? "0").replace(",", "."));
      return usdTRY > 0 ? 1 / usdTRY : 0; // 1 TRY = ? USD
    }
    // Diğer dövizler: önce TRY'e çevir, sonra USD'ye
    const currTRY = parseFloat((doviz[currency]?.satis ?? "0").replace(",", "."));
    const usdTRY = parseFloat((doviz["USD"]?.satis ?? "0").replace(",", "."));
    if (currTRY === 0 || usdTRY === 0) return 0;
    return currTRY / usdTRY; // 1 currency = ? USD
  };

  // Hedef para birimindeki 1 USD değeri
  const getCurrencyPerUSD = (currency: string): number => {
    if (currency === "USD") return 1;
    if (!doviz) return 0;
    if (currency === "TRY") return parseFloat((doviz["USD"]?.satis ?? "0").replace(",", "."));
    // Diğer: 1 USD → TRY → currency
    const usdTRY = parseFloat((doviz["USD"]?.satis ?? "0").replace(",", "."));
    const currTRY = parseFloat((doviz[currency]?.satis ?? "0").replace(",", "."));
    if (currTRY === 0) return 0;
    return usdTRY / currTRY;
  };

  const hesapla = (): string => {
    const val = parseFloat(amount.replace(",", "."));
    if (isNaN(val) || val <= 0) return "—";
    if (fiyatUSD <= 0) return "—";

    if (dir === "KRIPTO_TO") {
      // val adet kripto → toCurrency
      const valueInUSD = val * fiyatUSD;
      if (toCurrency === "USD") return fmtNum(valueInUSD);
      const rate = getCurrencyPerUSD(toCurrency);
      if (rate === 0) return "—";
      return fmtNum(valueInUSD * rate);
    } else {
      // val toCurrency → kaç adet kripto
      const usdRate = getUSDRate(toCurrency); // 1 toCurrency = ? USD
      if (usdRate === 0) return "—";
      const valueInUSD = val * usdRate;
      return (valueInUSD / fiyatUSD).toLocaleString("tr-TR", { minimumFractionDigits: 6, maximumFractionDigits: 8 });
    }
  };

  const inputUnit = dir === "KRIPTO_TO" ? sembol : toCurrency;
  const resultUnit = dir === "KRIPTO_TO" ? toCurrency : sembol;

  const availableCurrencies = doviz
    ? CURRENCY_CODES.filter(c => c === "USD" || c === "TRY" || doviz[c])
    : ["USD", "TRY"];

  return (
    <div className="px-4 py-3 space-y-3"
      style={{ background: "rgba(168,155,194,0.04)", borderTop: "1px solid rgba(168,155,194,0.1)" }}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Miktar */}
        <input ref={inputRef} type="number" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="glass-input w-24 px-3 py-1.5 text-sm font-semibold"
          placeholder="Miktar" />

        {/* Sol */}
        {dir === "KRIPTO_TO" ? (
          <span className="px-3 py-1.5 rounded-xl text-sm font-semibold flex-shrink-0"
            style={{ background: "rgba(168,155,194,0.15)", color: "#A89BC2", border: "1px solid rgba(168,155,194,0.3)" }}>
            {sembol}
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

        {/* Sağ */}
        {dir === "KRIPTO_TO" ? (
          <CurrencyDropdown value={toCurrency} options={availableCurrencies} onChange={setToCurrency} />
        ) : (
          <span className="px-3 py-1.5 rounded-xl text-sm font-semibold flex-shrink-0"
            style={{ background: "rgba(168,155,194,0.15)", color: "#A89BC2", border: "1px solid rgba(168,155,194,0.3)" }}>
            {sembol}
          </span>
        )}
      </div>

      {/* Sonuç */}
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
export default function KriptoPage() {
  const { kripto, doviz, loading, error } = useMarket();
  const [selectedSembol, setSelectedSembol] = useState<string | null>(null);
  const rows = kripto ? Object.entries(kripto) : [];

  return (
    <main className="min-h-screen px-4 py-8 md:px-6 md:py-12">
      <div className="max-w-4xl mx-auto">

        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <PageHeader
            title="Kripto Para Piyasası"
            description="Tüm fiyatlar USD karşılığı — 5 dakikada bir güncellenir"
            Icon={CpuChipIcon}
            iconAccent="#A89BC2"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <div className="rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(168,155,194,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)", overflow: "visible",
            }}>

            {/* Başlık */}
            <div className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider rounded-t-2xl"
              style={{
                gridTemplateColumns: "1fr 130px 80px",
                color: "rgba(226,213,194,0.35)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
              <span>Kripto Para</span>
              <span className="text-center">Fiyat</span>
              <span className="text-center">Değişim</span>
            </div>

            {/* Satırlar */}
            <div className="divide-y divide-white/[0.05]">
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error || !kripto ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm" style={{ color: "rgba(226,213,194,0.4)" }}>
                    Kripto verileri alınamadı. Lütfen daha sonra tekrar deneyin.
                  </p>
                </div>
              ) : (
                rows.map(([sembol, item], rowIndex) => {
                  const displayName = item.adi || sembol;
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
                          background: isOpen ? "rgba(168,155,194,0.05)" : undefined,
                          borderRadius: isLast && !isOpen ? "0 0 1rem 1rem" : undefined,
                        }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "#FAEFE9" }}>{displayName}</p>
                          <p className="text-xs" style={{ color: "rgba(226,213,194,0.3)" }}>{sembol}</p>
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
                            <KriptoConverter
                              sembol={sembol}
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
        </motion.div>
      </div>
    </main>
  );
}