import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MarketProvider } from "@/context/MarketContext";

export const metadata: Metadata = {
  title: "Finans Kedisi | Akıllı Finans Portalı",
  description: "Döviz kurları, altın fiyatları, kripto para piyasası, emtia ve kredi simülasyonu — tek ekranda.",
  icons: {
    icon: "/logo.webp",
    apple: "/logo big.webp",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">
        <MarketProvider>
          {children}
        </MarketProvider>
      </body>
    </html>
  );
}