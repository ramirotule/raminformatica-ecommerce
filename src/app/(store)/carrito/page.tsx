"use client";

import Link from "next/link";
import { OrderSummary } from "@/components/OrderSummary";
import { ProductImage } from "@/components/ProductImage";
import { QuantitySelector } from "@/components/QuantitySelector";
import { ArsPrice } from "@/components/ArsPrice";
import { productMeta } from "@/lib/format";
import { useCurrency } from "@/hooks/useCurrency";
import { useCartStore } from "@/store/cart-store";
import { useCatalogStore } from "@/store/catalog-store";
import { useCheckoutStore } from "@/store/checkout-store";

export default function CarritoPage() {
  const { formatPrice } = useCurrency();
  const items = useCartStore((s) => s.items);
  const products = useCatalogStore((s) => s.products);
  const changeQty = useCartStore((s) => s.changeQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const resetCheckout = useCheckoutStore((s) => s.resetCheckout);

  return (
    <>
      <h1 className="m-0 py-7 pb-5 text-2xl font-bold">Tu carrito</h1>

      {items.length === 0 ? (
        <div className="py-20 text-center text-muted">
          <div className="mb-4 text-[15px]">Tu carrito está vacío.</div>
          <Link
            href="/catalogo"
            className="inline-block rounded-[9px] bg-primary px-[22px] py-3 text-sm font-semibold text-white no-underline hover:no-underline!"
          >
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-9 pb-[60px] lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-3.5">
            {items.map((c) => {
              const product = products.find((p) => p.id === c.id);
              if (!product) return null;
              const meta = productMeta(product, formatPrice);
              return (
                <div
                  key={c.id}
                  className="flex flex-col items-stretch gap-4 rounded-xl border border-border bg-surface p-3.5 sm:flex-row sm:items-center sm:gap-4"
                >
                  <ProductImage
                    product={product}
                    className="h-[88px] w-[88px] shrink-0 rounded-lg"
                    sizes="88px"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold text-muted uppercase">
                      {meta.categoryLabel}
                    </div>
                    <div className="my-0.5 text-[14.5px] font-semibold">
                      {product.name}
                    </div>
                    <div className="text-[13px] text-muted">
                      {meta.fmtPrice} c/u
                    </div>
                  </div>
                  <QuantitySelector
                    size="sm"
                    value={c.qty}
                    onDec={() => void changeQty(c.id, -1)}
                    onInc={() => void changeQty(c.id, 1)}
                  />
                  <div className="w-[140px] text-right">
                    <div className="text-[15px] font-bold">
                      {formatPrice(product.price * c.qty)}
                    </div>
                    <ArsPrice amount={product.price * c.qty} className="text-[11.5px]" />
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeItem(c.id)}
                    className="cursor-pointer border-none bg-transparent text-[12.5px] font-semibold text-sale"
                  >
                    Quitar
                  </button>
                </div>
              );
            })}
          </div>

          <OrderSummary
            action={
              <Link
                href="/checkout"
                onClick={() => resetCheckout()}
                className="block w-full rounded-[9px] bg-primary py-3.5 text-center text-[14.5px] font-bold !text-white no-underline hover:!text-white hover:!no-underline"
              >
                Iniciar compra
              </Link>
            }
          />
        </div>
      )}
    </>
  );
}
