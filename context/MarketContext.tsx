"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { DovizItem, AltinItem, KriptoItem, EmtiaItem } from "@/types/market";
import { parseYon, ALTIN_ISIMLER } from "@/types/market";

// ─── Tipler ──────────────────────────────────────────────────────────
export interface MarketState {
  doviz: Record<string, DovizItem> | null;
  altin: Record<string, AltinItem> | null;
  kripto: Record<string, KriptoItem> | null;
  emtia: Record<string, EmtiaItem> | null;
  loading: boolean;
  error: boolean;
  lastUpdated: Date | null;
}

const defaultState: MarketState = {
  doviz: null,
  altin: null,
  kripto: null,
  emtia: null,
  loading: true,
  error: false,
  lastUpdated: null,
};

// ─── Context ─────────────────────────────────────────────────────────
const MarketContext = createContext<MarketState>(defaultState);

// ─── Yardımcı: raw JSON → tip dönüşümleri ────────────────────────────
function parseDoviz(raw: Record<string, Record<string, unknown>>): Record<string, DovizItem> {
  const result: Record<string, DovizItem> = {};
  for (const [kod, val] of Object.entries(raw)) {
    if (typeof val !== "object" || val === null) continue;
    result[kod] = {
      alis:    String(val.alis    ?? "—"),
      satis:   String(val.satis   ?? "—"),
      degisim: String(val.degisim ?? "0"),
      yon:     parseYon(val.yon),
    };
  }
  return result;
}

function parseAltin(raw: Record<string, Record<string, unknown>>): Record<string, AltinItem> {
  const result: Record<string, AltinItem> = {};
  for (const [sembol, val] of Object.entries(raw)) {
    if (typeof val !== "object" || val === null) continue;
    result[sembol] = {
      adi:     ALTIN_ISIMLER[sembol] ?? sembol,
      alis:    String(val.alis    ?? "—"),
      satis:   String(val.satis   ?? "—"),
      degisim: String(val.degisim ?? "0"),
      oran:    String(val.oran    ?? "0"),
      yon:     parseYon(val.yon),
    };
  }
  return result;
}

function parseKripto(raw: Record<string, Record<string, unknown>>): Record<string, KriptoItem> {
  const result: Record<string, KriptoItem> = {};
  for (const [sembol, val] of Object.entries(raw)) {
    if (typeof val !== "object" || val === null) continue;
    result[sembol] = {
      adi:     String(val.adi ?? val.ad ?? sembol),
      satis:   String(val.satis ?? val.fiyat ?? "—"),
      degisim: String(val.degisim ?? "0"),
      yon:     parseYon(val.yon),
    };
  }
  return result;
}

function parseEmtia(raw: Record<string, Record<string, unknown>>): Record<string, EmtiaItem> {
  const result: Record<string, EmtiaItem> = {};
  for (const [sembol, val] of Object.entries(raw)) {
    if (typeof val !== "object" || val === null) continue;
    result[sembol] = {
      adi:     String(val.adi ?? val.ad ?? sembol),
      satis:   String(val.satis ?? val.fiyat ?? "—"),
      degisim: String(val.degisim ?? "0"),
      yon:     parseYon(val.yon),
    };
  }
  return result;
}

// ─── Veri Çekme Fonksiyonu ───────────────────────────────────────────
async function fetchAllMarketData(): Promise<Omit<MarketState, "loading" | "error" | "lastUpdated">> {
  const [dovizRes, altinRes, kriptoRes, emtiaRes] = await Promise.all([
    fetch("https://api.genelpara.com/json/?list=doviz"),
    fetch("https://api.genelpara.com/json/?list=altin"),
    fetch("https://api.genelpara.com/json/?list=kripto"),
    fetch("https://api.genelpara.com/json/?list=emtia"),
  ]);

  // Döviz
  let doviz: Record<string, DovizItem> | null = null;
  try {
    if (dovizRes.ok) {
      const wrapper = await dovizRes.json() as Record<string, unknown>;
      const raw = (wrapper.data ?? wrapper) as Record<string, Record<string, unknown>>;
      doviz = parseDoviz(raw);
    }
  } catch { doviz = null; }

  // Altın
  let altin: Record<string, AltinItem> | null = null;
  try {
    if (altinRes.ok) {
      const wrapper = await altinRes.json() as Record<string, unknown>;
      const raw = (wrapper.data ?? wrapper) as Record<string, Record<string, unknown>>;
      altin = parseAltin(raw);
    }
  } catch { altin = null; }

  // Kripto
  let kripto: Record<string, KriptoItem> | null = null;
  try {
    if (kriptoRes.ok) {
      const wrapper = await kriptoRes.json() as Record<string, unknown>;
      const raw = (wrapper.data ?? wrapper) as Record<string, Record<string, unknown>>;
      kripto = parseKripto(raw);
    }
  } catch { kripto = null; }

  // Emtia
  let emtia: Record<string, EmtiaItem> | null = null;
  try {
    if (emtiaRes.ok) {
      const wrapper = await emtiaRes.json() as Record<string, unknown>;
      const raw = (wrapper.data ?? wrapper) as Record<string, Record<string, unknown>>;
      emtia = parseEmtia(raw);
    }
  } catch { emtia = null; }

  return { doviz, altin, kripto, emtia };
}

// ─── Provider ────────────────────────────────────────────────────────
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 dakika

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MarketState>(defaultState);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchAllMarketData();
      const hasAny = data.doviz || data.altin || data.kripto || data.emtia;
      setState({
        ...data,
        loading: false,
        error: !hasAny,
        lastUpdated: new Date(),
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: true }));
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <MarketContext.Provider value={state}>
      {children}
    </MarketContext.Provider>
  );
}

// ─── Custom Hook ─────────────────────────────────────────────────────
export function useMarket(): MarketState {
  return useContext(MarketContext);
}