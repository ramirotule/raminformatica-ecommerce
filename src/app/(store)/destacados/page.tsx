"use client";

import Link from "next/link";
import { ArsPrice } from "@/components/ArsPrice";
import { ProductImage } from "@/components/ProductImage";
import { useCurrency } from "@/hooks/useCurrency";
import { whatsappHref } from "@/lib/social";
import { richTextToPlain } from "@/lib/rich-text";
import { productHref } from "@/lib/products";
import { useCatalogStore } from "@/store/catalog-store";
import { useStoreConfig } from "@/store/store-config";

function buildFeaturedReason(index: number, usageType?: string) {
  const reasons = [
    "Elegido por su equilibrio entre rendimiento y precio.",
    "Uno de los productos con mejor respuesta de clientes.",
    "Se destaca por innovación y calidad de construcción.",
    "Recomendado para quienes buscan una compra segura.",
  ];
  if (usageType) {
    return `Recomendado para perfil ${usageType.toLowerCase()} por su rendimiento y confiabilidad.`;
  }
  return reasons[index % reasons.length];
}

function shortReview(description: string) {
  const plain = richTextToPlain(description).replace(/\s+/g, " ").trim();
  if (!plain) return "Producto destacado por su calidad y performance.";
  return plain.length > 170 ? `${plain.slice(0, 167)}...` : plain;
}

function stockLabel(stock: number) {
  if (stock <= 0) return "Sin stock por el momento";
  if (stock <= 3) return `Ultimas ${stock} unidades`;
  return "Stock disponible inmediato";
}

export default function DestacadosPage() {
  const products = useCatalogStore((s) => s.products);
  const supportPhone = useStoreConfig((s) => s.config.supportPhone);
  const { formatPrice } = useCurrency();
  const featured = products.filter((p) => p.featured);
  const showcase = featured;

  return (
    <section className="py-6 md:py-8">
      <div className="mb-6 text-[13px] text-muted-soft">
        <Link href="/" className="text-muted-soft">
          Inicio
        </Link>{" "}
        / <span className="text-foreground">Destacados</span>
      </div>

      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-[13px] font-bold tracking-wider text-primary uppercase">
          Selección RAM
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
          Encontrá tu próximo equipo ideal
        </h1>
        <p className="text-sm leading-relaxed text-muted md:text-[15px]">
          Esta sección no es un listado más: seleccionamos productos por rendimiento,
          confiabilidad y valor real para cada tipo de uso. Revisalos, compará y
          aprovechá financiación.
        </p>
      </div>

      {showcase.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-14 text-center">
          <div className="text-base font-semibold text-foreground">
            No hay productos destacados
          </div>
          <p className="mt-1.5 text-sm text-muted">
            Cuando marques productos como destacados desde administración, se verán acá.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {showcase.map((product, index) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_20px_rgba(0,0,0,0.04)]"
            >
              <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
                <Link
                  href={productHref(product)}
                  className="block border-b border-border-soft no-underline hover:no-underline! md:border-r md:border-b-0"
                >
                  <ProductImage
                    product={product}
                    className="h-[230px] md:h-[260px]"
                    sizes="(max-width: 768px) 100vw, 320px"
                  />
                </Link>

                <div className="flex flex-col gap-3 p-5 md:p-6">
                  <div>
                    <div className="text-[11.5px] font-semibold tracking-wide text-muted uppercase">
                      {product.brand}
                    </div>
                    <h2 className="mt-1 text-xl font-bold md:text-2xl">
                      {product.name}
                    </h2>
                    <div className="mt-2 inline-flex items-center rounded-full bg-primary-softer px-2.5 py-1 text-[11px] font-bold text-primary-dark">
                      {stockLabel(product.stock)}
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-body-text">
                    {shortReview(product.description)}
                  </p>

                  <div className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground">
                    <span className="font-semibold">Por qué está destacado:</span>{" "}
                    {buildFeaturedReason(index, product.usageType)}
                  </div>

                  <div className="rounded-lg border border-border bg-surface px-3.5 py-2.5">
                    <div className="text-[12px] text-muted">Precio especial destacado</div>
                    <div className="mt-0.5 text-2xl leading-none font-bold text-foreground">
                      {formatPrice(product.price)}
                    </div>
                    <ArsPrice amount={product.price} className="mt-1 text-[12.5px]" />
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <Link
                      href={productHref(product)}
                      className="inline-flex rounded-[9px] bg-primary px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-primary-dark hover:no-underline!"
                    >
                      Ver producto
                    </Link>
                    <Link
                      href={`/simulador?producto=${product.id}`}
                      className="inline-flex rounded-[9px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground no-underline hover:bg-accent-soft hover:no-underline!"
                    >
                      Ver cuotas
                    </Link>
                    <a
                      href={whatsappHref(
                        supportPhone,
                        `Hola RAM Informática, me interesa el ${product.name}. ¿Me asesoran?`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-[9px] border border-success/35 bg-success-soft px-4 py-2.5 text-sm font-semibold text-success-dark no-underline hover:opacity-90 hover:no-underline!"
                    >
                      Consultar por WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
