import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

export const revalidate = 3600; // 1 saatte bir yenile

interface CurrencyData {
  USD: { buying: string; selling: string };
  EUR: { buying: string; selling: string };
  date: string;
}

export async function GET(): Promise<NextResponse<CurrencyData | { error: string }>> {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "TCMB servisine ulaşılamıyor" }, { status: 502 });
    }

    const xml = await res.text();

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const parsed = parser.parse(xml);

    const currencies: Record<string, unknown>[] =
      parsed?.Tarih_Date?.Currency ?? [];

    const find = (code: string) =>
      currencies.find(
        (c) =>
          (c["@_Kod"] as string) === code ||
          (c["@_CurrencyCode"] as string) === code
      );

    const usd = find("USD");
    const eur = find("EUR");

    if (!usd || !eur) {
      return NextResponse.json({ error: "Kur verisi bulunamadı" }, { status: 500 });
    }

    const dateAttr: string =
      (parsed?.Tarih_Date?.["@_Date"] as string) ?? "";

    return NextResponse.json({
      USD: {
        buying: String(usd.ForexBuying ?? "—"),
        selling: String(usd.ForexSelling ?? "—"),
      },
      EUR: {
        buying: String(eur.ForexBuying ?? "—"),
        selling: String(eur.ForexSelling ?? "—"),
      },
      date: dateAttr,
    });
  } catch {
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}