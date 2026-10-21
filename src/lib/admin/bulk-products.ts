import {
  categoryLabels,
  type CategoryId,
} from "@/lib/products";
import { normalizeProductName } from "@/lib/product-name";
import type { ProductInput } from "@/store/catalog-store";

/** Encabezados de la plantilla de carga masiva (orden fijo). */
export const BULK_HEADERS = [
  "nombre",
  "marca",
  "categoria",
  "subcategoria",
  "proveedor",
  "descrip_prov",
  "precio_costo",
  "precio_venta",
  "stock",
  "imagenes",
  "activo",
  "destacado",
] as const;

/** @deprecated usar BULK_HEADERS */
export const BULK_CSV_HEADERS = BULK_HEADERS;

export type BulkProductRow = ProductInput & {
  rowNumber: number;
  errors: string[];
};

const CATEGORY_BY_LABEL = Object.fromEntries(
  (Object.entries(categoryLabels) as [CategoryId, string][]).map(
    ([id, label]) => [normalizeKey(label), id],
  ),
) as Record<string, CategoryId>;

const CATEGORY_IDS = new Set(Object.keys(categoryLabels));

export function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };
  const pushRow = () => {
    if (row.length === 1 && row[0] === "" && rows.length > 0) {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === "," || ch === ";") {
      pushCell();
    } else if (ch === "\n") {
      pushCell();
      pushRow();
    } else if (ch === "\r") {
      // ignore
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    pushCell();
    pushRow();
  }

  return rows;
}

function headerIndex(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    const key = normalizeKey(h);
    if (key) map[key] = i;
  });
  return map;
}

function cellAt(row: string[], idx: Record<string, number>, ...aliases: string[]) {
  for (const alias of aliases) {
    const i = idx[normalizeKey(alias)];
    if (i != null && row[i] != null) return row[i].trim();
  }
  return "";
}

function parseMoney(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  let cleaned = t.replace(/\$/g, "").replace(/\s/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    cleaned = cleaned.replace(/,/g, "");
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseBool(raw: string, defaultValue: boolean): boolean {
  const t = raw.trim().toLowerCase();
  if (!t) return defaultValue;
  if (["1", "true", "si", "sí", "yes", "y", "activo", "x"].includes(t)) {
    return true;
  }
  if (["0", "false", "no", "n", "inactivo"].includes(t)) {
    return false;
  }
  return defaultValue;
}

/** URLs de la celda imagenes (separadas por | o , http...). */
export function parseImageUrls(raw: string): string[] {
  if (!raw.trim()) return [];
  // Prefer pipe; if commas, split carefully on ",http" patterns
  if (raw.includes("|")) {
    return [...new Set(raw.split("|").map((p) => p.trim()).filter(Boolean))];
  }
  const matches = raw.match(/https?:\/\/\S+/g);
  if (matches?.length) return [...new Set(matches.map((u) => u.replace(/,$/, "")))];
  return [...new Set(raw.split(",").map((p) => p.trim()).filter(Boolean))];
}

export function resolveCategory(raw: string): CategoryId | null {
  const t = raw.trim();
  if (!t) return null;
  const key = normalizeKey(t);
  if (CATEGORY_IDS.has(t.toLowerCase() as CategoryId)) {
    return t.toLowerCase() as CategoryId;
  }
  if (CATEGORY_BY_LABEL[key]) return CATEGORY_BY_LABEL[key];
  if (CATEGORY_IDS.has(key as CategoryId)) return key as CategoryId;
  // Categorías nuevas / libres (slug)
  if (key) return key;
  return null;
}

export function buildBulkTemplateCsv(): string {
  const header = BULK_HEADERS.join(",");
  const samples = sampleRows().map((row) =>
    row
      .map((cell) => {
        const s = String(cell);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(","),
  );
  return `\uFEFF${[header, ...samples].join("\n")}\n`;
}

function sampleRows(): string[][] {
  return [
    [
      "iPhone 15 128GB",
      "Apple",
      "celulares",
      "flagship",
      "Proveedor Demo",
      "Celular Apple iPhone 15 128GB",
      "900000",
      "1299990",
      "8",
      "",
      "si",
      "no",
    ],
    [
      "Notebook Gamer 15",
      "Asus",
      "notebooks",
      "gamer",
      "Proveedor Demo",
      "Notebook gamer con RTX",
      "1400000",
      "1899900",
      "4",
      "",
      "si",
      "si",
    ],
  ];
}

/** Plantilla Excel (.xlsx) lista para descargar. */
export async function buildBulkTemplateXlsx(): Promise<Blob> {
  const XLSX = await import("xlsx");
  const aoa = [Array.from(BULK_HEADERS), ...sampleRows()];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = BULK_HEADERS.map((h) => ({
    wch: Math.max(12, h.length + 2),
  }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Productos");
  const buffer = XLSX.write(book, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  if (typeof value === "boolean") return value ? "si" : "no";
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

export function parseBulkProductsTable(table: string[][]): {
  rows: BulkProductRow[];
  fatalError: string | null;
} {
  if (table.length < 2) {
    return {
      rows: [],
      fatalError: "El archivo necesita encabezado y al menos una fila de datos.",
    };
  }

  const idx = headerIndex(table[0]);
  if (idx.nombre == null && idx.name == null) {
    return {
      rows: [],
      fatalError:
        'Falta la columna "nombre". Descargá la plantilla e intentá de nuevo.',
    };
  }
  if (idx.precioventa == null && idx.precio == null && idx.price == null) {
    return {
      rows: [],
      fatalError:
        'Falta la columna "precio_venta". Descargá la plantilla e intentá de nuevo.',
    };
  }

  const rows: BulkProductRow[] = [];

  for (let r = 1; r < table.length; r++) {
    const raw = table[r];
    if (raw.every((c) => !String(c).trim())) continue;

    const errors: string[] = [];
    const name = normalizeProductName(cellAt(raw, idx, "nombre", "name"));
    const brand = cellAt(raw, idx, "marca", "brand");
    const categoryRaw = cellAt(raw, idx, "categoria", "category");
    const subcategory = cellAt(raw, idx, "subcategoria", "subcategory");
    const provider = cellAt(raw, idx, "proveedor", "provider");
    const description =
      cellAt(raw, idx, "descrip_prov", "descripcion", "description") || name;
    const costRaw = cellAt(raw, idx, "precio_costo", "cost_price", "costo");
    const priceRaw = cellAt(
      raw,
      idx,
      "precio_venta",
      "precio",
      "price",
      "venta",
    );
    const stockRaw = cellAt(raw, idx, "stock");
    const imagesRaw = cellAt(raw, idx, "imagenes", "imagen_url", "image_url");
    const activeRaw = cellAt(raw, idx, "activo", "active");
    const featuredRaw = cellAt(raw, idx, "destacado", "featured");

    if (!name) errors.push("nombre vacío");
    if (!brand) errors.push("marca vacía");

    const category = resolveCategory(categoryRaw);
    if (!category) {
      errors.push(
        `categoría inválida (${categoryRaw || "vacía"}). Usá: ${Object.keys(categoryLabels).join(", ")}`,
      );
    }

    const price = parseMoney(priceRaw);
    if (price == null || price < 0) errors.push("precio_venta inválido");

    const costPrice = costRaw ? parseMoney(costRaw) : null;
    if (costRaw && costPrice == null) errors.push("precio_costo inválido");

    const stock = stockRaw === "" ? 0 : Number(stockRaw);
    if (!Number.isFinite(stock) || stock < 0) errors.push("stock inválido");

    rows.push({
      rowNumber: r + 1,
      name,
      brand,
      category: category ?? "gadgets",
      subcategory,
      provider,
      costPrice,
      price: price ?? 0,
      oldPrice: null,
      stock: Number.isFinite(stock) ? stock : 0,
      installments: "Hasta 6 cuotas sin interés",
      description,
      tags: subcategory ? [subcategory] : [],
      colors: [],
      ram: "",
      storage: "",
      imageUrl: parseImageUrls(imagesRaw)[0] ?? null,
      imageUrls: parseImageUrls(imagesRaw),
      active: parseBool(activeRaw, true),
      featured: parseBool(featuredRaw, false),
      errors,
    });
  }

  return { rows, fatalError: null };
}

export function parseBulkProductsCsv(text: string): {
  rows: BulkProductRow[];
  fatalError: string | null;
} {
  const stripped = text.replace(/^\uFEFF/, "").trim();
  if (!stripped) {
    return { rows: [], fatalError: "El archivo está vacío." };
  }
  return parseBulkProductsTable(parseCsv(stripped));
}

export async function parseBulkProductsXlsx(file: ArrayBuffer): Promise<{
  rows: BulkProductRow[];
  fatalError: string | null;
}> {
  try {
    const XLSX = await import("xlsx");
    const book = XLSX.read(file, { type: "array", cellDates: true });
    const sheetName = book.SheetNames[0];
    if (!sheetName) {
      return { rows: [], fatalError: "El Excel no tiene hojas." };
    }
    const sheet = book.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null)[]>(
      sheet,
      {
        header: 1,
        defval: "",
        raw: false,
      },
    );
    const table = aoa.map((row) => {
      const cells = Array.isArray(row) ? row : [];
      return cells.map((c) => cellToString(c));
    });
    if (table.length === 0) {
      return { rows: [], fatalError: "El archivo Excel está vacío." };
    }
    return parseBulkProductsTable(table);
  } catch (err) {
    return {
      rows: [],
      fatalError:
        err instanceof Error
          ? `No se pudo leer el Excel: ${err.message}`
          : "No se pudo leer el Excel.",
    };
  }
}

export async function parseBulkProductsFile(file: File): Promise<{
  rows: BulkProductRow[];
  fatalError: string | null;
}> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseBulkProductsXlsx(await file.arrayBuffer());
  }
  if (name.endsWith(".csv") || file.type.includes("csv")) {
    return parseBulkProductsCsv(await file.text());
  }
  // Por defecto intentamos Excel (plantilla oficial)
  return parseBulkProductsXlsx(await file.arrayBuffer());
}

/** Match image filename (without extension) to a product name. */
export function matchImageToProductName(
  fileName: string,
  productName: string,
): boolean {
  const base = normalizeKey(fileName.replace(/\.[^.]+$/, ""));
  const product = normalizeKey(productName);
  if (!base || !product) return false;
  if (base === product) return true;
  // Varias fotos: "Nombre-1.jpg", "Nombre_2.png", "Nombre (3).webp"
  if (!base.startsWith(product)) return false;
  const rest = base.slice(product.length);
  return rest === "" || /^\d+$/.test(rest);
}

/** Encuentra el producto para un archivo (preferí match exacto). */
export function findProductForImageName<T extends { name: string }>(
  fileName: string,
  products: T[],
): T | undefined {
  const base = normalizeKey(fileName.replace(/\.[^.]+$/, ""));
  const exact = products.find((p) => normalizeKey(p.name) === base);
  if (exact) return exact;
  return products.find((p) => matchImageToProductName(fileName, p.name));
}
