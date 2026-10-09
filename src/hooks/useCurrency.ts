"use client";

import {
  currencyPrefix,
  formatAmount,
  formatPrice as formatPriceRaw,
  normalizeCurrency,
  type CurrencyCode,
} from "@/lib/format";
import { useFxStore } from "@/store/fx-store";
import { useStoreConfig } from "@/store/store-config";

/**
 * Convierte un monto de la moneda base de la tienda a la moneda de visualización
 * usando dólar blue venta (DolarAPI).
 * Los precios de venta del catálogo se tratan como USD.
 */
export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  blueVenta: number | null,
): number {
  if (!Number.isFinite(amount)) return 0;
  if (from === to) return Math.round(amount);
  if (!blueVenta || blueVenta <= 0) return Math.round(amount);
  if (from === "USD" && to === "ARS") return Math.round(amount * blueVenta);
  if (from === "ARS" && to === "USD") return Math.round(amount / blueVenta);
  return Math.round(amount);
}

/**
 * Los precios se muestran siempre en US$; `formatArs` da el equivalente en
 * pesos según dólar blue venta para mostrarlo aparte, más chico.
 */
export function useCurrency() {
  const blueVenta = useFxStore((s) => s.blueVenta);
  const currency: CurrencyCode = "USD";

  const toDisplay = (n: number) => Math.round(n);

  const formatPrice = (n: number) => formatPriceRaw(toDisplay(n), currency);

  /** Equivalente en pesos ("$AR 2.310.000"), o null si no hay cotización. */
  const formatArs = (n: number) =>
    blueVenta && blueVenta > 0 ? `$ ${formatAmount(n * blueVenta)}` : null;

  return {
    /** Moneda en la que se muestran los precios al visitante. */
    currency,
    /** Moneda base de los precios guardados en el catálogo. */
    storeCurrency: currency,
    blueVenta,
    prefix: currencyPrefix(currency),
    toDisplay,
    formatPrice,
    formatArs,
  };
}

/** Moneda de configuración de la tienda (sin conversión FX). Para admin. */
export function useStoreCurrency() {
  const raw = useStoreConfig((s) => s.config.currency);
  const currency: CurrencyCode = normalizeCurrency(raw);

  return {
    currency,
    prefix: currencyPrefix(currency),
    formatPrice: (n: number) => formatPriceRaw(n, currency),
  };
}
