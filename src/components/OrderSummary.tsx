"use client";

import { ArsPrice } from "@/components/ArsPrice";
import { useCurrency } from "@/hooks/useCurrency";
import { useCartStore } from "@/store/cart-store";

type Props = {
  title?: string;
  action?: React.ReactNode;
};

export function OrderSummary({ title = "Resumen", action }: Props) {
  const { formatPrice } = useCurrency();
  const subtotal = useCartStore((s) => s.subtotal());
  const shipping = useCartStore((s) => s.shipping());
  const total = useCartStore((s) => s.total());

  return (
    <div className="sticky top-[90px] rounded-xl border border-border bg-surface p-[22px]">
      <div className="mb-4 text-[15px] font-bold">{title}</div>
      <div className="mb-2.5 flex justify-between text-sm text-body-text">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="mb-3.5 flex justify-between gap-3 text-sm text-body-text">
        <span>Envío</span>
        <span className="text-right text-muted">
          {shipping === 0 ? "A cargo del comprador" : formatPrice(shipping)}
        </span>
      </div>
      <div className="mb-3.5 h-px bg-border" />
      <div className={`flex justify-between text-[17px] font-bold ${action ? "mb-5" : ""}`}>
        <span>Total</span>
        <span className="text-right">
          {formatPrice(total)}
          <ArsPrice amount={total} className="text-[12.5px]" />
        </span>
      </div>
      {action}
    </div>
  );
}
