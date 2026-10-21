import type { Product } from "@/lib/products";
import { normalizeKey } from "@/lib/admin/bulk-products";
import { salePriceFromCost } from "@/lib/format";
import { normalizeProductName } from "@/lib/product-name";

export type SupplierPasteEntry = {
  lineNumber: number;
  section: string;
  name: string;
  nameKey: string;
  cost: number;
  tags: string[];
  tagKeys: string[];
  rawLine: string;
};

export type SupplierMatchAction =
  | "update_cost"
  | "activate"
  | "unchanged"
  | "deactivate"
  | "unmatched_paste";

export type SupplierMatchRow = {
  action: SupplierMatchAction;
  entry?: SupplierPasteEntry;
  product?: Product;
  nextCost?: number | null;
  nextPrice?: number;
  nextTags?: string[];
  nextActive?: boolean;
  reason: string;
};

function parseSupplierPrice(raw: string): number | null {
  let cleaned = raw.replace(/\$/g, "").replace(/\s/g, "").replace(/[^\d.,]/g, "");
  if (!cleaned) return null;

  // 1.270 / 12.345.678 → miles
  if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    return Number(cleaned.replace(/\./g, ""));
  }
  if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function cleanProductName(raw: string): string {
  return raw
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTagsLine(line: string): string[] {
  const t = line.trim();
  if (!t) return [];
  return [
    ...new Set(
      t
        .split(/\s*[-–—|/]\s*/)
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  ];
}

function tagKey(tag: string): string {
  return normalizeKey(tag.replace(/\(.*?\)/g, ""));
}

const PRODUCT_LINE =
  /^[\s▪️•●*\-–—]+(.+?)\s*[-–—]\s*\$\s*([\d.,]+)\s*(.*)$/u;
const SECTION_LINE = /^[\s►▶>]+(.+)$/u;

/** Parsea el listado pegado del proveedor (▪️ producto - $ precio + línea de colores). */
export function parseSupplierPriceText(text: string): SupplierPasteEntry[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const entries: SupplierPasteEntry[] = [];
  let section = "";

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (SECTION_LINE.test(trimmed) && !PRODUCT_LINE.test(trimmed)) {
      const m = trimmed.match(SECTION_LINE);
      section = (m?.[1] ?? trimmed).trim();
      continue;
    }

    const match = trimmed.match(PRODUCT_LINE);
    if (!match) continue;

    const name = cleanProductName(match[1] ?? "");
    const cost = parseSupplierPrice(match[2] ?? "");
    if (!name || cost == null || cost < 0) continue;

    let tags: string[] = [];
    const sameLineNote = (match[3] ?? "").trim();
    // Notas en la misma línea (🔥, S/CARG) no son tags; los tags van en la siguiente.
    const next = (lines[i + 1] ?? "").trim();
    if (
      next &&
      !PRODUCT_LINE.test(next) &&
      !SECTION_LINE.test(next) &&
      !/^\$/.test(next)
    ) {
      tags = parseTagsLine(next);
      i += 1;
    } else if (sameLineNote && /[-–—|/]/.test(sameLineNote)) {
      // p.ej. BLACK/WHITE en la misma línea tras el precio
      tags = parseTagsLine(sameLineNote.replace(/[\u{1F300}-\u{1FAFF}]/gu, ""));
    }

    entries.push({
      lineNumber: i + 1,
      section,
      name,
      nameKey: normalizeKey(name),
      cost,
      tags,
      tagKeys: tags.map(tagKey).filter(Boolean),
      rawLine: trimmed,
    });
  }

  return entries;
}

function tagOverlapScore(product: Product, entry: SupplierPasteEntry): number {
  const productKeys = (product.colors?.length ? product.colors : product.tags ?? [])
    .map(tagKey)
    .filter(Boolean);
  if (productKeys.length === 0 && entry.tagKeys.length === 0) return 1;
  if (entry.tagKeys.length === 0) return 0;
  if (productKeys.length === 0) return 0;
  let hits = 0;
  for (const k of entry.tagKeys) {
    if (productKeys.includes(k)) hits += 1;
  }
  return hits;
}

function pickBestProduct(
  candidates: Product[],
  entry: SupplierPasteEntry,
  usedIds: Set<number>,
): Product | null {
  const available = candidates.filter((p) => !usedIds.has(p.id));
  if (available.length === 0) return null;
  if (available.length === 1) return available[0] ?? null;

  let best: Product | null = null;
  let bestScore = -1;
  for (const p of available) {
    const score = tagOverlapScore(p, entry);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  // Si hay varios y ninguno comparte tags, no forzar match ambiguo
  if (bestScore <= 0 && available.length > 1 && entry.tagKeys.length > 0) {
    return null;
  }
  return best;
}

/** Arma el plan: actualizar costos, activar matches y desactivar los que no están en el pegado. */
export function planSupplierPriceUpdate(
  products: Product[],
  entries: SupplierPasteEntry[],
): SupplierMatchRow[] {
  const byName = new Map<string, Product[]>();
  for (const p of products) {
    const key = normalizeKey(p.name);
    const list = byName.get(key) ?? [];
    list.push(p);
    byName.set(key, list);
  }

  const usedIds = new Set<number>();
  const rows: SupplierMatchRow[] = [];

  for (const entry of entries) {
    const candidates = byName.get(entry.nameKey) ?? [];
    const product = pickBestProduct(candidates, entry, usedIds);

    if (!product) {
      rows.push({
        action: "unmatched_paste",
        entry,
        reason: "No hay producto en el catálogo con ese nombre",
      });
      continue;
    }

    usedIds.add(product.id);
    const nextCost = entry.cost;
    const nextPrice = salePriceFromCost(nextCost, product.price);
    const nextColors = entry.tags.length > 0 ? entry.tags : product.colors;
    const costChanged = product.costPrice !== nextCost;
    const priceChanged = product.price !== nextPrice;
    const colorsChanged =
      entry.tags.length > 0 &&
      normalizeKey((product.colors ?? []).join("|")) !==
        normalizeKey(entry.tags.join("|"));
    const willActivate = !product.active;

    if (costChanged || priceChanged || colorsChanged || willActivate) {
      rows.push({
        action: costChanged || priceChanged ? "update_cost" : "activate",
        entry,
        product,
        nextCost,
        nextPrice,
        nextTags: nextColors,
        nextActive: true,
        reason: [
          costChanged
            ? `Costo ${product.costPrice ?? "—"} → ${nextCost}`
            : null,
          priceChanged ? `Venta ${product.price} → ${nextPrice}` : null,
          colorsChanged ? "Colores actualizados" : null,
          willActivate ? "Se activa" : null,
        ]
          .filter(Boolean)
          .join(" · "),
      });
    } else {
      rows.push({
        action: "unchanged",
        entry,
        product,
        nextCost,
        nextPrice,
        nextTags: nextColors,
        nextActive: true,
        reason: "Sin cambios",
      });
    }
  }

  for (const product of products) {
    if (usedIds.has(product.id)) continue;
    if (!product.active) {
      rows.push({
        action: "unchanged",
        product,
        reason: "Ya estaba inactivo y no está en el listado",
      });
      continue;
    }
    rows.push({
      action: "deactivate",
      product,
      nextActive: false,
      reason: "No está en el listado del proveedor → inactivo",
    });
  }

  return rows;
}

export function summarizeSupplierPlan(rows: SupplierMatchRow[]) {
  return {
    updateCost: rows.filter((r) => r.action === "update_cost").length,
    activate: rows.filter((r) => r.action === "activate").length,
    unchanged: rows.filter(
      (r) => r.action === "unchanged" && r.product,
    ).length,
    deactivate: rows.filter((r) => r.action === "deactivate").length,
    unmatchedPaste: rows.filter((r) => r.action === "unmatched_paste").length,
  };
}

/** Infiere marca/categoría para crear un producto desde el listado del proveedor. */
export function inferBrandAndCategory(entry: SupplierPasteEntry): {
  brand: string;
  category: string;
} {
  const hay = normalizeKey(`${entry.section} ${entry.name}`);

  if (
    hay.includes("iphone") ||
    hay.includes("ipad") ||
    hay.includes("macbook") ||
    hay.includes("airpods") ||
    hay.includes("airtag") ||
    hay.includes("apple") ||
    (hay.includes("watch") && !hay.includes("smart"))
  ) {
    if (hay.includes("macbook")) return { brand: "Apple", category: "macbooks" };
    if (hay.includes("iphone")) return { brand: "Apple", category: "celulares" };
    return { brand: "Apple", category: "gadgets" };
  }
  if (hay.includes("samsung")) {
    if (hay.includes("tablet"))
      return { brand: "Samsung", category: "gadgets" };
    if (
      hay.includes("tv") ||
      hay.includes("qled") ||
      hay.includes("uhd") ||
      /\d{2,3}(pulg|inch)?/.test(hay)
    ) {
      // solo si parece TV (pulgadas / smart tv)
      if (hay.includes("tv") || hay.includes("qled") || hay.includes("neo")) {
        return { brand: "Samsung", category: "televisores" };
      }
    }
    if (hay.includes("cargador")) return { brand: "Samsung", category: "gadgets" };
    return { brand: "Samsung", category: "celulares" };
  }
  if (hay.includes("motorola")) return { brand: "Motorola", category: "celulares" };
  if (hay.includes("infinix")) return { brand: "Infinix", category: "celulares" };
  if (hay.includes("xiaomi") || hay.includes("redmi") || hay.includes("poco")) {
    return { brand: "Xiaomi", category: "celulares" };
  }
  if (hay.includes("jbl")) return { brand: "JBL", category: "audio" };
  if (hay.includes("xbox")) return { brand: "Microsoft", category: "videojuego" };
  if (hay.includes("nintendo")) return { brand: "Nintendo", category: "videojuego" };
  if (
    hay.includes("playstation") ||
    hay.includes("joystick") ||
    hay.includes("ps5") ||
    hay.includes("volante") ||
    hay.includes("logitech")
  ) {
    return {
      brand: hay.includes("logitech") ? "Logitech" : "Sony",
      category: "videojuego",
    };
  }
  if (
    hay.includes("tv") ||
    hay.includes("tcl") ||
    hay.includes("philips") ||
    hay.includes("noblex") ||
    hay.includes("hisense") ||
    hay.includes("aoc") ||
    hay.includes("rca")
  ) {
    let brand = "TV";
    if (hay.includes("samsung")) brand = "Samsung";
    else if (hay.includes("tcl")) brand = "TCL";
    else if (hay.includes("philips")) brand = "Philips";
    else if (hay.includes("noblex")) brand = "Noblex";
    else if (hay.includes("hisense")) brand = "Hisense";
    else if (hay.includes("aoc")) brand = "AOC";
    else if (hay.includes("rca")) brand = "RCA";
    return { brand, category: "televisores" };
  }

  return { brand: "Genérico", category: "gadgets" };
}

/** Payload listo para addProduct a partir de una línea sin match. */
export function productInputFromSupplierEntry(entry: SupplierPasteEntry) {
  const { brand, category } = inferBrandAndCategory(entry);
  const name = normalizeProductName(entry.name);
  const costPrice = entry.cost;
  const price = salePriceFromCost(costPrice, 0);
  const { ram, storage } = parseRamStorageFromName(entry.name);
  return {
    name,
    brand,
    category,
    subcategory: "",
    provider: "",
    costPrice,
    price,
    oldPrice: null as number | null,
    stock: 1,
    installments: "Hasta 6 cuotas sin interés",
    description: entry.section
      ? `${name} · ${entry.section}`
      : name,
    tags: [] as string[],
    colors: entry.tags,
    ram,
    storage,
    imageUrl: null as string | null,
    imageUrls: [] as string[],
    active: true,
    featured: false,
  };
}

function parseRamStorageFromName(name: string): { ram: string; storage: string } {
  const combo = name.match(/(\d+)\s*\/\s*(\d+)\s*(GB|TB)/i);
  if (combo) {
    return {
      ram: `${combo[1]} GB`,
      storage: `${combo[2]} ${combo[3]!.toUpperCase()}`,
    };
  }
  const only = name.match(/\b(\d+)\s*(GB|TB)\b/i);
  if (only) {
    return { ram: "", storage: `${only[1]} ${only[2]!.toUpperCase()}` };
  }
  return { ram: "", storage: "" };
}
