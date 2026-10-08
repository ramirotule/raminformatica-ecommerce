"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type Props = {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  xs: { width: 56, height: 56, className: "h-11 w-11" },
  sm: { width: 80, height: 80, className: "h-16 w-16 md:h-20 md:w-20" },
  md: {
    width: 360,
    height: 180,
    // Hacemos crecer el ancho (no el alto) para mantener la altura del header.
    className: "h-[88px] w-[252px] md:h-[104px] md:w-[344px]",
  },
  lg: { width: 180, height: 180, className: "h-36 w-36" },
};

export function BrandLogo({ size = "md", className = "" }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const src = isDark ? "/logo-dark.png" : "/logo-light.jpg";
  const dim = sizes[size];

  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center no-underline hover:!no-underline ${className}`}
      aria-label="RAM Informática — Inicio"
    >
      <Image
        src={src}
        alt="RAM Informática"
        width={dim.width}
        height={dim.height}
        className={`${dim.className} object-contain`}
        priority
      />
    </Link>
  );
}
