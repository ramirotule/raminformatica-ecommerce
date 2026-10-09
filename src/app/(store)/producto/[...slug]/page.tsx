"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ColorSwatches } from "@/components/ColorSwatches";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { QuantitySelector } from "@/components/QuantitySelector";
import { ShareButton } from "@/components/ShareButton";
import { ArsPrice } from "@/components/ArsPrice";
import { productMeta, starsFor } from "@/lib/format";
import {
  getRelatedProducts,
  productHref,
  productSpecs,
  reviewsData,
} from "@/lib/products";
import { useCurrency } from "@/hooks/useCurrency";
import { useCartStore } from "@/store/cart-store";
import { useCatalogStore } from "@/store/catalog-store";
import { useCategoriesStore } from "@/store/categories-store";
import { useCheckoutStore } from "@/store/checkout-store";

/**
 * Rutas soportadas:
 * - /producto/macbooks/173  (canónica)
 * - /producto/173           (legacy → redirect)
 */
export default function ProductoPage() {
  const params = useParams<{ slug?: string[] }>();
  const router = useRouter();
  const slug = useMemo(
    () => (Array.isArray(params.slug) ? params.slug : []),
    [params.slug],
  );

  const categoriaFromUrl = slug.length >= 2 ? slug[0] : null;
  const idFromUrl = slug.length >= 2 ? slug[1] : slug[0];

  const { formatPrice } = useCurrency();
  const products = useCatalogStore((s) => s.products);
  const hydrated = useCatalogStore((s) => s.hydrated);
  const categories = useCategoriesStore((s) => s.categories);
  const product = products.find((p) => p.id === Number(idFromUrl));
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const resetCheckout = useCheckoutStore((s) => s.resetCheckout);

  useEffect(() => {
    if (!hydrated || !product) return;
    const canonical = productHref(product);
    // Legacy /producto/173 o categoría incorrecta
    if (slug.length === 1 || categoriaFromUrl !== product.category) {
      router.replace(canonical);
    }
  }, [hydrated, product, slug.length, categoriaFromUrl, router]);

  if (!hydrated) {
    return (
      <div className="py-16 text-center text-sm text-muted">Cargando…</div>
    );
  }

  if (!product) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-muted">Producto no encontrado.</p>
        <Link href="/catalogo" className="font-semibold">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  // Mientras redirige legacy / categoría incorrecta
  if (slug.length === 1 || categoriaFromUrl !== product.category) {
    return (
      <div className="py-16 text-center text-sm text-muted">Redirigiendo…</div>
    );
  }

  const meta = productMeta(product, formatPrice);
  const related = getRelatedProducts(product, 4, products);
  const categoryName =
    categories.find((c) => c.id === product.category)?.name ??
    meta.categoryLabel ??
    product.category;

  const isTester = product.tags?.some((tag) => tag.toLowerCase() === "tester") ?? false;
  const warranty = isTester ? "1 mes" : "6 meses";
  const specs = [
    ...(product.ram ? [{ k: "Memoria RAM", v: product.ram }] : []),
    ...(product.storage ? [{ k: "Almacenamiento", v: product.storage }] : []),
    ...(product.colors?.length
      ? [{ k: "Colores", v: product.colors.join(" · ") }]
      : []),
    ...productSpecs.filter((s) => s.k !== "Garantía"),
    { k: "Garantía", v: warranty },
  ];

  const onAddToCart = () => {
    void addItem(product.id, qty);
  };
  const onBuyNow = () => {
    void addItem(product.id, qty).then(() => {
      resetCheckout();
      router.push("/checkout");
    });
  };

  return (
    <>
      <div className="pt-5 text-[13px] text-muted-soft">
        <Link href="/" className="text-muted-soft">
          Inicio
        </Link>{" "}
        /{" "}
        <Link href="/catalogo" className="text-muted-soft">
          Catálogo
        </Link>{" "}
        /{" "}
        <Link
          href={`/catalogo?categoria=${encodeURIComponent(product.category)}`}
          className="text-muted-soft"
        >
          {categoryName}
        </Link>{" "}
        / <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-12 py-6 lg:grid-cols-[1fr_minmax(520px,580px)]">
        <div>
          <ProductGallery product={product} />
        </div>

        <div>
          <div className="mb-2 text-xs font-bold tracking-wide text-primary uppercase">
            {meta.categoryLabel}
          </div>
          <div className="mb-2.5 flex items-center gap-3">
            <h1 className="text-[27px] leading-tight font-bold tracking-tight">
              {product.name}
            </h1>
            {product.tags?.some((tag) => tag.toLowerCase() === "tester") && (
              <span className="inline-block rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-muted">
                TESTER
              </span>
            )}
          </div>
          <div className="mb-[18px] text-sm text-muted">
            {meta.stars} · {product.reviews} reseñas
          </div>

          {(product.ram || product.storage) && (
            <div className="mb-5 flex flex-wrap gap-2 text-[13px]">
              {product.ram && (
                <span className="rounded-lg border border-border bg-accent-soft px-2.5 py-1 font-semibold text-foreground">
                  RAM {product.ram}
                </span>
              )}
              {product.storage && (
                <span className="rounded-lg border border-border bg-accent-soft px-2.5 py-1 font-semibold text-foreground">
                  {product.storage}
                </span>
              )}
            </div>
          )}

          <div className="flex items-baseline gap-3">
            <div className="text-[30px] font-bold">{meta.fmtPrice}</div>
            {meta.fmtOldPrice && (
              <>
                <div className="text-base text-muted-soft line-through">
                  {meta.fmtOldPrice}
                </div>
                <div className="text-[13px] font-bold text-sale">
                  -{meta.discountPct}%
                </div>
              </>
            )}
          </div>
          <ArsPrice amount={product.price} className="mb-1.5 text-sm" />
          <div className="mb-[22px] flex flex-wrap items-center gap-2">
            <div
              className={`inline-block rounded-[7px] px-3 py-1.5 text-[12.5px] font-bold ${
                meta.inStock
                  ? "bg-success-soft text-success"
                  : "bg-danger-soft text-sale"
              }`}
            >
              {meta.label}
            </div>
          </div>
          <div className="mb-[22px] h-px bg-border" />

          {meta.inStock ? (
            <>
              <div className="mb-4 flex flex-nowrap items-center gap-4">
                <QuantitySelector
                  value={qty}
                  onDec={() => setQty((q) => Math.max(1, q - 1))}
                  onInc={() => setQty((q) => q + 1)}
                />
                {product.colors?.length > 0 && (
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="shrink-0 text-[11px] font-bold tracking-wide text-muted uppercase">
                      Colores
                    </span>
                    <ColorSwatches
                      colors={product.colors}
                      size="md"
                      showLabels
                      className="min-w-0"
                    />
                  </div>
                )}
              </div>
              <div className="mb-3.5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onAddToCart}
                  className="cursor-pointer rounded-[9px] border-none bg-primary-soft px-5 py-3 text-[14px] font-bold text-primary-dark"
                >
                  Agregar al carrito
                </button>
                <button
                  type="button"
                  onClick={onBuyNow}
                  className="cursor-pointer rounded-[9px] border-none bg-primary px-5 py-3 text-[14px] font-bold text-white"
                >
                  Comprar ahora
                </button>
                <Link
                  href={`/simulador?producto=${encodeURIComponent(String(product.id))}`}
                  className="shrink-0 rounded-[9px] border border-primary bg-surface px-5 py-3 text-[14px] font-bold text-primary no-underline hover:!no-underline"
                >
                  Simular financiación
                </Link>
                <ShareButton title={product.name} className="shrink-0" />
              </div>
            </>
          ) : (
            <>
              {product.colors?.length > 0 && (
                <div className="mb-4 flex flex-nowrap items-center gap-2.5">
                  <span className="shrink-0 text-[11px] font-bold tracking-wide text-muted uppercase">
                    Colores
                  </span>
                  <ColorSwatches colors={product.colors} size="md" showLabels />
                </div>
              )}
              <div className="mb-3.5">
                <ShareButton title={product.name} />
              </div>
            </>
          )}
          <div className="text-[12.5px] text-muted">
            Envío a todo el país · Garantía oficial {warranty}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 py-7 lg:grid-cols-[1fr_minmax(520px,580px)]">
        <div>
          <h3 className="mb-3 text-base font-bold">Descripción</h3>
          <p className="mb-6 text-[14.5px] leading-relaxed text-body-text">
            {product.description}
          </p>
          <h3 className="mb-3 text-base font-bold">Especificaciones</h3>
          <div className="overflow-hidden rounded-[10px] border border-border">
            {specs.map((s, i) => (
              <div
                key={`${s.k}-${i}`}
                className={`flex px-4 py-3 text-[13.5px] ${
                  i < specs.length - 1 ? "border-b border-border-soft" : ""
                }`}
              >
                <div className="w-40 shrink-0 text-muted">{s.k}</div>
                <div className="font-medium">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div />
      </div>

      <div className="py-3 pb-10">
        <h3 className="mb-4 text-base font-bold">Reseñas de clientes</h3>
        <div className="flex max-w-[640px] flex-col gap-4">
          {reviewsData.map((r) => (
            <div
              key={r.name}
              className="rounded-[10px] border border-border p-4"
            >
              <div className="mb-1.5 flex justify-between">
                <div className="text-[13.5px] font-bold">{r.name}</div>
                <div className="text-xs text-muted-soft">{r.date}</div>
              </div>
              <div className="mb-2 text-[13px] text-success">
                {starsFor(r.rating)}
              </div>
              <div className="text-[13.5px] leading-relaxed text-body-text">
                {r.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {related.length > 0 && (
        <div className="border-t border-border py-2 pb-14">
          <h3 className="mt-8 mb-[18px] text-lg font-bold">
            También te puede interesar
          </h3>
          <div className="grid grid-cols-2 gap-[18px] lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} variant="compact" />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
