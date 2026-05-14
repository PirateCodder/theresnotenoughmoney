// ── Piyasa Veri Tipleri ──────────────────────────────────────────────

export interface DovizItem {
  alis: string;
  satis: string;
  degisim: string;
  yon: "moneyUp" | "moneyDown" | "neutral";
}

export interface AltinItem {
  adi: string;
  alis: string;
  satis: string;
  degisim: string;
  oran: string;
  yon: "moneyUp" | "moneyDown" | "neutral";
}

export interface KriptoItem {
  adi: string;
  satis: string;
  degisim: string;
  yon: "moneyUp" | "moneyDown" | "neutral";
}

export interface EmtiaItem {
  adi: string;
  satis: string;
  degisim: string;
  yon: "moneyUp" | "moneyDown" | "neutral";
}

export interface MarketResponse {
  doviz: Record<string, DovizItem> | null;
  altin: Record<string, AltinItem> | null;
  kripto: Record<string, KriptoItem> | null;
  emtia: Record<string, EmtiaItem> | null;
}

// Altın sembol → okunabilir isim
export const ALTIN_ISIMLER: Record<string, string> = {
  GA:   "Gram Altın",
  C:    "Çeyrek Altın",
  GAG:  "Gram Gümüş",
  Y:    "Yarım Altın",
  T:    "Tam Altın",
  CMR:  "Cumhuriyet Altını",
  ATA:  "Ata Altın",
  "22": "22 Ayar Bilezik",
};

// yon alanını normalize et
export function parseYon(raw: unknown): "moneyUp" | "moneyDown" | "neutral" {
  const s = String(raw ?? "").toLowerCase();
  if (s === "moneyup") return "moneyUp";
  if (s === "moneydown") return "moneyDown";
  return "neutral";
}