"use client";

import Image from "next/image";

/** Marca tipográfica / monograma cuando no hay logo subido. */
const BRAND_TONES: Record<string, string> = {
  apple: "bg-[#f5f5f7] text-[#1d1d1f]",
  samsung: "bg-[#1428a0] text-white",
  xiaomi: "bg-[#ff6900] text-white",
  motorola: "bg-[#1a1a1a] text-white",
  sony: "bg-[#000000] text-white",
  jbl: "bg-[#ff6600] text-white",
  lenovo: "bg-[#e2231a] text-white",
  hp: "bg-[#0096d6] text-white",
  dell: "bg-[#0076ce] text-white",
  lg: "bg-[#a50034] text-white",
  huawei: "bg-[#cf0a2c] text-white",
  honor: "bg-[#000000] text-white",
  nothing: "bg-[#1a1a1a] text-white",
  google: "bg-[#4285f4] text-white",
  beats: "bg-[#e01f3d] text-white",
  logitech: "bg-[#00b8fc] text-[#0b0b0b]",
  playstation: "bg-[#003087] text-white",
  nintendo: "bg-[#e60012] text-white",
};

function toneForBrand(name: string): string {
  const key = name.trim().toLowerCase();
  if (BRAND_TONES[key]) return BRAND_TONES[key];
  for (const [k, tone] of Object.entries(BRAND_TONES)) {
    if (key.includes(k)) return tone;
  }
  return "bg-primary-soft text-primary-dark";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

type Props = {
  name: string;
  logoUrl?: string | null;
  className?: string;
};

const DEFAULT_BRAND_LOGOS: Record<string, string> = {
  acer: "/brands/defaults/acer.svg",
  asus: "/brands/defaults/asus.svg",
  dell: "/brands/defaults/dell.svg",
  dji: "/brands/defaults/dji.svg",
  gigabyte: "/brands/defaults/gigabyte.svg",
  hp: "/brands/defaults/hp.svg",
  lenovo: "/brands/defaults/lenovo.svg",
  msi: "/brands/defaults/msi.svg",
};

function defaultLogoForBrand(name: string): string | null {
  const key = name.trim().toLowerCase();
  for (const [brand, path] of Object.entries(DEFAULT_BRAND_LOGOS)) {
    if (key === brand || key.includes(brand)) return path;
  }
  return null;
}

export function BrandMark({ name, logoUrl, className = "" }: Props) {
  const resolvedLogo = logoUrl || defaultLogoForBrand(name);

  if (resolvedLogo) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-white ${className}`.trim()}
      >
        <Image
          src={resolvedLogo}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, 20vw"
          className="object-contain object-center p-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:scale-110"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-2xl font-bold tracking-tight ${toneForBrand(name)} ${className}`.trim()}
      aria-hidden
    >
      <span className="text-[28px] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:scale-110 md:text-[32px]">
        {initials(name)}
      </span>
    </div>
  );
}
