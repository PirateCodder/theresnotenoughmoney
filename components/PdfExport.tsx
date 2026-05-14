"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { AmortizationRow } from "@/lib/creditCalculator";

interface PdfExportProps {
  principal: number;
  interestRate: number;
  months: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  rows: AmortizationRow[];
}

/** Para formatı — latin1 uyumlu, TL harfi ile */
function fmtMoney(value: number): string {
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} TL`;
}

/** Türkçe karakter → ASCII */
function tr(text: string): string {
  return text
    .replace(/İ/g, "I").replace(/ı/g, "i")
    .replace(/Ş/g, "S").replace(/ş/g, "s")
    .replace(/Ğ/g, "G").replace(/ğ/g, "g")
    .replace(/Ü/g, "U").replace(/ü/g, "u")
    .replace(/Ö/g, "O").replace(/ö/g, "o")
    .replace(/Ç/g, "C").replace(/ç/g, "c");
}

export default function PdfExport({
  principal,
  interestRate,
  months,
  monthlyPayment,
  totalPayment,
  totalInterest,
  rows,
}: PdfExportProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (rows.length === 0) return;
    setLoading(true);

    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      /** Sayfa arka planını çizer — içerik çiziminden ÖNCE çağrılmalı */
      const drawPageBackground = () => {
        doc.setFillColor(18, 32, 38);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
      };

      // ── 1. Sayfa arka planı ──────────────────────────────────
      drawPageBackground();

      // ── Header ──────────────────────────────────────────────
      doc.setFillColor(21, 40, 47);
      doc.rect(0, 0, pageWidth, 48, "F");

      doc.setFillColor(244, 163, 132);
      doc.rect(0, 0, 5, 48, "F");

      doc.setTextColor(250, 239, 233);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("KREDI ODEME PLANI", 16, 20);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 185, 165);
      doc.text("Odeme Simulasyonu Raporu", 16, 29);

      const now = new Date();
      const dateStr = `${now.toLocaleDateString("tr-TR")} ${now.toLocaleTimeString("tr-TR", {
        hour: "2-digit", minute: "2-digit",
      })}`;
      doc.text(tr(`Olusturulma: ${dateStr}`), pageWidth - 14, 29, { align: "right" });

      // ── Özet kutu ───────────────────────────────────────────
      doc.setFillColor(30, 52, 62);
      doc.roundedRect(14, 56, pageWidth - 28, 44, 4, 4, "F");

      const col1 = 22;
      const col2 = pageWidth / 2 + 10;

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(160, 148, 130);
      doc.text("KREDI TUTARI", col1, 66);
      doc.text("AYLIK FAIZ ORANI", col2, 66);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(250, 239, 233);
      doc.text(fmtMoney(principal), col1, 73);
      doc.text(`%${interestRate.toFixed(2)}`, col2, 73);

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(160, 148, 130);
      doc.text("VADE", col1, 83);
      doc.text("AYLIK TAKSIT", col2, 83);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(250, 239, 233);
      doc.text(`${months} Ay`, col1, 90);
      doc.text(fmtMoney(monthlyPayment), col2, 90);

      // ── Toplamlar kutu ──────────────────────────────────────
      doc.setFillColor(74, 44, 63);
      doc.roundedRect(14, 107, pageWidth - 28, 22, 4, 4, "F");

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 175, 160);
      doc.text("TOPLAM GERI ODEME", col1, 115);
      doc.text("TOPLAM FAIZ", col2, 115);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(244, 163, 132);
      doc.text(fmtMoney(totalPayment), col1, 123);
      doc.text(fmtMoney(totalInterest), col2, 123);

      // ── Tablo başlığı ───────────────────────────────────────
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(250, 239, 233);
      doc.text("AYLIK ODEME TABLOSU", 14, 139);

      // ── Amortisman tablosu ──────────────────────────────────
      const tableData = rows.map((row) => [
        String(row.month),
        fmtMoney(row.payment),
        fmtMoney(row.principal),
        fmtMoney(row.interest),
        fmtMoney(row.balance),
      ]);

      autoTable(doc, {
        startY: 143,
        head: [["Ay", "Taksit Tutari", "Ana Para", "Faiz", "Kalan Bakiye"]],
        body: tableData,
        theme: "plain",
        styles: {
          font: "helvetica",
          fontSize: 7.5,
          cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
          textColor: [226, 213, 194],
          overflow: "hidden",
          halign: "right",
        },
        headStyles: {
          fillColor: [45, 75, 92],
          textColor: [250, 239, 233],
          fontStyle: "bold",
          fontSize: 7.5,
          cellPadding: { top: 4.5, bottom: 4.5, left: 4, right: 4 },
          halign: "right",
        },
        alternateRowStyles: {
          fillColor: [28, 50, 60],
        },
        bodyStyles: {
          fillColor: [22, 40, 50],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          1: { halign: "right", cellWidth: 42 },
          2: { halign: "right", cellWidth: 42, textColor: [100, 165, 200] },
          3: { halign: "right", cellWidth: 42, textColor: [244, 163, 132] },
          4: { halign: "right", cellWidth: 44 },
        },
        margin: { left: 14, right: 14 },
        tableWidth: 182,
        // 2. ve sonraki sayfalarda arka plan (1. sayfa zaten çizildi)
        willDrawPage: (data: { pageNumber: number }) => {
          if (data.pageNumber > 1) {
            drawPageBackground();
          }
        },
        // footer'ı içerik çizildikten SONRA ekle
        didDrawPage: (data: { pageNumber: number }) => {
          const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(90, 110, 120);
          doc.text(
            `Sayfa ${data.pageNumber} / ${pageCount}`,
            pageWidth / 2,
            pageHeight - 8,
            { align: "center" }
          );
          doc.text(
            "Bu belge bilgi amaclidir, baglayici degildir.",
            pageWidth / 2,
            pageHeight - 4,
            { align: "center" }
          );
        },
      });

      doc.save(`kredi-odeme-plani-${months}ay.pdf`);
    } catch (error) {
      console.error("PDF olusturma hatasi:", error);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || rows.length === 0;

  return (
    <motion.button
      onClick={handleDownload}
      disabled={isDisabled}
      className="w-full py-4 px-6 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-300"
      style={{
        background: isDisabled
          ? "rgba(255,255,255,0.05)"
          : "linear-gradient(135deg, #F4A384 0%, #e8916e 100%)",
        color: isDisabled ? "rgba(226,213,194,0.3)" : "#15282F",
        boxShadow: isDisabled ? "none" : "0 8px 24px rgba(244, 163, 132, 0.35)",
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
      whileHover={!isDisabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>PDF Oluşturuluyor...</span>
        </>
      ) : (
        <>
          <ArrowDownTrayIcon className="w-5 h-5" />
          <span>Ödeme Planını PDF İndir</span>
        </>
      )}
    </motion.button>
  );
}