import { streamText, createUIMessageStreamResponse } from "ai";
import { google } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, marketData, aiTier, pageContext } = body as {
      messages: { role: "user" | "assistant"; content: string }[];
      marketData: string;
      aiTier: "basic" | "pro";
      pageContext?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Geçersiz mesaj formatı." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const marketContext = marketData && marketData.trim().length > 0
      ? marketData
      : "(Piyasa verisi henüz yüklenmedi)";

    const PAGE_CONTEXT_LABELS: Record<string, string> = {
      altin:  "Kullanıcı şu an ALTIN & DEĞERLİ MADENLER sayfasında — altın ve gümüş sorularına öncelik ver.",
      doviz:  "Kullanıcı şu an DÖVİZ KURLARI sayfasında — döviz ve kur sorularına öncelik ver.",
      kripto: "Kullanıcı şu an KRİPTO PARA sayfasında — kripto para sorularına öncelik ver.",
      emtia:  "Kullanıcı şu an EMTİA sayfasında — petrol, doğalgaz ve hammadde sorularına öncelik ver.",
      kredi:  "Kullanıcı şu an KREDİ HESAPLAMA sayfasında — kredi, faiz ve taksit sorularına öncelik ver.",
      genel:  "Kullanıcı ana chat sayfasında — tüm piyasa konularına yanıt ver.",
    };

    const pageContextNote = pageContext && PAGE_CONTEXT_LABELS[pageContext]
      ? `\n${PAGE_CONTEXT_LABELS[pageContext]}`
      : "";

    const systemPrompt = `Sen "Finans Kedisi" uygulamasının uzman finansal asistanısın. Her zaman Türkçe yanıt ver.${pageContextNote}

Aşağıda sana GERÇEK ZAMANLI ve GÜNCEL piyasa verileri verilmektedir. Bu veriler kullanıcının tarayıcısında canlı olarak çekilmiş olup kesinlikle doğrudur. "Güncel verim yok", "bilmiyorum" veya "kontrol edin" gibi yanıtlar VERME. Bunun yerine aşağıdaki verileri doğrudan kullanarak hesap yap ve yanıt ver.

${marketContext}

Yanıt verirken:
- Kullanıcının sorusunu doğrudan yukarıdaki verilerden yanıtla
- Hesap sorularında somut sayılar ver (örn. "500.000 TL ÷ [GA satış fiyatı] = X gram")
- TL cinsinden fiyatlar için TL birimini, USD cinsinden olanlar için USD birimini kullan
- XAUXAG Altın/Gümüş Rasyosu'dur ve birimsizdir (kaç ons altın = 1 ons gümüş)
- Yatırım tavsiyesi vermediğini belirtebilirsin ama analitik ve somut ol`;

    const historyLimit = aiTier === "pro" ? 5 : 3;
    const recentMessages = messages.slice(-historyLimit);

    const cleanMessages = recentMessages.map((msg: any) => {
      let textContent = "";

      if (typeof msg.content === "string") {
        textContent = msg.content;
      } else if (Array.isArray(msg.parts)) {
        textContent = msg.parts.map((p: any) => p.text || "").join("\n");
      }

      return {
        role: msg.role === "user" || msg.role === "assistant" || msg.role === "system" ? msg.role : "user",
        content: textContent,
      };
    });

    if (aiTier === "pro") {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Pro model için API anahtarı yapılandırılmamış." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const customAnthropic = createAnthropic({
        baseURL: "https://app.claude.gg/",
        apiKey,
      });

      const result = streamText({
        model: customAnthropic("claude-sonnet-4-6"),
        system: systemPrompt,
        messages: cleanMessages,
      });

      return createUIMessageStreamResponse({
        stream: result.toUIMessageStream(),
      });
    } else {
      // basic → Gemini
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Basic model için API anahtarı yapılandırılmamış." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = streamText({
        model: google('gemini-2.5-flash'),
        system: systemPrompt,
        messages: cleanMessages,
      });

      return createUIMessageStreamResponse({
        stream: result.toUIMessageStream(),
      });
    }
  } catch (err) {
    console.error("[chat/route] Sunucu hatası:", err);
    return new Response(
      JSON.stringify({ error: "Sunucu hatası. Lütfen tekrar deneyin." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}