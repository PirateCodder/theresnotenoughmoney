"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  CalculatorIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  CpuChipIcon,
  ChartBarSquareIcon,
} from "@heroicons/react/24/outline";
import logoBig from "./logo big.webp";

// ─── Kart verisi ─────────────────────────────────────────────────────
const CARDS = [
  {
    href: "/kredi",
    label: "Kredi Simülasyonu",
    description: "Aylık taksit, toplam maliyet ve amortisman planını hesapla",
    Icon: CalculatorIcon,
    accent: "#F4A384",
    accentBg: "rgba(244,163,132,0.12)",
    accentBorder: "rgba(244,163,132,0.25)",
    gradient: "linear-gradient(135deg, rgba(244,163,132,0.15) 0%, rgba(244,163,132,0.03) 100%)",
  },
  {
    href: "/doviz",
    label: "Döviz Kurları",
    description: "Anlık kurları takip et, hızlıca dönüştür",
    Icon: ArrowTrendingUpIcon,
    accent: "#8BAFC4",
    accentBg: "rgba(139,175,196,0.12)",
    accentBorder: "rgba(139,175,196,0.25)",
    gradient: "linear-gradient(135deg, rgba(72,109,131,0.2) 0%, rgba(72,109,131,0.03) 100%)",
  },
  {
    href: "/altin",
    label: "Altın & Değerli Madenler",
    description: "Gram altın, çeyrek, gümüş ve tüm kıymetli madenleri izle",
    Icon: SparklesIcon,
    accent: "#D4AA60",
    accentBg: "rgba(212,170,96,0.12)",
    accentBorder: "rgba(212,170,96,0.25)",
    gradient: "linear-gradient(135deg, rgba(212,170,96,0.15) 0%, rgba(212,170,96,0.03) 100%)",
  },
  {
    href: "/kripto",
    label: "Kripto Para Piyasası",
    description: "BTC, ETH ve yüzlerce kripto paranın güncel fiyatları",
    Icon: CpuChipIcon,
    accent: "#A89BC2",
    accentBg: "rgba(168,155,194,0.12)",
    accentBorder: "rgba(168,155,194,0.25)",
    gradient: "linear-gradient(135deg, rgba(168,155,194,0.15) 0%, rgba(168,155,194,0.03) 100%)",
  },
  {
    href: "/emtia",
    label: "Emtia Fiyatları",
    description: "Ham petrol, doğal gaz, platin ve küresel emtia endeksleri",
    Icon: ChartBarSquareIcon,
    accent: "#7FBFA8",
    accentBg: "rgba(127,191,168,0.12)",
    accentBorder: "rgba(127,191,168,0.25)",
    gradient: "linear-gradient(135deg, rgba(127,191,168,0.15) 0%, rgba(127,191,168,0.03) 100%)",
  },
];

// ─── Animasyon varyantları ────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.25 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ─── Tek Kart Bileşeni ───────────────────────────────────────────────
function NavCard({ href, label, description, Icon, accent, accentBg, accentBorder, gradient }: typeof CARDS[0]) {
  return (
    <motion.div variants={cardVariants}>
      <Link href={href} className="block group">
        <motion.div
          className="relative overflow-hidden rounded-2xl cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.055)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${accentBorder}`,
            boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.07)",
          }}
          whileHover={{
            scale: 1.02,
            boxShadow: `0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px ${accentBorder}, inset 0 1px 0 rgba(255,255,255,0.1)`,
            transition: { duration: 0.2, ease: "easeOut" },
          }}
          whileTap={{ scale: 0.985 }}
        >
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ background: gradient }}
          />

          {/* İçerik */}
          <div className="relative z-10 flex items-center gap-4 px-5 py-4">
            {/* İkon */}
            <div
              className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
              style={{
                background: accentBg,
                border: `1px solid ${accentBorder}`,
                boxShadow: `0 0 16px ${accentBg}`,
              }}
            >
              <Icon className="w-[22px] h-[22px]" style={{ color: accent }} />
            </div>

            {/* Metin */}
            <div className="flex-1 min-w-0">
              <p
                className="font-semibold text-[15px] leading-snug tracking-tight"
                style={{ color: "#FAEFE9", fontVariantNumeric: "tabular-nums" }}
              >
                {label}
              </p>
              <p
                className="text-[12.5px] leading-snug mt-0.5 truncate"
                style={{ color: "rgba(226,213,194,0.48)" }}
              >
                {description}
              </p>
            </div>

            {/* Chevron — absolute, hover'da görünür */}
            <div
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5"
            >
              <svg className="w-4 h-4" style={{ color: `${accent}99` }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Alt aksan çizgisi */}
          <div
            className="absolute bottom-0 left-5 right-5 h-px opacity-0 group-hover:opacity-60 transition-opacity duration-300"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────
export default function Home() {
  return (
    <main className="min-h-screen px-4 py-10 md:px-6 md:py-16">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          className="text-center mb-10 md:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Logo */}
          <motion.div
            className="flex justify-center mb-5"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05, duration: 0.55, ease: "easeOut" }}
          >
            <div style={{ filter: "drop-shadow(0 0 20px rgba(244,163,132,0.3))" }}>
              <Image
                src={logoBig}
                alt="Finans Kedisi Logo"
                width={108}
                height={108}
                priority
                className="rounded-2xl"
              />
            </div>
          </motion.div>

          <h1
            className="mb-3 leading-tight tracking-tight"
            style={{ fontSize: "clamp(2.2rem, 6vw, 3.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}
          >
            <span style={{ color: "#FAEFE9" }}>Finans </span>
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #F4A384 0%, #C2606A 45%, #486D83 100%)",
              }}
            >
              Kedisi
            </span>
          </h1>

          <p
            className="mx-auto"
            style={{
              color: "rgba(226,213,194,0.45)",
              fontSize: "14.5px",
              lineHeight: "1.6",
              maxWidth: "340px",
              letterSpacing: "0.01em",
            }}
          >
            Piyasa fiyatlarını görün, dönüştürün ve kredinizi hesaplayın.
          </p>
        </motion.div>

        {/* ── Kartlar ── */}
        <motion.div
          className="flex flex-col gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {CARDS.map((card) => (
            <NavCard key={card.href} {...card} />
          ))}
        </motion.div>

        {/* ── Footer ── */}
        <motion.footer
          className="text-center mt-12 text-xs"
          style={{ color: "rgba(226,213,194,0.18)", letterSpacing: "0.02em" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <p>Veriler bilgi amaçlıdır. Yatırım tavsiyesi niteliği taşımaz.</p>
          <p className="mt-0.5">5 dakikada bir güncellenir.</p>
        </motion.footer>
      </div>
    </main>
  );
}