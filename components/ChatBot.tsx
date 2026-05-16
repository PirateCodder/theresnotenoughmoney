"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { useMarket } from "@/context/MarketContext";
import { ALTIN_ISIMLER, DOVIZ_ISIMLER, KRIPTO_ISIMLER, EMTIA_ISIMLER } from "@/types/market";
import type { PageFocus } from "@/components/FloatingChatButton";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import logoSrc from "@/app/logo.webp";

// ─── Pro modu açmak için bu sabiti true yap ───────────────────────────
const PRO_ENABLED = true;

// ─── Tipler ──────────────────────────────────────────────────────────
type AiTier = "basic" | "pro";

interface ChatBotProps {
  open: boolean;
  onClose: () => void;
  pageFocus?: PageFocus;
}

// Sayfa odağına göre hangi veri kategorileri gönderilecek
const PAGE_FOCUS_CATEGORIES: Record<PageFocus, ("altin" | "doviz" | "kripto" | "emtia")[]> = {
  altin:  ["altin", "doviz"],
  doviz:  ["doviz"],
  kripto: ["kripto", "doviz"],
  emtia:  ["emtia", "doviz"],
  kredi:  ["doviz", "altin"],
};

// Sayfa odağına göre sistem prompt eki
const PAGE_FOCUS_CONTEXT: Record<PageFocus, string> = {
  altin:  "Kullanıcı şu an ALTIN sayfasında. Sorular öncelikle altın ve değerli madenler ile ilgili olacak.",
  doviz:  "Kullanıcı şu an DÖVİZ sayfasında. Sorular öncelikle döviz kurları ile ilgili olacak.",
  kripto: "Kullanıcı şu an KRİPTO sayfasında. Sorular öncelikle kripto paralar ile ilgili olacak.",
  emtia:  "Kullanıcı şu an EMTİA sayfasında. Sorular öncelikle emtia fiyatları ile ilgili olacak.",
  kredi:  "Kullanıcı şu an KREDİ sayfasında. Sorular öncelikle kredi hesaplamaları ve faiz ile ilgili olacak.",
};

// ─── Yardımcı: piyasa verisini AI için okunabilir metin formatına çevir ──
function buildMarketContext(
  doviz: ReturnType<typeof useMarket>["doviz"],
  altin: ReturnType<typeof useMarket>["altin"],
  kripto: ReturnType<typeof useMarket>["kripto"],
  emtia: ReturnType<typeof useMarket>["emtia"],
  pageFocus?: PageFocus
): string {
  const lines: string[] = [];

  if (altin && Object.keys(altin).length > 0) {
    lines.push("=== ALTIN FİYATLARI (TL cinsinden, XAUUSD/XAUXAG hariç) ===");
    for (const [sembol, val] of Object.entries(altin)) {
      const ad = ALTIN_ISIMLER[sembol] ?? sembol;
      const birim = sembol === "XAUUSD" ? "USD" : sembol === "XAUXAG" ? "(rasyo)" : "TL";
      if (val.alis && val.alis !== "—" && val.satis && val.satis !== "—") {
        lines.push(`${sembol} (${ad}): alış=${val.alis} ${birim} | satış=${val.satis} ${birim}`);
      } else if (val.satis && val.satis !== "—") {
        lines.push(`${sembol} (${ad}): satış=${val.satis} ${birim}`);
      }
    }
    lines.push("");
  }

  if (doviz && Object.keys(doviz).length > 0) {
    lines.push("=== DÖVİZ KURLARI (TL cinsinden) ===");
    for (const [sembol, val] of Object.entries(doviz)) {
      const ad = DOVIZ_ISIMLER[sembol] ?? sembol;
      if (val.alis && val.alis !== "—" && val.satis && val.satis !== "—") {
        lines.push(`${sembol} (${ad}): alış=${val.alis} TL | satış=${val.satis} TL`);
      }
    }
    lines.push("");
  }

  if (kripto && Object.keys(kripto).length > 0) {
    lines.push("=== KRİPTO PARALAR (USD cinsinden) ===");
    for (const [sembol, val] of Object.entries(kripto)) {
      const ad = KRIPTO_ISIMLER[sembol] ?? val.adi ?? sembol;
      if (val.satis && val.satis !== "—") {
        lines.push(`${sembol} (${ad}): ${val.satis} USD`);
      }
    }
    lines.push("");
  }

  if (emtia && Object.keys(emtia).length > 0) {
    lines.push("=== EMTİA (USD cinsinden) ===");
    for (const [sembol, val] of Object.entries(emtia)) {
      const ad = EMTIA_ISIMLER[sembol] ?? val.adi ?? sembol;
      if (val.satis && val.satis !== "—") {
        lines.push(`${sembol} (${ad}): ${val.satis} USD`);
      }
    }
  }

  // Suppress unused variable warning
  void PAGE_FOCUS_CONTEXT;
  void pageFocus;

  return lines.join("\n");
}

// ─── Yazı efekti göstergesi ──────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: "#F4A384" }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// ─── Tek mesaj balonu ─────────────────────────────────────────────────
function MessageBubble({
  msgId,
  isUser,
  textContent,
  tierAccent,
  streaming,
}: {
  msgId: string;
  isUser: boolean;
  textContent: string;
  tierAccent: { color: string; bg: string; border: string };
  streaming?: boolean;
}) {
  return (
    <motion.div
      key={msgId}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5 mr-2">
          <Image
            src={logoSrc}
            alt="Finans Kedisi"
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
      )}
      <div
        className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed"
        style={
          isUser
            ? {
                background: `linear-gradient(135deg, ${tierAccent.color}22, ${tierAccent.color}15)`,
                border: `1px solid ${tierAccent.border}`,
                color: "#FAEFE9",
                borderBottomRightRadius: "6px",
              }
            : {
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(226,213,194,0.85)",
                borderBottomLeftRadius: "6px",
              }
        }
      >
        {isUser ? (
          <span style={{ whiteSpace: "pre-wrap" }}>{textContent}</span>
        ) : streaming ? (
          /* Streaming sırasında düz text — ReactMarkdown flicker etmez */
          <span style={{ whiteSpace: "pre-wrap" }}>{textContent}</span>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              strong: ({ children }) => <strong className="font-semibold" style={{ color: "#FAEFE9" }}>{children}</strong>,
              code: ({ children }) => <code className="px-1 py-0.5 rounded text-[12px]" style={{ background: "rgba(255,255,255,0.1)", color: "#F4A384" }}>{children}</code>,
            }}
          >
            {textContent}
          </ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
}

// ─── ChatBot Bileşeni ─────────────────────────────────────────────────
export default function ChatBot({ open, onClose, pageFocus }: ChatBotProps) {
  const { doviz, altin, kripto, emtia } = useMarket();
  const [tier, setTier] = useState<AiTier>("basic");
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sayfa odaklı filtrelenmiş veri
  const filteredDoviz = pageFocus
    ? (PAGE_FOCUS_CATEGORIES[pageFocus].includes("doviz") ? doviz : null)
    : doviz;
  const filteredAltin = pageFocus
    ? (PAGE_FOCUS_CATEGORIES[pageFocus].includes("altin") ? altin : null)
    : altin;
  const filteredKripto = pageFocus
    ? (PAGE_FOCUS_CATEGORIES[pageFocus].includes("kripto") ? kripto : null)
    : kripto;
  const filteredEmtia = pageFocus
    ? (PAGE_FOCUS_CATEGORIES[pageFocus].includes("emtia") ? emtia : null)
    : emtia;

  // Market verisini ref'te tut
  const marketRef = useRef<string>("");
  const tierRef = useRef<AiTier>("basic");
  const pageFocusRef = useRef<PageFocus | undefined>(pageFocus);

  useEffect(() => {
    pageFocusRef.current = pageFocus;
  }, [pageFocus]);

  useEffect(() => {
    marketRef.current = buildMarketContext(filteredDoviz, filteredAltin, filteredKripto, filteredEmtia, pageFocus);
  }, [filteredDoviz, filteredAltin, filteredKripto, filteredEmtia, pageFocus]);

  useEffect(() => {
    tierRef.current = tier;
  }, [tier]);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        marketData: marketRef.current,
        aiTier: tierRef.current,
        pageContext: pageFocusRef.current ?? "genel",
      }),
    }),
    onError(err: unknown) {
      console.error("[ChatBot] useChat error:", err);
    },
  });

  const isWaiting = status === "submitted";
  const isStreaming = status === "streaming";
  const isLoading = isWaiting || isStreaming;

  // Tier değişince konuşmayı sıfırla
  const handleTierChange = useCallback((newTier: AiTier) => {
    setTier(newTier);
    setMessages([]);
  }, [setMessages]);

  // Yeni mesajda aşağı kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Açılınca input'a odaklan
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    // Pro modu kapalıysa API'ye kesinlikle istek gönderme
    if (!text || isLoading || (tier === "pro" && !PRO_ENABLED)) return;
    setInputValue("");
    sendMessage({ text });
  }, [inputValue, isLoading, tier, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const tierAccent =
    tier === "pro"
      ? { color: "#A89BC2", bg: "rgba(168,155,194,0.15)", border: "rgba(168,155,194,0.35)" }
      : { color: "#F4A384", bg: "rgba(244,163,132,0.15)", border: "rgba(244,163,132,0.35)" };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Arka plan overlay (mobilde) ── */}
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* ── Chat Penceresi ── */}
          <motion.div
            className="fixed z-50 flex flex-col"
            style={{
              bottom: "16px",
              left: "16px",
              right: "16px",
              height: "min(720px, calc(100dvh - 72px))",
              background: "rgba(22,18,28,0.85)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              border: `1px solid ${tierAccent.border}`,
              borderRadius: "20px",
              boxShadow:
                "0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
          >
            {/* ── Header ── */}
            <div
              className="flex-shrink-0 px-4 pt-4 pb-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Başlık + Kapat */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <Image
                    src={logoSrc}
                    alt="Finans Kedisi"
                    width={32}
                    height={32}
                    className="rounded-xl"
                  />
                  <p className="font-semibold text-[13.5px]" style={{ color: "#FAEFE9" }}>
                    Finans Kedisi
                  </p>
                </div>

                {/* Kapat */}
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "rgba(226,213,194,0.4)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  aria-label="Kapat"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* ── Pill Toggle ── */}
              <div
                className="flex p-1 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {(["basic", "pro"] as AiTier[]).map((t) => {
                  const isActive = tier === t;
                  return (
                    <motion.button
                      key={t}
                      onClick={() => handleTierChange(t)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors relative"
                      style={{
                        color: isActive
                          ? t === "pro"
                            ? "#A89BC2"
                            : "#F4A384"
                          : "rgba(226,213,194,0.35)",
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="tier-pill"
                          className="absolute inset-0 rounded-lg"
                          style={{
                            background:
                              t === "pro"
                                ? "rgba(168,155,194,0.18)"
                                : "rgba(244,163,132,0.18)",
                            border: `1px solid ${
                              t === "pro"
                                ? "rgba(168,155,194,0.3)"
                                : "rgba(244,163,132,0.3)"
                            }`,
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{t === "basic" ? "✨" : "🔬"}</span>
                      <span className="relative z-10">
                        {t === "basic" ? "Basic (Ücretsiz)" : "Pro (Analist)"}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* ── Pro Kapalı Ekranı ── */}
            {tier === "pro" && !PRO_ENABLED && (
              <motion.div
                className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: "rgba(168,155,194,0.15)", border: "1px solid rgba(168,155,194,0.25)" }}
                >
                  🔬
                </div>
                <div>
                  <p className="font-semibold text-[15px] mb-1.5" style={{ color: "#A89BC2" }}>
                    Pro Modu Yakında
                  </p>
                  <p className="text-[12.5px] leading-relaxed max-w-[260px]" style={{ color: "rgba(226,213,194,0.45)" }}>
                    Sizin için geliştirmelere devam ediyoruz. Pro özellikleri hazır olduğunda burada olacak! 🚀
                  </p>
                </div>
                <div
                  className="px-4 py-2 rounded-xl text-[11.5px] font-medium"
                  style={{
                    background: "rgba(168,155,194,0.1)",
                    border: "1px solid rgba(168,155,194,0.2)",
                    color: "rgba(168,155,194,0.6)",
                  }}
                >
                  Basic modunu kullanmaya devam edebilirsin ✨
                </div>
              </motion.div>
            )}

            {/* ── Mesajlar ── */}
            {!(tier === "pro" && !PRO_ENABLED) && (
            <div
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.1) transparent",
              }}
            >
              {/* Boş durum */}
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <Image
                    src={logoSrc}
                    alt="Finans Kedisi"
                    width={56}
                    height={56}
                    className="rounded-2xl"
                  />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#FAEFE9" }}>
                      Finans Kedisi Hazır
                    </p>
                    <p
                      className="text-[12px] mt-1 max-w-[240px]"
                      style={{ color: "rgba(226,213,194,0.4)" }}
                    >
                      Altın, döviz veya piyasa hakkında soru sorabilirsin. Güncel veriler hazır!
                    </p>
                  </div>
                </div>
              )}

              {/* Mesajlar */}
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const textContent = (msg.parts ?? [])
                  .filter(
                    (p): p is { type: "text"; text: string } =>
                      typeof p === "object" && p !== null && (p as { type: string }).type === "text"
                  )
                  .map((p) => p.text)
                  .join("");

                if (!textContent) return null;

                const isLastAssistant = !isUser && isStreaming && idx === messages.length - 1;

                return (
                  <MessageBubble
                    key={msg.id}
                    msgId={msg.id}
                    isUser={isUser}
                    textContent={textContent}
                    tierAccent={tierAccent}
                    streaming={isLastAssistant}
                  />
                );
              })}

              {/* Yükleniyor — sadece API cevap beklenirken */}
              {isWaiting && (
                <div className="flex justify-start">
                  <div className="flex-shrink-0 mt-0.5 mr-2">
                    <Image
                      src={logoSrc}
                      alt="Finans Kedisi"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </div>
                  <div
                    className="rounded-2xl"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderBottomLeftRadius: "6px",
                    }}
                  >
                    <TypingDots />
                  </div>
                </div>
              )}

              {/* Hata */}
              {error && (
                <div
                  className="px-3.5 py-2.5 rounded-2xl text-[12.5px]"
                  style={{
                    background: "rgba(194,96,106,0.12)",
                    border: "1px solid rgba(194,96,106,0.25)",
                    color: "#C2606A",
                  }}
                >
                  ⚠️ Bir hata oluştu. Lütfen tekrar deneyin.
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
            )}

            {/* ── Input Alanı ── */}
            <div
              className="flex-shrink-0 px-3 py-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    tier === "pro" && !PRO_ENABLED
                      ? "Pro modu yakında geliyor..."
                      : "Piyasa hakkında soru sor..."
                  }
                  disabled={isLoading || (tier === "pro" && !PRO_ENABLED)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${
                      inputValue && !(tier === "pro" && !PRO_ENABLED)
                        ? tierAccent.border
                        : "rgba(255,255,255,0.08)"
                    }`,
                    color: tier === "pro" && !PRO_ENABLED ? "rgba(226,213,194,0.25)" : "#FAEFE9",
                    caretColor: tierAccent.color,
                    cursor: tier === "pro" && !PRO_ENABLED ? "not-allowed" : "text",
                  }}
                />
                <motion.button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading || (tier === "pro" && !PRO_ENABLED)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      inputValue.trim() && !isLoading && !(tier === "pro" && !PRO_ENABLED)
                        ? `linear-gradient(135deg, ${tierAccent.color}, ${
                            tier === "pro" ? "#8B7BAA" : "#C2606A"
                          })`
                        : "rgba(255,255,255,0.07)",
                    opacity:
                      !inputValue.trim() || isLoading || (tier === "pro" && !PRO_ENABLED)
                        ? 0.4
                        : 1,
                    border: "none",
                    cursor: tier === "pro" && !PRO_ENABLED ? "not-allowed" : "pointer",
                  }}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <svg
                    className="w-4 h-4"
                    style={{ color: "#fff" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                </motion.button>
              </div>

              <p
                className="text-center mt-2 text-[10.5px]"
                style={{ color: "rgba(226,213,194,0.2)" }}
              >
                Bilgi amaçlıdır, yatırım tavsiyesi değildir.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}