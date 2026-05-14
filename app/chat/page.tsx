"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { useMarket } from "@/context/MarketContext";
import { ALTIN_ISIMLER, DOVIZ_ISIMLER, KRIPTO_ISIMLER, EMTIA_ISIMLER } from "@/types/market";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import logoSrc from "@/app/logo.webp";
import {
  StarIcon,
  CurrencyDollarIcon,
  BoltIcon,
  GlobeAltIcon,
  ChartBarIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";

// ─── Tipler ──────────────────────────────────────────────────────────
type AiTier = "basic" | "pro";

// ─── Konu Kartları ────────────────────────────────────────────────────
const TOPIC_CARDS = [
  {
    id: "altin",
    label: "Altın & Madenler",
    Icon: StarIcon,
    accent: "#D4AA60",
    accentBg: "rgba(212,170,96,0.12)",
    accentBorder: "rgba(212,170,96,0.3)",
    prompt: "Güncel altın fiyatlarını analiz eder misin? Gram altın ne kadar, yatırım için nasıl değerlendirirsin?",
  },
  {
    id: "doviz",
    label: "Döviz & Kur",
    Icon: CurrencyDollarIcon,
    accent: "#8BAFC4",
    accentBg: "rgba(139,175,196,0.12)",
    accentBorder: "rgba(139,175,196,0.3)",
    prompt: "Dolar ve Euro kurlarını analiz eder misin? TL karşısındaki durumlarını değerlendir.",
  },
  {
    id: "kripto",
    label: "Kripto Para",
    Icon: BoltIcon,
    accent: "#A89BC2",
    accentBg: "rgba(168,155,194,0.12)",
    accentBorder: "rgba(168,155,194,0.3)",
    prompt: "Bitcoin ve Ethereum'un güncel fiyatlarını ve piyasa durumunu analiz eder misin?",
  },
  {
    id: "emtia",
    label: "Emtia & Hammadde",
    Icon: GlobeAltIcon,
    accent: "#7FBFA8",
    accentBg: "rgba(127,191,168,0.12)",
    accentBorder: "rgba(127,191,168,0.3)",
    prompt: "Ham petrol ve diğer emtia fiyatlarını analiz eder misin? Küresel piyasalarda nasıl bir tablo var?",
  },
  {
    id: "genel",
    label: "Genel Piyasa",
    Icon: ChartBarIcon,
    accent: "#F4A384",
    accentBg: "rgba(244,163,132,0.12)",
    accentBorder: "rgba(244,163,132,0.3)",
    prompt: "Bugün piyasalarda öne çıkan gelişmeler neler? Genel bir değerlendirme yapar mısın?",
  },
  {
    id: "karsilastir",
    label: "Karşılaştır",
    Icon: ScaleIcon,
    accent: "#C2606A",
    accentBg: "rgba(194,96,106,0.12)",
    accentBorder: "rgba(194,96,106,0.3)",
    prompt: "Altın, dolar, euro ve kripto para arasında güncel verilere göre bir karşılaştırma yapar mısın?",
  },
];

// ─── Konu → hangi veriler iletilsin ──────────────────────────────────
const TOPIC_DATA_FILTER: Record<string, ("altin" | "doviz" | "kripto" | "emtia")[]> = {
  altin:       ["altin", "doviz"],
  doviz:       ["doviz"],
  kripto:      ["kripto", "doviz"],
  emtia:       ["emtia", "doviz"],
  genel:       ["altin", "doviz", "kripto", "emtia"],
  karsilastir: ["altin", "doviz", "kripto", "emtia"],
};

// ─── Piyasa verisi → okunabilir metin ────────────────────────────────
function buildMarketContext(
  doviz: ReturnType<typeof useMarket>["doviz"],
  altin: ReturnType<typeof useMarket>["altin"],
  kripto: ReturnType<typeof useMarket>["kripto"],
  emtia: ReturnType<typeof useMarket>["emtia"],
  topicFilter?: string | null
): string {
  const include = TOPIC_DATA_FILTER[topicFilter ?? "genel"] ?? ["altin", "doviz", "kripto", "emtia"];
  const lines: string[] = [];

  if (include.includes("altin") && altin && Object.keys(altin).length > 0) {
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

  if (include.includes("doviz") && doviz && Object.keys(doviz).length > 0) {
    lines.push("=== DÖVİZ KURLARI (TL cinsinden) ===");
    for (const [sembol, val] of Object.entries(doviz)) {
      const ad = DOVIZ_ISIMLER[sembol] ?? sembol;
      if (val.alis && val.alis !== "—" && val.satis && val.satis !== "—") {
        lines.push(`${sembol} (${ad}): alış=${val.alis} TL | satış=${val.satis} TL`);
      }
    }
    lines.push("");
  }

  if (include.includes("kripto") && kripto && Object.keys(kripto).length > 0) {
    lines.push("=== KRİPTO PARALAR (USD cinsinden) ===");
    for (const [sembol, val] of Object.entries(kripto)) {
      const ad = KRIPTO_ISIMLER[sembol] ?? val.adi ?? sembol;
      if (val.satis && val.satis !== "—") {
        lines.push(`${sembol} (${ad}): ${val.satis} USD`);
      }
    }
    lines.push("");
  }

  if (include.includes("emtia") && emtia && Object.keys(emtia).length > 0) {
    lines.push("=== EMTİA (USD cinsinden) ===");
    for (const [sembol, val] of Object.entries(emtia)) {
      const ad = EMTIA_ISIMLER[sembol] ?? val.adi ?? sembol;
      if (val.satis && val.satis !== "—") {
        lines.push(`${sembol} (${ad}): ${val.satis} USD`);
      }
    }
  }

  return lines.join("\n");
}

// ─── Yazı efekti göstergesi ──────────────────────────────────────────
function TypingDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: color }}
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
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <Image
            src={logoSrc}
            alt="Finans Kedisi"
            width={28}
            height={28}
            className="rounded-full"
          />
        </div>
      )}
      <div
        className={`max-w-[85%] sm:max-w-[78%] px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed ${
          isUser ? "rounded-br-md" : "rounded-bl-md"
        }`}
        style={
          isUser
            ? {
                background: `linear-gradient(135deg, ${tierAccent.color}22, ${tierAccent.color}15)`,
                border: `1px solid ${tierAccent.border}`,
                color: "#FAEFE9",
              }
            : {
                background: "rgba(255,255,255,0.055)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "rgba(226,213,194,0.88)",
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
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              strong: ({ children }) => (
                <strong className="font-semibold" style={{ color: "#FAEFE9" }}>
                  {children}
                </strong>
              ),
              h3: ({ children }) => (
                <h3
                  className="font-bold text-[14px] mt-3 mb-1.5 first:mt-0"
                  style={{ color: "#FAEFE9" }}
                >
                  {children}
                </h3>
              ),
              code: ({ children }) => (
                <code
                  className="px-1.5 py-0.5 rounded text-[12px]"
                  style={{ background: "rgba(255,255,255,0.1)", color: "#F4A384" }}
                >
                  {children}
                </code>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-2">
                  <table className="text-[12px] border-collapse w-full">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th
                  className="px-2 py-1 text-left font-semibold border-b"
                  style={{
                    color: "#FAEFE9",
                    borderColor: "rgba(255,255,255,0.15)",
                  }}
                >
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td
                  className="px-2 py-1 border-b"
                  style={{
                    color: "rgba(226,213,194,0.8)",
                    borderColor: "rgba(255,255,255,0.07)",
                  }}
                >
                  {children}
                </td>
              ),
            }}
          >
            {textContent}
          </ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────
export default function ChatPage() {
  const { doviz, altin, kripto, emtia } = useMarket();
  const [tier, setTier] = useState<AiTier>("basic");
  const [inputValue, setInputValue] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const marketRef = useRef<string>("");
  const tierRef = useRef<AiTier>("basic");
  const selectedTopicRef = useRef<string | null>(null);

  useEffect(() => {
    marketRef.current = buildMarketContext(doviz, altin, kripto, emtia, selectedTopic);
  }, [doviz, altin, kripto, emtia, selectedTopic]);

  useEffect(() => {
    tierRef.current = tier;
  }, [tier]);

  useEffect(() => {
    selectedTopicRef.current = selectedTopic;
  }, [selectedTopic]);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        marketData: marketRef.current,
        aiTier: tierRef.current,
        pageContext: selectedTopicRef.current ?? "genel",
      }),
    }),
    onError(err: unknown) {
      console.error("[ChatPage] useChat error:", err);
    },
  });

  const isWaiting = status === "submitted";          // API cevap bekliyor → dots
  const isStreaming = status === "streaming";         // cevap geliyor → dots gizle
  const isLoading = isWaiting || isStreaming;         // input disable için
  const hasMessages = messages.length > 0;

  const handleTierChange = useCallback(
    (newTier: AiTier) => {
      setTier(newTier);
      setMessages([]);
      setSelectedTopic(null);
    },
    [setMessages]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = useCallback(() => {
    const msg = inputValue.trim();
    if (!msg || isLoading) return;
    setInputValue("");
    // Textarea yüksekliğini hemen sıfırla
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    sendMessage({ text: msg });
  }, [inputValue, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Textarea auto-resize
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  // Konu kartı seçimi — sadece pageContext'i değiştirir, input'a dokunmaz
  const handleTopicCard = useCallback((topicId: string) => {
    setSelectedTopic((prev) => (prev === topicId ? null : topicId));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const tierAccent =
    tier === "pro"
      ? { color: "#A89BC2", bg: "rgba(168,155,194,0.15)", border: "rgba(168,155,194,0.35)" }
      : { color: "#F4A384", bg: "rgba(244,163,132,0.15)", border: "rgba(244,163,132,0.35)" };

  return (
    <div
      className="flex flex-col h-[100dvh] max-w-2xl mx-auto"
      style={{ background: "transparent" }}
    >
      {/* ── Header ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Geri + Logo + İsim */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
          >
            <svg className="w-4 h-4" style={{ color: "rgba(226,213,194,0.6)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <Image src={logoSrc} alt="Finans Kedisi" width={30} height={30} className="rounded-lg" />
            <p className="font-semibold text-[13.5px] leading-none" style={{ color: "#FAEFE9" }}>
              Finans Kedisi
            </p>
          </div>
        </div>

        {/* Tier Toggle */}
        <div
          className="flex p-0.5 rounded-xl"
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
                className="relative px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors"
                style={{
                  color: isActive
                    ? t === "pro"
                      ? "#A89BC2"
                      : "#F4A384"
                    : "rgba(226,213,194,0.3)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="chat-page-tier-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background:
                        t === "pro" ? "rgba(168,155,194,0.18)" : "rgba(244,163,132,0.18)",
                      border: `1px solid ${t === "pro" ? "rgba(168,155,194,0.3)" : "rgba(244,163,132,0.3)"}`,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  {t === "basic" ? "✨ Basic" : "🔬 Pro"}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Mesaj Alanı ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.08) transparent",
        }}
      >
        {/* ── Başlangıç Ekranı: Konu Seçim Kartları ── */}
        <AnimatePresence>
          {!hasMessages && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-6 pt-4 pb-6"
            >
              {/* Karşılama */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Image
                    src={logoSrc}
                    alt="Finans Kedisi"
                    width={64}
                    height={64}
                    className="rounded-2xl"
                    style={{ boxShadow: `0 0 32px ${tierAccent.bg}` }}
                  />
                </div>
                <h2 className="font-bold text-xl mb-1" style={{ color: "#FAEFE9" }}>
                  Finans Kedisi
                </h2>
                <p className="text-sm" style={{ color: "rgba(226,213,194,0.4)" }}>
                  Bir konu seç ya da istediğini yaz
                </p>
              </div>

              {/* Konu Kartları */}
              <div className="grid grid-cols-2 gap-2.5 w-full max-w-lg">
                {TOPIC_CARDS.map((card, i) => {
                  const isSelected = selectedTopic === card.id;
                  return (
                    <motion.button
                      key={card.id}
                      onClick={() => handleTopicCard(card.id)}
                      className="text-left p-3.5 rounded-2xl transition-all relative"
                      style={{
                        background: isSelected
                          ? card.accentBg.replace("0.12", "0.25")
                          : card.accentBg,
                        border: `1px solid ${isSelected ? card.accent : card.accentBorder}`,
                        boxShadow: isSelected ? `0 0 12px ${card.accentBg.replace("0.12", "0.4")}` : undefined,
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.07, duration: 0.35 }}
                      whileHover={{
                        scale: 1.02,
                        background: card.accentBg.replace("0.12", "0.2"),
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {isSelected && (
                        <motion.div
                          className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: card.accent }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                          <svg className="w-2.5 h-2.5" style={{ color: "#fff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: card.accentBg, border: `1px solid ${card.accentBorder}` }}
                        >
                          <card.Icon className="w-4 h-4" style={{ color: card.accent }} />
                        </div>
                        <p
                          className="text-[12.5px] font-semibold leading-snug"
                          style={{ color: card.accent }}
                        >
                          {card.label}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mesajlar ── */}
        <div className="space-y-4">
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

            // Streaming sırasında son asistan mesajı düz text olarak gösterilir
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

          {/* Yükleniyor — sadece submitted (API cevap vermedi) durumunda */}
          {isWaiting && (
            <motion.div
              className="flex gap-3 justify-start"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex-shrink-0 mt-1">
                <Image src={logoSrc} alt="Finans Kedisi" width={28} height={28} className="rounded-full" />
              </div>
              <div
                className="px-4 py-3 rounded-2xl rounded-bl-md"
                style={{
                  background: "rgba(255,255,255,0.055)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <TypingDots color={tierAccent.color} />
              </div>
            </motion.div>
          )}

          {/* Hata */}
          {error && (
            <div
              className="mx-auto max-w-sm px-4 py-3 rounded-2xl text-[12.5px] text-center"
              style={{
                background: "rgba(194,96,106,0.12)",
                border: "1px solid rgba(194,96,106,0.25)",
                color: "#C2606A",
              }}
            >
              ⚠️ Bir hata oluştu. Lütfen tekrar deneyin.
            </div>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Alanı ── */}
      <div
        className="flex-shrink-0 px-4 pb-4 pt-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex items-end gap-2 p-2 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${inputValue ? tierAccent.border : "rgba(255,255,255,0.09)"}`,
            transition: "border-color 0.2s",
          }}
        >
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Piyasa hakkında soru sor..."
            disabled={isLoading}
            rows={1}
            className="flex-1 px-2 py-1.5 text-[13.5px] outline-none resize-none bg-transparent leading-relaxed"
            style={{
              color: "#FAEFE9",
              caretColor: tierAccent.color,
              minHeight: "36px",
              maxHeight: "120px",
            }}
          />
          <motion.button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5"
            style={{
              background:
                inputValue.trim() && !isLoading
                  ? `linear-gradient(135deg, ${tierAccent.color}, ${tier === "pro" ? "#8B7BAA" : "#C2606A"})`
                  : "rgba(255,255,255,0.07)",
              opacity: !inputValue.trim() || isLoading ? 0.4 : 1,
              border: "none",
            }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
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
          style={{ color: "rgba(226,213,194,0.18)" }}
        >
          Bilgi amaçlıdır, yatırım tavsiyesi değildir.
        </p>
      </div>
    </div>
  );
}