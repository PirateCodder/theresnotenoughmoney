"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CurrencyDollarIcon, ArrowsRightLeftIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useMarket } from "@/context/MarketContext";
import PageHeader from "@/components/PageHeader";
import FloatingChatButton from "@/components/FloatingChatButton";

// ─── Skeleton ────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
      <div className="w-9 h-9 rounded-lg bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="w-32 h-3.5 rounded bg-white/10" />
        <div className="w-10 h-2.5 rounded bg-white/8" />
      </div>
      <div className="w-24 h-4 rounded bg-white/10" />
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
const ALL_CODES = ["TRY", "USD", "EUR", "GBP", "CHF", "CAD", "AUD", "JPY", "CNY", "RUB", "SAR", "AED", "KWD", "DKK", "SEK", "NOK"];

const CODE_LABELS: Record<string, string> = {
  TRY: "Türk Lirası", USD: "Amerikan Doları", EUR: "Euro", GBP: "İngiliz Sterlini",
  CHF: "İsviçre Frangı", CAD: "Kanada Doları", AUD: "Avustralya Doları", JPY: "Japon Yeni",
  CNY: "Çin Yuanı", RUB: "Rus Rublesi", SAR: "Suudi Riyali", AED: "BAE Dirhemi",
  KWD: "Kuveyt Dinarı", DKK: "Danimarka Kronu", SEK: "İsveç Kronu", NOK: "Norveç Kronu",
};

function CurrencyDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updateRect = useCallback(() => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
  }, []);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Scroll/resize ile pozisyon güncelle
  useEffect(() => {
    if (!open) return;
    const update = () => updateRect();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, updateRect]);

  const handleOpen = () => {
    updateRect();
    setOpen((o) => !o);
  };

  const panelStyle: React.CSSProperties = rect ? {
    position: "fixed",
    top: rect.bottom + 6,
    left: rect.left,
    zIndex: 9999,
    minWidth: Math.max(rect.width, 200),
    maxHeight: 280,
    overflowY: "auto",
    background: "rgba(15,30,37,0.97)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "14px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
  } : { display: "none" };

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: open ? "rgba(139,175,196,0.18)" : "rgba(255,255,255,0.08)",
          border: `1px solid ${open ? "rgba(139,175,196,0.4)" : "rgba(255,255,255,0.15)"}`,
          color: "#FAEFE9",
          minWidth: "72px",
        }}
      >
        <span className="flex-1 text-left">{value}</span>
        <ChevronDownIcon
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{
            color: "rgba(226,213,194,0.5)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {/* Portal panel — DOM'dan tamamen bağımsız, overflow sorununu çözer */}
      {open && typeof document !== "undefined" && createPortal(
        <div ref={panelRef} style={panelStyle}>
          {options.map((code, i) => (
            <button
              key={code}
              type="button"
              onClick={() => { onChange(code); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
              style={{
                background: value === code ? "rgba(139,175,196,0.15)" : "transparent",
                borderBottom: i < options.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}
              onMouseEnter={(e) => { if (value !== code) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { if (value !== code) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span
                className="text-xs font-bold flex-shrink-0 rounded-md px-1.5 py-0.5"
                style={{
                  background: value === code ? "rgba(139,175,196,0.25)" : "rgba(255,255,255,0.08)",
                  color: value === code ? "#8BAFC4" : "rgba(226,213,194,0.55)",
                  minWidth: "38px",
                  textAlign: "center",
                }}
              >
                {code}
              </span>
              <span className="text-xs truncate" style={{ color: value === code ? "#FAEFE9" : "rgba(226,213,194,0.45)" }}>
                {CODE_LABELS[code] ?? code}
              </span>
              {value === code && (
                <svg className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: "#8BAFC4" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Inline Dönüştürücü ───────────────────────────────────────────────
function InlineConverter({
  kod,
  alis,
  satis,
  doviz,
}: {
  kod: string;
  alis: string;
  satis: string;
  doviz: Record<string, { alis: string; satis: string }>;
}) {
  const [amount, setAmount] = useState("100");
  const [toCode, setToCode] = useState("TRY");
  // "KOD_TO" = döviz bozdurmak (default: ALIS) | "TO_KOD" = döviz satın almak (default: SATIS)
  const [dir, setDir] = useState<"KOD_TO" | "TO_KOD">("KOD_TO");
  // Manuel alış/satış override — yön değişince otomatik default'a döner
  const [useAlis, setUseAlis] = useState<boolean>(true); // KOD_TO başlangıcı → alış
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  // Yön değişince doğru kuru otomatik seç
  const handleDirChange = () => {
    const newDir = dir === "KOD_TO" ? "TO_KOD" : "KOD_TO";
    setDir(newDir);
    setUseAlis(newDir === "KOD_TO"); // bozdurmak→alış, almak→satış
  };

  /*
   * Döviz bürosu mantığı:
   *   KOD_TO  (elinde döviz var, TL'ye çevireceksin / bozduracaksın)
   *     → Banka senden ALIS kuruyla alır (düşük kur) → sen daha az TL alırsın
   *   TO_KOD  (TL verip döviz satın alacaksın)
   *     → Banka sana SATIS kuruyla satar (yüksek kur) → sen daha fazla TL ödersin
   *   Manuel toggle ile kullanıcı her zaman override edebilir.
   */
  /*
   * KOD_TO (döviz bozdurmak): kullanıcının dövizini bankaya veriyoruz → ALIŞI kullan
   * TO_KOD (döviz satın almak): bankadan döviz alıyoruz → SATIŞI kullan
   * Toggle ile kullanıcı her zaman override edebilir.
   *
   * Kur seçimi:
   *   - "kod" dövizinin kuru → useAlis'e göre seçilir
   *   - "toCode" dövizinin kuru:
   *       KOD_TO modunda → satış (bankanın bize ödeyeceği miktar, çapraz kur)
   *       TO_KOD modunda → alış  (bankaya verdiğimiz dövizin değeri, çapraz kur)
   */
  const getRate = (c: string, useAlisForC: boolean): number => {
    if (c === "TRY") return 1;
    if (c === kod) return parseFloat((useAlisForC ? alis : satis).replace(",", "."));
    const entry = doviz[c];
    if (!entry) return 0;
    return parseFloat((useAlisForC ? entry.alis : entry.satis).replace(",", "."));
  };

  const hesapla = (): string => {
    const val = parseFloat(amount.replace(",", "."));
    if (isNaN(val)) return "—";

    if (dir === "KOD_TO") {
      // val adet KOD bozdurmak → TRY veya toCode
      // KOD'u bankaya veriyoruz → ALIS kuru (useAlis=true default)
      const kr = getRate(kod, useAlis);
      if (isNaN(kr) || kr === 0) return "—";
      const tryAmt = val * kr;
      if (toCode === "TRY") return tryAmt.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
      // Çıkan TRY ile toCode satın alıyoruz → toCode'un SATIŞ kuru
      const tr = getRate(toCode, false);
      if (isNaN(tr) || tr === 0) return "—";
      return (tryAmt / tr).toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    } else {
      // val adet toCode vererek KOD satın almak
      // toCode'u bankaya veriyoruz → toCode'un ALIS kuru
      const tr = getRate(toCode, true);
      if (isNaN(tr)) return "—";
      const tryAmt = val * tr;
      // KOD'u bankadan alıyoruz → SATIŞ kuru (useAlis=false default)
      const kr = getRate(kod, useAlis);
      if (isNaN(kr) || kr === 0) return "—";
      return (tryAmt / kr).toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    }
  };

  const inputUnit = dir === "KOD_TO" ? kod : toCode;
  const resultUnit = dir === "KOD_TO" ? toCode : kod;
  const activeRate = useAlis ? alis : satis;
  const rateLabel = useAlis ? "alış" : "satış";

  const availableTo = ALL_CODES.filter((c) => c !== kod && (c === "TRY" || doviz[c]));

  return (
    <div
      className="px-4 py-3 space-y-3"
      style={{
        background: "rgba(139,175,196,0.05)",
        borderTop: "1px solid rgba(139,175,196,0.12)",
      }}
    >
      {/* Kontroller */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Miktar */}
        <input
          ref={inputRef}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="glass-input w-24 px-3 py-1.5 text-sm font-semibold"
          placeholder="Miktar"
        />

        {/* Sol taraf — yöne göre yer değiştirir */}
        {dir === "KOD_TO" ? (
          /* KOD_TO: sabit badge solda */
          <span
            className="px-3 py-1.5 rounded-xl text-sm font-semibold flex-shrink-0"
            style={{ background: "rgba(139,175,196,0.15)", color: "#8BAFC4", border: "1px solid rgba(139,175,196,0.25)" }}
          >
            {kod}
          </span>
        ) : (
          /* TO_KOD: dropdown solda */
          <CurrencyDropdown value={toCode} options={availableTo} onChange={setToCode} />
        )}

        {/* Swap butonu */}
        <button
          type="button"
          onClick={handleDirChange}
          title="Hesap yönünü değiştir"
          className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-white/10 flex-shrink-0"
          style={{ border: "1px solid rgba(255,255,255,0.15)" }}
        >
          <ArrowsRightLeftIcon className="w-4 h-4" style={{ color: "rgba(226,213,194,0.5)" }} />
        </button>

        {/* Sağ taraf — yöne göre yer değiştirir */}
        {dir === "KOD_TO" ? (
          /* KOD_TO: dropdown sağda */
          <CurrencyDropdown value={toCode} options={availableTo} onChange={setToCode} />
        ) : (
          /* TO_KOD: sabit badge sağda */
          <span
            className="px-3 py-1.5 rounded-xl text-sm font-semibold flex-shrink-0"
            style={{ background: "rgba(139,175,196,0.15)", color: "#8BAFC4", border: "1px solid rgba(139,175,196,0.25)" }}
          >
            {kod}
          </span>
        )}

        {/* Alış / Satış toggle */}
        <div className="flex gap-1 ml-auto">
          {([{ v: false, label: "Satış" }, { v: true, label: "Alış" }]).map(({ v, label }) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => setUseAlis(v)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={useAlis === v
                ? { background: "rgba(139,175,196,0.2)", color: "#8BAFC4", border: "1px solid rgba(139,175,196,0.3)" }
                : { background: "rgba(255,255,255,0.05)", color: "rgba(226,213,194,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
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
          Kur ({rateLabel}): {activeRate} ₺
        </span>
      </div>
    </div>
  );
}

// ─── Sabit metadata ───────────────────────────────────────────────────
const DOVIZ_META: Record<string, { label: string; icon: string; accent: string }> = {
  USD: { label: "Amerikan Doları",    icon: "$",   accent: "#F4A384" },
  EUR: { label: "Euro",               icon: "€",   accent: "#8BAFC4" },
  GBP: { label: "İngiliz Sterlini",   icon: "£",   accent: "#A89BC2" },
  CHF: { label: "İsviçre Frangı",     icon: "Fr",  accent: "#7FBFA8" },
  CAD: { label: "Kanada Doları",      icon: "C$",  accent: "#D4AA60" },
  AUD: { label: "Avustralya Doları",  icon: "A$",  accent: "#C2956E" },
  JPY: { label: "Japon Yeni",         icon: "¥",   accent: "#E5A0A0" },
  CNY: { label: "Çin Yuanı",          icon: "¥",   accent: "#C28B7A" },
  RUB: { label: "Rus Rublesi",        icon: "₽",   accent: "#C28B7A" },
  SAR: { label: "Suudi Riyali",       icon: "﷼",   accent: "#D4AA60" },
  AED: { label: "BAE Dirhemi",        icon: "د.إ", accent: "#8BAFC4" },
  KWD: { label: "Kuveyt Dinarı",      icon: "د.ك", accent: "#7FBFA8" },
  DKK: { label: "Danimarka Kronu",    icon: "kr",  accent: "#A89BC2" },
  SEK: { label: "İsveç Kronu",        icon: "kr",  accent: "#8BAFC4" },
  NOK: { label: "Norveç Kronu",       icon: "kr",  accent: "#7FBFA8" },
};

// ─── Sayfa ────────────────────────────────────────────────────────────
export default function DovizPage() {
  const { doviz, loading, error } = useMarket();
  const [selectedKod, setSelectedKod] = useState<string | null>(null);

  const rows = doviz ? Object.entries(doviz) : [];

  return (
    <main className="min-h-screen px-4 py-8 md:px-6 md:py-12">
      <div className="max-w-4xl mx-auto">

        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <PageHeader
            title="Döviz Kurları"
            description="Tüm kurlar TL karşılığı — 5 dakikada bir güncellenir"
            Icon={CurrencyDollarIcon}
            iconAccent="#8BAFC4"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <div
            className="rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              overflow: "visible", /* portal sayesinde overflow:hidden gereksiz */
            }}
          >
            {/* Başlık */}
            <div
              className="grid px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-t-2xl"
              style={{
                gridTemplateColumns: "1fr 90px 90px 72px",
                color: "rgba(226,213,194,0.35)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span>Döviz</span>
              <span className="text-center">Alış</span>
              <span className="text-center">Satış</span>
              <span className="text-center">Değişim</span>
            </div>

            {/* Satırlar */}
            <div className="divide-y divide-white/[0.05]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm" style={{ color: "rgba(226,213,194,0.4)" }}>Veri alınamadı. Lütfen daha sonra tekrar deneyin.</p>
                </div>
              ) : (
                rows.map(([kod, item], rowIndex) => {
                  const meta = DOVIZ_META[kod];
                  const accent = meta?.accent ?? "#8BAFC4";
                  const label = meta?.label ?? kod;
                  const icon = meta?.icon ?? kod.slice(0, 2);
                  const isOpen = selectedKod === kod;
                  const isLast = rowIndex === rows.length - 1;

                  return (
                    <React.Fragment key={kod}>
                      <button
                        onClick={() => setSelectedKod(isOpen ? null : kod)}
                        className="w-full grid px-4 py-3 items-center text-left transition-colors hover:bg-white/[0.03]"
                        style={{
                          gridTemplateColumns: "1fr 90px 90px 72px",
                          background: isOpen ? "rgba(139,175,196,0.05)" : undefined,
                          borderRadius: isLast && !isOpen ? "0 0 1rem 1rem" : undefined,
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                            style={{ background: `${accent}18`, color: accent }}>
                            {icon}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium" style={{ color: "#FAEFE9" }}>{label}</p>
                            <p className="text-xs" style={{ color: "rgba(226,213,194,0.3)" }}>{kod}</p>
                          </div>
                        </div>
                        <p className="text-sm text-center" style={{ color: "rgba(226,213,194,0.6)" }}>{item.alis}</p>
                        <p className="text-sm font-semibold text-center" style={{ color: "#FAEFE9" }}>{item.satis}</p>
                        <div className="flex justify-center">
                          <DegisimBadge degisim={item.degisim} yon={item.yon} />
                        </div>
                      </button>

                      <AnimatePresence>
                        {isOpen && doviz && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            style={{ overflow: "visible" }}
                          >
                            <InlineConverter
                              kod={kod}
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

          {!loading && !error && rows.length > 0 && (
            <p className="text-center mt-3 text-xs" style={{ color: "rgba(226,213,194,0.2)" }}>
              Dönüştürmek için bir satıra tıklayın
            </p>
          )}
        </motion.div>
      </div>

      <FloatingChatButton pageFocus="doviz" />
    </main>
  );
}
