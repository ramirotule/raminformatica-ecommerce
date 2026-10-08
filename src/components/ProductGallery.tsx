"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { CategoryPlaceholder } from "@/components/CategoryIcon";
import type { Product } from "@/lib/products";
import { productImages } from "@/lib/products";
import { productMeta } from "@/lib/format";

type Props = {
  product: Product;
  className?: string;
};

function FitImage({
  src,
  alt,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className="object-contain object-center"
      style={{ objectFit: "contain", objectPosition: "center" }}
    />
  );
}

export function ProductGallery({ product, className = "" }: Props) {
  const images = productImages(product);
  const meta = productMeta(product);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setActive(0);
  }, [product.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") {
        setActive((i) => (images.length ? (i + 1) % images.length : 0));
      }
      if (e.key === "ArrowLeft") {
        setActive((i) =>
          images.length ? (i - 1 + images.length) % images.length : 0,
        );
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, images.length]);

  const current = images[active] ?? null;
  const hasMany = images.length > 1;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => current && setOpen(true)}
        disabled={!current}
        className="relative block h-[320px] w-full cursor-zoom-in overflow-hidden rounded-[14px] border border-border bg-white p-0 text-left disabled:cursor-default md:h-[420px]"
        aria-label={
          current
            ? `Ver fotos de ${product.name}`
            : `Sin imagen de ${product.name}`
        }
      >
        {meta.discountPct != null && (
          <span className="absolute top-2.5 left-2.5 z-10 rounded-md bg-sale px-2 py-0.5 text-[11px] font-bold text-white">
            -{meta.discountPct}%
          </span>
        )}
        {current ? (
          <span className="absolute inset-3 md:inset-5">
            <span className="relative block h-full w-full">
              <FitImage
                src={current}
                alt={product.name}
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            </span>
          </span>
        ) : (
          <CategoryPlaceholder category={product.category} />
        )}
        {current && (
          <span className="absolute right-3 bottom-3 z-10 rounded-md bg-foreground/70 px-2.5 py-1 text-[11px] font-semibold text-white">
            {hasMany
              ? `${active + 1}/${images.length} · Ver galería`
              : "Ampliar"}
          </span>
        )}
      </button>

      {hasMany && (
        <div className="mt-3 grid grid-cols-4 gap-2.5 sm:grid-cols-5">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-square overflow-hidden rounded-[10px] border bg-white p-0 ${
                i === active
                  ? "border-primary ring-1 ring-primary"
                  : "border-border"
              }`}
              aria-label={`Foto ${i + 1}`}
              aria-current={i === active}
            >
              <span className="absolute inset-1.5">
                <span className="relative block h-full w-full">
                  <FitImage src={src} alt="" sizes="100px" />
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {open && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex max-h-[min(92vh,900px)] w-full max-w-4xl flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id={titleId}
                className="truncate text-sm font-semibold text-foreground"
              >
                {product.name}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-md border border-border bg-accent-soft px-3 py-1.5 text-sm font-semibold text-foreground"
              >
                Cerrar
              </button>
            </div>

            <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-xl bg-white">
              <span className="absolute inset-4">
                <span className="relative block h-full w-full">
                  <FitImage
                    src={current}
                    alt={`${product.name} — foto ${active + 1}`}
                    sizes="900px"
                    priority
                  />
                </span>
              </span>
              {hasMany && (
                <>
                  <button
                    type="button"
                    aria-label="Foto anterior"
                    onClick={() =>
                      setActive(
                        (i) => (i - 1 + images.length) % images.length,
                      )
                    }
                    className="absolute top-1/2 left-2 z-10 -translate-y-1/2 cursor-pointer rounded-full border border-border bg-surface px-3 py-2 text-lg font-bold text-foreground shadow-sm"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Foto siguiente"
                    onClick={() =>
                      setActive((i) => (i + 1) % images.length)
                    }
                    className="absolute top-1/2 right-2 z-10 -translate-y-1/2 cursor-pointer rounded-full border border-border bg-surface px-3 py-2 text-lg font-bold text-foreground shadow-sm"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {hasMany && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={`modal-${src}-${i}`}
                    type="button"
                    onClick={() => setActive(i)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white p-0 ${
                      i === active
                        ? "border-primary ring-1 ring-primary"
                        : "border-border opacity-80"
                    }`}
                  >
                    <span className="absolute inset-1">
                      <span className="relative block h-full w-full">
                        <FitImage src={src} alt="" sizes="64px" />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
