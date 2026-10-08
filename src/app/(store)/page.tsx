"use client";

import Image from "next/image";
import Link from "next/link";
import { CategoryCarousel } from "@/components/CategoryCarousel";
import { ProductCard } from "@/components/ProductCard";
import { TrustIcon } from "@/components/TrustIcon";
import { trustBadges } from "@/lib/products";
import { useCatalogStore } from "@/store/catalog-store";
import { useStoreConfig } from "@/store/store-config";

export default function HomePage() {
  const products = useCatalogStore((s) => s.products);
  const config = useStoreConfig((s) => s.config);
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const showcase = featured.length > 0 ? featured : products.slice(0, 6);

  return (
    <>
      <section className="flex flex-col items-center gap-12 py-10 md:flex-row md:gap-12 md:py-14">
        <div className="min-w-0 flex-1">
          <div className="mb-3.5 text-[13px] font-bold tracking-wider text-primary uppercase">
            Tecnología al mejor precio
          </div>
          <h1 className="mb-[18px] text-[34px] leading-[1.12] font-bold tracking-tight md:text-[44px]">
            Los equipos que buscás,
            <br />
            al mejor precio del mercado.
          </h1>
          <p className="mb-7 max-w-[460px] text-base leading-relaxed text-muted">
            Celulares, Notebooks, MacBooks, Gaming, TVs, Parlantes JBL y mucho más....
          </p>
          <div className="flex flex-wrap items-center gap-3.5">
            <Link
              href="/catalogo"
              className="rounded-[9px] bg-primary px-[26px] py-3.5 text-[15px] font-semibold text-white no-underline hover:bg-primary-dark hover:!no-underline"
            >
              Ver catálogo
            </Link>
           
          </div>
        </div>
        <div className="relative h-[280px] w-full min-w-0 flex-1 overflow-hidden rounded-2xl md:h-[340px]">
          <Image
            src="/home-picture.png"
            alt="Equipos RAM Informatica: celulares, notebooks, audio y mas"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
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
            {config.installmentsEnabled
              ? `Hasta ${config.maxInstallments} cuotas sin interés`
              : "Financiación disponible"}
          </div>
          <div className="text-sm text-body-text">
            {config.announcement ||
              "En MacBooks, celulares y TVs seleccionados. Elegí el plan en el checkout."}
          </div>
        </div>
        <Link
          href="/catalogo"
          className="shrink-0 rounded-[9px] bg-primary px-[22px] py-3 text-sm font-semibold whitespace-nowrap text-white no-underline hover:bg-primary-dark hover:no-underline!"
        >
          Ver productos en cuotas
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
