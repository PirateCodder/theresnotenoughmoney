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
  GA:     "Gram Altın",
  C:      "Çeyrek Altın",
  GAG:    "Gram Gümüş",
  XAUUSD: "Ons Altın",
  XHGLD:  "Has Altın",
  Y:      "Yarım Altın",
  T:      "Tam Altın",
  CMR:    "Cumhuriyet Altını",
  ATA:    "Ata Altın",
  "14":   "14 Ayar Altın",
  "18":   "18 Ayar Altın",
  "22":   "22 Ayar Bilezik",
  IKB:    "İkibuçuk Altın",
  BSL:    "Beşli Altın",
  GR:     "Gremse Altın",
  RA:     "Reşat Altın",
  HA:     "Hamit Altın",
  XAUXAG: "Altın/Gümüş Rasyosu",
};

// Döviz sembol → okunabilir isim
export const DOVIZ_ISIMLER: Record<string, string> = {
  USD: "Dolar",
  EUR: "Euro",
  GBP: "Sterlin",
  CHF: "İsviçre Frangı",
  CAD: "Kanada Doları",
  RUB: "Rus Rublesi",
  AED: "BAE Dirhemi",
  AUD: "Avustralya Doları",
  DKK: "Danimarka Kronu",
  SEK: "İsveç Kronu",
  NOK: "Norveç Kronu",
  JPY: "Japon Yeni",
  KWD: "Kuveyt Dinarı",
  ZAR: "Güney Afrika Randı",
  BHD: "Bahreyn Dinarı",
  LYD: "Libya Dinarı",
  SAR: "Suudi Arabistan Riyali",
  IQD: "Irak Dinarı",
  IRR: "İran Riyali",
  INR: "Hindistan Rupisi",
  MXN: "Meksika Pesosu",
};

// Kripto sembol → okunabilir isim
export const KRIPTO_ISIMLER: Record<string, string> = {
  BTC:   "Bitcoin",
  ETH:   "Ethereum",
  USDT:  "Tether",
  BNB:   "Binance Coin",
  BUSD:  "Binance USD",
  XRP:   "Ripple",
  SOL:   "Solana",
  ADA:   "Cardano",
  DOGE:  "Dogecoin",
  AVAX:  "Avalanche",
  USDC:  "USD Coin",
  DOT:   "Polkadot",
  LTC:   "Litecoin",
  NEAR:  "Near",
  ATOM:  "Cosmos",
  UNI:   "Uniswap",
  XLINK: "Chainlink",
  SUSHI: "Sushi",
  MKR:   "Maker",
  MIOTA: "Iota",
};

// Emtia sembol → okunabilir isim
export const EMTIA_ISIMLER: Record<string, string> = {
  COIL:    "Ham Petrol",
  XBRUSD:  "Brent Petrol",
  XAGUSD:  "Gümüş Ons",
  XPTUSD:  "Platin",
  XPDUSD:  "Paladyum",
  COPPER:  "Bakır",
  NGAS:    "Doğalgaz",
  WHEAT:   "Buğday",
  COTTON:  "Pamuk",
  COCOA:   "Kakao",
  COFFEE:  "Kahve",
  SOYBEAN: "Soya Fasülyesi",
  CORN:    "Mısır",
  SUGAR:   "Şeker",
};

// yon alanını normalize et
export function parseYon(raw: unknown): "moneyUp" | "moneyDown" | "neutral" {
  const s = String(raw ?? "").toLowerCase();
  if (s === "moneyup") return "moneyUp";
  if (s === "moneydown") return "moneyDown";
  return "neutral";
}