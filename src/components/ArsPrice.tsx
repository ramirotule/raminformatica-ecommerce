"use client";

import { useCurrency } from "@/hooks/useCurrency";

/** Equivalente en pesos (dólar blue venta), chico y en color primario. */
export function ArsPrice({
  amount,
  className = "text-[12.5px]",
}: {
  amount: number;
  className?: string;
}) {
  const { formatArs } = useCurrency();
  const text = formatArs(amount);
  if (!text) return null;
  return (
    <div className={`font-semibold tabular-nums text-primary ${className}`}>
      {text}
    </div>
  );
}
