"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CategoryCarousel } from "@/components/CategoryCarousel";
import { ProductCard } from "@/components/ProductCard";
import { TrustIcon } from "@/components/TrustIcon";
import { trustBadges } from "@/lib/products";
import { useCatalogStore } from "@/store/catalog-store";
import { useStoreConfig } from "@/store/store-config";

export default function HomePage() {
  const products = useCatalogStore((s) => s.products);
  const config = useStoreConfig((s) => s.config);
  const configHydrated = useStoreConfig((s) => s.hydrated);
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const showcase = featured.length > 0 ? featured : products.slice(0, 6);
  const heroSlides = config.heroSlides ?? [];

  return (
    <>
      <section className="py-8 md:py-12">
        <div className="mx-auto w-full max-w-[1480px] px-4 md:px-6 lg:px-8">
          <HeroProductsCarousel
            customSlides={heroSlides}
            configHydrated={configHydrated}
          />
        </div>

        <div className="mx-auto mt-4 w-full max-w-[1480px] px-4 md:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3.5">
            <Link
              href="/catalogo"
              className="rounded-[9px] bg-primary px-[26px] py-3 text-[14px] font-semibold text-white no-underline hover:bg-primary-dark hover:!no-underline"
            >
              Ver catálogo
            </Link>
            <Link
              href="/catalogo?destacados=1"
              className="rounded-[9px] border border-border bg-surface px-[22px] py-3 text-[14px] font-semibold text-foreground no-underline hover:bg-accent-soft hover:!no-underline"
            >
              Ver destacados
            </Link>
          </div>
        </div>
      </section>

      <CategoryCarousel />

      <section className="pb-11">
        <div className="mb-[22px] flex items-baseline justify-between">
          <h2 className="m-0 text-[22px] font-bold">Destacados</h2>
          <Link href="/catalogo" className="text-sm font-semibold">
            Ver todo →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {showcase.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mb-11 flex flex-col items-start justify-between gap-6 rounded-[14px] bg-primary-soft px-7 py-7 md:flex-row md:items-center md:px-9">
        <div>
          <div className="mb-1 text-lg font-bold">
            ¿Querés pagar en cuotas?
          </div>
          <div className="text-sm text-body-text">
            Entrá al simulador y calculá el costo de cada plan.
          </div>
        </div>
        <Link
          href="/simulador"
          className="shrink-0 rounded-[9px] bg-primary px-[22px] py-3 text-sm font-semibold whitespace-nowrap text-white no-underline hover:bg-primary-dark hover:no-underline!"
        >
          Ir al simulador
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-5 border-t border-border pt-9 pb-14 sm:grid-cols-3">
        {trustBadges.map((b) => (
          <div key={b.id} className="flex items-start gap-3">
            <TrustIcon id={b.id} />
            <div>
              <div className="mb-0.5 text-sm font-bold">{b.title}</div>
              <div className="text-[12.5px] leading-snug text-muted">
                {b.desc}
              </div>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

function HeroProductsCarousel({
  customSlides,
  configHydrated,
}: {
  customSlides: { imageUrl: string; href: string; title?: string }[];
  configHydrated: boolean;
}) {
  const slides = useMemo(() => {
    if (!configHydrated) return [];
    const fromConfig = customSlides
      .filter((s) => s.imageUrl)
      .map((slide) => ({ kind: "custom" as const, slide }));
    if (fromConfig.length > 0) return fromConfig;
    return [
      {
        kind: "custom" as const,
        slide: {
          imageUrl: "/home-picture.png",
          href: "/catalogo",
          title: "Explorá todo el catálogo",
        },
      },
    ];
  }, [customSlides]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;

  useEffect(() => {
    if (index > total - 1) setIndex(0);
  }, [index, total]);

  useEffect(() => {
    if (total <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % total);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [total, paused]);

  const move = (step: number) => {
    setIndex((prev) => (prev + step + total) % total);
  };

  if (!configHydrated) {
    return (
      <div className="relative h-[390px] w-full overflow-hidden rounded-2xl border border-border-soft bg-surface md:h-[560px]" />
    );
  }

  return (
    <div className="relative h-[390px] w-full overflow-hidden rounded-2xl border border-border-soft bg-surface md:h-[560px]">
      {slides.map((slide, i) => (
        <div
          key={`${slide.slide.imageUrl}-${i}`}
          className={`absolute inset-0 transition-all duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            i === index
              ? "z-[2] scale-100 opacity-100 blur-0"
              : "pointer-events-none z-[1] scale-[1.03] opacity-0 blur-[2px]"
          }`}
        >
          <SmartLink href={slide.slide.href} className="group block h-full w-full bg-black no-underline hover:!no-underline">
            <div
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              className="relative h-full w-full"
            >
            <Image
              src={slide.slide.imageUrl}
              alt={slide.slide.title || "Slide principal"}
              fill
              priority={i <= 2}
              className="object-contain object-center transition-transform duration-500 group-hover:scale-[1.01]"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            {slide.slide.title ? (
              <div className="absolute right-0 bottom-0 left-0 p-4 md:p-5">
                <div className="line-clamp-2 text-base font-bold text-white md:text-[22px]">
                  {slide.slide.title}
                </div>
              </div>
            ) : null}
            </div>
          </SmartLink>
        </div>
      ))}

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Slide anterior"
            className="absolute top-1/2 left-3 z-10 -translate-y-1/2 rounded-full border border-white/35 bg-black/35 p-2 text-white backdrop-blur-sm"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Slide siguiente"
            className="absolute top-1/2 right-3 z-10 -translate-y-1/2 rounded-full border border-white/35 bg-black/35 p-2 text-white backdrop-blur-sm"
          >
            <ChevronRight />
          </button>

          <div className="absolute right-0 bottom-3 left-0 z-10 flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ir al slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-5 bg-white" : "w-2 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SmartLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const isExternal = /^https?:\/\//i.test(href);
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href || "/catalogo"} className={className}>
      {children}
    </Link>
  );
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m15 18-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m9 18 6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
