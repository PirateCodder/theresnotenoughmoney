"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import logoSmall from "@/app/logo.webp";

interface PageHeaderProps {
  title: string;
  description?: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconAccent: string;
}

export default function PageHeader({ title, description, Icon, iconAccent }: PageHeaderProps) {
  return (
    <>
      {/* Üst bar: geri butonu + logo */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(226,213,194,0.7)",
          }}
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Ana Sayfa
        </Link>

        <Link href="/" className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
          <Image src={logoSmall} alt="Finans Kedisi" width={32} height={32} className="rounded-lg" />
          <span className="text-sm font-semibold hidden sm:block" style={{ color: "#FAEFE9" }}>
            Finans Kedisi
          </span>
        </Link>
      </div>

      {/* Sayfa başlığı */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${iconAccent}26`,
              border: `1px solid ${iconAccent}40`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: iconAccent }} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#FAEFE9" }}>
            {title}
          </h1>
        </div>
        {description && (
          <p className="pl-[52px] text-sm" style={{ color: "rgba(226,213,194,0.45)" }}>
            {description}
          </p>
        )}
      </div>
    </>
  );
}