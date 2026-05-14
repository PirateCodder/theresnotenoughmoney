"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import logoSrc from "@/app/logo.webp";
import ChatBot from "@/components/ChatBot";

// ─── Sayfa odağı tanımları ────────────────────────────────────────────
export type PageFocus =
  | "altin"
  | "doviz"
  | "kripto"
  | "emtia"
  | "kredi";

interface PageFocusConfig {
  label: string;
  icon: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
}

const PAGE_CONFIG: Record<PageFocus, PageFocusConfig> = {
  altin: {
    label: "Altın Asistanı",
    icon: "🪙",
    accent: "#D4AA60",
    accentBg: "rgba(212,170,96,0.18)",
    accentBorder: "rgba(212,170,96,0.45)",
  },
  doviz: {
    label: "Döviz Asistanı",
    icon: "💱",
    accent: "#8BAFC4",
    accentBg: "rgba(139,175,196,0.18)",
    accentBorder: "rgba(139,175,196,0.45)",
  },
  kripto: {
    label: "Kripto Asistanı",
    icon: "₿",
    accent: "#A89BC2",
    accentBg: "rgba(168,155,194,0.18)",
    accentBorder: "rgba(168,155,194,0.45)",
  },
  emtia: {
    label: "Emtia Asistanı",
    icon: "🛢️",
    accent: "#7FBFA8",
    accentBg: "rgba(127,191,168,0.18)",
    accentBorder: "rgba(127,191,168,0.45)",
  },
  kredi: {
    label: "Kredi Asistanı",
    icon: "🏦",
    accent: "#F4A384",
    accentBg: "rgba(244,163,132,0.18)",
    accentBorder: "rgba(244,163,132,0.45)",
  },
};

interface FloatingChatButtonProps {
  pageFocus: PageFocus;
}

export default function FloatingChatButton({ pageFocus }: FloatingChatButtonProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const config = PAGE_CONFIG[pageFocus];

  return (
    <>
      {/* ── Floating Action Button ── */}
      <AnimatePresence>
        {!chatOpen && (
          <motion.button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-5 z-40"
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "16px",
              background: "rgba(16,12,22,0.88)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: `1px solid ${config.accentBorder}`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04), 0 0 16px ${config.accentBg}`,
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            initial={{ opacity: 0, y: 20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            whileHover={{
              scale: 1.08,
              boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${config.accentBorder}, 0 0 24px ${config.accentBg}`,
            }}
            whileTap={{ scale: 0.94 }}
            aria-label="Finans Kedisi Asistanı"
          >
            <Image
              src={logoSrc}
              alt="Finans Kedisi"
              width={36}
              height={36}
              className="rounded-xl"
              priority
            />
            {/* Pulse halkası */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ border: `1px solid ${config.accent}` }}
              animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── ChatBot (sayfa odaklı) ── */}
      <ChatBot
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        pageFocus={pageFocus}
      />
    </>
  );
}