"use client";

import Image from "next/image";
import type { Product } from "@/lib/products";
import { productImages } from "@/lib/products";
import { CategoryPlaceholder } from "@/components/CategoryIcon";
import { productMeta } from "@/lib/format";

type Props = {
  product: Product;
  label?: string;
  className?: string;
  priority?: boolean;
  /** next/image `sizes` — defaults for catalog cards */
  sizes?: string;
  showDiscount?: boolean;
};

export function ProductImage({
  product,
  label,
  className = "",
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  showDiscount = true,
}: Props) {
  const meta = productMeta(product);
  const alt = label ?? product.name;
  const src = productImages(product)[0] ?? null;

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-white font-mono text-[11px] text-muted-soft ${className}`}
    >
      {showDiscount && meta.discountPct != null && (
        <span className="absolute top-2.5 left-2.5 z-10 rounded-md bg-sale px-2 py-0.5 text-[11px] font-bold text-white">
          -{meta.discountPct}%
        </span>
      )}
      {src ? (
        <span className="absolute inset-2">
          <span className="relative block h-full w-full">
            <Image
              src={src}
              alt={alt}
              fill
              priority={priority}
              sizes={sizes}
              className="object-contain object-center"
              style={{ objectFit: "contain", objectPosition: "center" }}
            />
          </span>
        </span>
      ) : (
        <CategoryPlaceholder category={product.category} />
      )}
    </div>
  );
}
