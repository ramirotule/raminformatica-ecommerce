import type { Product } from "./products";
import { categoryLabels } from "./products";

export type CurrencyCode = "ARS" | "USD";

export function normalizeCurrency(value: string | undefined | null): CurrencyCode {
  // Default de tienda: US$. Solo ARS si está elegido explícitamente.
  return value === "ARS" ? "ARS" : "USD";
}

export function currencyPrefix(currency: CurrencyCode): string {
  return currency === "ARS" ? "$" : "US$";
}

export function currencyLabel(currency: CurrencyCode): string {
  return currency === "ARS" ? "Pesos ($)" : "Dólares (US$)";
}

/** Entero con separador de miles estilo es-AR (1.234.567). */
export function formatAmount(n: number): string {
  const safe = Number.isFinite(n) ? Math.round(Math.abs(n)) : 0;
  return safe.toLocaleString("es-AR");
}

export function formatPrice(n: number, currency: CurrencyCode = "USD"): string {
  return `${currencyPrefix(currency)} ${formatAmount(n)}`;
}

/**
 * Precio de venta desde costo:
 * (precio_costo / 0.87) + 30, redondeado hacia arriba al múltiplo de 5.
 */
export function salePriceFromCost(
  nextCost: number | null,
  previousSale = 0,
): number {
  if (nextCost == null || nextCost <= 0) return previousSale;
  const raw = nextCost / 0.87 + 30;
  return Math.ceil(raw / 5) * 5;
}

/** Extrae solo dígitos del input y devuelve el número entero. */
export function parseMoneyInput(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits);
}

/** Formatea el valor tipado en vivo (solo dígitos → miles). */
export function formatMoneyInputValue(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return formatAmount(Number(digits));
}

export function starsFor(rating: number) {
  const r = Math.round(rating);
  return "★".repeat(r) + "☆".repeat(5 - r);
}

export function discountPct(product: Product) {
  if (!product.oldPrice) return null;
  return Math.round((1 - product.price / product.oldPrice) * 100);
}

export function stockInfo(product: Product) {
  const inStock = product.stock > 0;
  return {
    inStock,
    label: inStock ? "Disponible" : "Agotado",
  };
}

export function productMeta(
  product: Product,
  /** Formatea un monto base (USD tienda) para mostrarlo al visitante. */
  fmt: (amount: number) => string = (n) => formatPrice(n, "USD"),
) {
  const discount = discountPct(product);
  const stock = stockInfo(product);
  return {
    categoryLabel: categoryLabels[product.category],
    stars: starsFor(product.rating),
    fmtPrice: fmt(product.price),
    fmtOldPrice: product.oldPrice ? fmt(product.oldPrice) : null,
    discountPct: discount,
    ...stock,
  };
}

export function calcShipping(subtotal: number) {
  if (subtotal === 0 || subtotal > 500000) return 0;
  return 15000;
}

/** Agrupa dígitos de a 3: "273935095" → "273 935 095". */
function groupPhoneDigits(digits: string): string {
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 3) {
    parts.push(digits.slice(i, i + 3));
  }
  return parts.join(" ");
}

/**
 * Formato de teléfono AR para display: (011) 273 935 095
 * Si no parece un número (p.ej. un nombre de contacto), lo deja igual.
 */
export function formatPhoneDisplay(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  let digits = trimmed.replace(/\D/g, "");
  if (digits.length < 6) return trimmed;

  // +54 / 54 país
  if (digits.startsWith("54") && digits.length >= 12) {
    digits = digits.slice(2);
  }
  // 9 de móvil internacional (54911…)
  if (digits.startsWith("9") && digits.length >= 11) {
    digits = digits.slice(1);
  }

  let area = "";
  let local = digits;

  if (digits.startsWith("011")) {
    area = "011";
    local = digits.slice(3);
  } else if (digits.startsWith("0") && digits.length >= 10) {
    // Códigos de área de 4 dígitos: 0221, 0341, etc.
    area = digits.slice(0, 4);
    local = digits.slice(4);
  } else if (!digits.startsWith("0") && digits.length >= 8) {
    // Sin 0: 11XXXXXXXX → (11) …
    area = digits.slice(0, 2);
    local = digits.slice(2);
  }

  if (!area) return groupPhoneDigits(digits);
  if (!local) return `(${area})`;
  return `(${area}) ${groupPhoneDigits(local)}`;
}
