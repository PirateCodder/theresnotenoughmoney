import { NextResponse } from "next/server";

export const revalidate = 300; // 5 dakikada bir yenile

// ── TypeScript Tipleri ──────────────────────────────────────────────
export interface DovizItem {
  alis: string;
  satis: string;
  degisim: string;  // "+0.12" gibi yüzde değişim
  yon: "moneyUp" | "moneyDown" | "neutral";
}

export interface AltinItem {
  adi: string;
  alis: string;
  satis: string;
  degisim: string;  // "+0.48" gibi yüzde değişim
  oran: string;     // "+33.03" gibi TL bazlı değişim
  yon: "moneyUp" | "moneyDown" | "neutral";
}

export interface MarketResponse {
  doviz: Record<string, DovizItem> | null;
  altin: Record<string, AltinItem> | null;
}

// Altın sembol → okunabilir isim
const ALTIN_ISIMLER: Record<string, string> = {
  GA:  "Gram Altın",
  C:   "Çeyrek Altın",
  GAG: "Gram Gümüş",
  Y:   "Yarım Altın",
  T:   "Tam Altın",
  CMR: "Cumhuriyet Altını",
  ATA: "Ata Altın",
  "22": "22 Ayar Bilezik",
};

// yon alanını normalize et
function parseYon(raw: unknown): "moneyUp" | "moneyDown" | "neutral" {
  const s = String(raw ?? "").toLowerCase();
  if (s === "moneyup") return "moneyUp";
  if (s === "moneydown") return "moneyDown";
  return "neutral";
}

export async function GET(): Promise<NextResponse<MarketResponse>> {
  const DOVIZ_URL =
    "https://api.genelpara.com/json/?list=doviz&sembol=USD,EUR,GBP,CHF,RUB";
  const ALTIN_URL =
    "https://api.genelpara.com/json/?list=altin&sembol=GA,C,GAG,Y,T,CMR,ATA,22";

  const fetchOpts: RequestInit = { next: { revalidate: 300 } };

  // Paralel fetch — biri hata verse diğeri etkilenmesin
  const [dovizRes, altinRes] = await Promise.allSettled([
    fetch(DOVIZ_URL, fetchOpts),
    fetch(ALTIN_URL, fetchOpts),
  ]);

  // ── Döviz ──────────────────────────────────────────────────────────
  let doviz: MarketResponse["doviz"] = null;
  try {
    if (dovizRes.status === "fulfilled" && dovizRes.value.ok) {
      const wrapper = await dovizRes.value.json() as Record<string, unknown>;
      // GenelPara: { success, list, count, remaining, data: { USD: {...}, EUR: {...} } }
      const raw = (wrapper.data ?? wrapper) as Record<string, Record<string, unknown>>;
      doviz = {};
      for (const [kod, val] of Object.entries(raw)) {
        if (typeof val !== "object" || val === null) continue;
        doviz[kod] = {
          alis:    String(val.alis ?? "—"),
          satis:   String(val.satis ?? "—"),
          degisim: String(val.degisim ?? "0"),
          yon:     parseYon(val.yon),
        };
      }
    }
  } catch {
    doviz = null;
  }

  // ── Altın ──────────────────────────────────────────────────────────
  let altin: MarketResponse["altin"] = null;
  try {
    if (altinRes.status === "fulfilled" && altinRes.value.ok) {
      const wrapper = await altinRes.value.json() as Record<string, unknown>;
      const raw = (wrapper.data ?? wrapper) as Record<string, Record<string, unknown>>;
      altin = {};
      for (const [sembol, val] of Object.entries(raw)) {
        if (typeof val !== "object" || val === null) continue;
        altin[sembol] = {
          adi:     ALTIN_ISIMLER[sembol] ?? sembol,
          alis:    String(val.alis ?? "—"),
          satis:   String(val.satis ?? "—"),
          degisim: String(val.degisim ?? "0"),
          oran:    String(val.oran ?? "0"),
          yon:     parseYon(val.yon),
        };
      }
    }
  } catch {
    altin = null;
  }

  return NextResponse.json({ doviz, altin });
}