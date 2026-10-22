"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminFormModal } from "@/components/admin/AdminFormModal";
import { BulkProductImport } from "@/components/admin/BulkProductImport";
import { ProductImageAssign } from "@/components/admin/ProductImageAssign";
import { SupplierListImport } from "@/components/admin/SupplierListImport";
import { SupplierPriceUpdate } from "@/components/admin/SupplierPriceUpdate";
import { ComboSelect } from "@/components/ComboSelect";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { MoneyInput } from "@/components/MoneyInput";
import { ProductImage } from "@/components/ProductImage";
import { ColorSelect } from "@/components/ColorSelect";
import { RichTextEditor } from "@/components/RichTextEditor";
import { TagInput } from "@/components/TagInput";
import { useStoreCurrency } from "@/hooks/useCurrency";
import { useDialog } from "@/components/DialogProvider";
import {
  categoryLabels,
  type CategoryId,
  type Product,
} from "@/lib/products";
import { swatchForColor } from "@/lib/product-colors";
import { useCatalogStore } from "@/store/catalog-store";
import { normalizeBrandName, useBrandsStore } from "@/store/brands-store";
import {
  slugifyCategoryId,
  useCategoriesStore,
} from "@/store/categories-store";
import { useSubcategoriesStore } from "@/store/subcategories-store";
import { useProvidersStore } from "@/store/providers-store";
import { useStoreConfig } from "@/store/store-config";
import {
  currencyPrefix,
  normalizeCurrency,
  salePriceFromCost,
  type CurrencyCode,
} from "@/lib/format";
import { normalizeProductName } from "@/lib/product-name";
import { richTextToPlain, toRichTextHtml } from "@/lib/rich-text";
import { uploadImageAsWebp } from "@/lib/supabase/storage";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary";

const TABLE_COLS =
  "md:grid-cols-[40px_64px_minmax(140px,1.5fr)_100px_118px_100px_70px_96px_120px]";

const costInputClass =
  "w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-[13px] font-semibold tabular-nums text-foreground outline-none focus:border-primary";

const RAM_OPTIONS = [
  { value: "", label: "Sin especificar" },
  { value: "3 GB", label: "3 GB" },
  { value: "4 GB", label: "4 GB" },
  { value: "6 GB", label: "6 GB" },
  { value: "8 GB", label: "8 GB" },
  { value: "12 GB", label: "12 GB" },
  { value: "16 GB", label: "16 GB" },
];

const STORAGE_OPTIONS = [
  { value: "", label: "Sin especificar" },
  { value: "64 GB", label: "64 GB" },
  { value: "128 GB", label: "128 GB" },
  { value: "256 GB", label: "256 GB" },
  { value: "512 GB", label: "512 GB" },
  { value: "1 TB", label: "1 TB" },
];

const NOTEBOOK_USAGE_OPTIONS = [
  { value: "", label: "Sin especificar" },
  { value: "Oficina", label: "Oficina" },
  { value: "Gamer", label: "Gamer" },
];

const emptyForm = {
  name: "",
  brand: "",
  category: "celulares" as CategoryId,
  subcategory: "",
  provider: "",
  costPrice: null as number | null,
  price: null as number | null,
  stock: "1",
  installments: "Hasta 6 cuotas sin interés",
  description: "",
  tags: [] as string[],
  colors: [] as string[],
  ram: "",
  storage: "",
  screenSize: "",
  processor: "",
  operatingSystem: "",
  gpu: "",
  usageType: "",
  imageUrl: null as string | null,
  imageUrls: [] as string[],
  active: true,
  featured: false,
};

/** Agrega un texto al nombre sin duplicarlo si ya está. */
function applyNameText(
  name: string,
  text: string,
  position: "before" | "after",
): string {
  const t = text.trim();
  if (!t) return name;
  const lower = name.toLowerCase();
  if (position === "before" && lower.startsWith(t.toLowerCase())) return name;
  if (position === "after" && lower.endsWith(t.toLowerCase())) return name;
  return position === "before" ? `${t} ${name}` : `${name} ${t}`;
}

function toTitleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b([a-záéíóúñü])/g, (m) => m.toUpperCase());
}

const MIN_COVER_IMAGE_SIDE = 700;
const WHITE_BG_TOLERANCE = 42;
const WHITE_BG_MAX_EDGE = 1600;

async function resolveImageSize(url: string) {
  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const img = new window.Image();
    const timer = window.setTimeout(() => resolve(null), 4500);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.referrerPolicy = "no-referrer";
    img.src = url;
  });
}

function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function fileNameFromLabel(label: string) {
  const sanitized = label
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s-]/gi, " ")
    .trim()
    .replace(/\s+/g, "-");
  return sanitized || "product-image";
}

async function loadImageFromBlob(blob: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };
    img.src = url;
  });
}

async function whitenBackgroundFile(imageUrl: string, label: string) {
  const proxied = await fetch(
    `/api/images/proxy?url=${encodeURIComponent(imageUrl)}`,
  );
  if (!proxied.ok) {
    throw new Error("No se pudo descargar la imagen para limpiar fondo");
  }
  const blob = await proxied.blob();
  const img = await loadImageFromBlob(blob);

  const scale = Math.min(
    1,
    WHITE_BG_MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight),
  );
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const samplePoints: Array<[number, number]> = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [Math.floor(width / 2), height - 1],
    [0, Math.floor(height / 2)],
    [width - 1, Math.floor(height / 2)],
  ];

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  for (const [x, y] of samplePoints) {
    const idx = (y * width + x) * 4;
    sumR += data[idx];
    sumG += data[idx + 1];
    sumB += data[idx + 2];
  }
  const bgR = sumR / samplePoints.length;
  const bgG = sumG / samplePoints.length;
  const bgB = sumB / samplePoints.length;

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let qStart = 0;
  let qEnd = 0;

  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const pos = y * width + x;
    if (visited[pos]) return;
    visited[pos] = 1;
    queue[qEnd++] = pos;
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (qStart < qEnd) {
    const pos = queue[qStart++];
    const x = pos % width;
    const y = Math.floor(pos / width);
    const i = pos * 4;
    const d = colorDistance(data[i], data[i + 1], data[i + 2], bgR, bgG, bgB);
    if (d > WHITE_BG_TOLERANCE) continue;

    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;

    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  ctx.putImageData(imageData, 0, 0);
  const outBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) return reject(new Error("No se pudo generar imagen"));
        resolve(b);
      },
      "image/png",
      0.92,
    );
  });

  return new File([outBlob], `${fileNameFromLabel(label)}-white-bg.png`, {
    type: "image/png",
  });
}

async function downloadExternalImageAsFile(imageUrl: string, label: string) {
  const proxied = await fetch(
    `/api/images/proxy?url=${encodeURIComponent(imageUrl)}`,
  );
  if (!proxied.ok) {
    throw new Error("No se pudo descargar la imagen remota para guardar");
  }
  const blob = await proxied.blob();
  const ext = blob.type.includes("png")
    ? "png"
    : blob.type.includes("webp")
      ? "webp"
      : "jpg";
  return new File([blob], `${fileNameFromLabel(label)}.${ext}`, {
    type: blob.type || "image/jpeg",
  });
}

type Panel = "none" | "form" | "bulk" | "images" | "prices" | "supplier";
type CoverImageCandidate = {
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  sourceUrl: string;
  source: string;
  width: number | null;
  height: number | null;
};

export default function AdminProductosPage() {
  const { currency: storeCurrency, formatPrice } = useStoreCurrency();
  const updateConfig = useStoreConfig((s) => s.updateConfig);
  const { confirm, notice } = useDialog();
  const products = useCatalogStore((s) => s.products);
  const catalogError = useCatalogStore((s) => s.error);
  const fetchProducts = useCatalogStore((s) => s.fetchProducts);
  const addProduct = useCatalogStore((s) => s.addProduct);
  const updateProduct = useCatalogStore((s) => s.updateProduct);
  const updateProducts = useCatalogStore((s) => s.updateProducts);
  const deleteProduct = useCatalogStore((s) => s.deleteProduct);
  const deleteProducts = useCatalogStore((s) => s.deleteProducts);
  const brands = useBrandsStore((s) => s.brands);
  const ensureBrand = useBrandsStore((s) => s.ensureBrand);
  const storeCategories = useCategoriesStore((s) => s.categories);
  const categories = useMemo(
    () =>
      [...storeCategories].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [storeCategories],
  );
  const storeSubcategories = useSubcategoriesStore((s) => s.subcategories);
  const addSubcategory = useSubcategoriesStore((s) => s.addSubcategory);
  const subcategories = useMemo(
    () =>
      [...storeSubcategories].sort((a, b) =>
        a.name.localeCompare(b.name, "es"),
      ),
    [storeSubcategories],
  );
  const providers = useProvidersStore((s) => s.providers);
  const ensureProvider = useProvidersStore((s) => s.ensureProvider);
  const addCategory = useCategoriesStore((s) => s.addCategory);

  const [priceCurrency, setPriceCurrency] = useState<CurrencyCode>(storeCurrency);
  const prefix = currencyPrefix(priceCurrency);

  const [query, setQuery] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState<CategoryId | "">("");
  const [filterSubcategory, setFilterSubcategory] = useState("");
  const [filterProvider, setFilterProvider] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [panel, setPanel] = useState<Panel>("none");
  const [imageQueueIds, setImageQueueIds] = useState<number[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkCategory, setBulkCategory] = useState<CategoryId | "">("");
  const [bulkSubcategory, setBulkSubcategory] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkTextPos, setBulkTextPos] = useState<"before" | "after">("before");
  const [bulkBrand, setBulkBrand] = useState("");
  const [bulkTags, setBulkTags] = useState<string[]>([]);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [rowAiMenuId, setRowAiMenuId] = useState<number | null>(null);
  const [aiDescribeBusyId, setAiDescribeBusyId] = useState<number | null>(null);
  const formPanelRef = useRef<HTMLFormElement>(null);
  const [bulkPanel, setBulkPanel] = useState<
    null | "tags" | "category" | "brand"
  >(null);
  const bulkMenuRef = useRef<HTMLDivElement>(null);
  const [coverSearchQueueIds, setCoverSearchQueueIds] = useState<number[]>([]);
  const [coverSearchIndex, setCoverSearchIndex] = useState(0);
  const [coverSearchOpen, setCoverSearchOpen] = useState(false);
  const [coverSearchLoading, setCoverSearchLoading] = useState(false);
  const [coverSearchSaving, setCoverSearchSaving] = useState(false);
  const [coverSearchResults, setCoverSearchResults] = useState<CoverImageCandidate[]>([]);
  const [coverSearchQuery, setCoverSearchQuery] = useState("");
  const [coverPreview, setCoverPreview] = useState<CoverImageCandidate | null>(null);
  const coverSearchReqRef = useRef(0);

  const missingImages = useMemo(
    () => products.filter((p) => !p.imageUrl).map((p) => p.id),
    [products],
  );

  const filtered = useMemo(() => {
    let result = products;

    // Filter by search query
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((p) => {
        const tags = (p.tags ?? []).join(" ").toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          richTextToPlain(p.description).toLowerCase().includes(q) ||
          categoryLabels[p.category]?.toLowerCase().includes(q) ||
          categories.some(
            (c) =>
              c.id === p.category && c.name.toLowerCase().includes(q),
          ) ||
          tags.includes(q)
        );
      });
    }

    // Filter by brand
    if (filterBrand) {
      result = result.filter((p) => p.brand === filterBrand);
    }

    // Filter by category
    if (filterCategory) {
      result = result.filter((p) => p.category === filterCategory);
    }

    // Filter by subcategory
    if (filterSubcategory) {
      result = result.filter((p) => p.subcategory === filterSubcategory);
    }

    // Filter by provider
    if (filterProvider) {
      result = result.filter((p) => p.provider === filterProvider);
    }

    return result;
  }, [
    products,
    query,
    filterBrand,
    filterCategory,
    filterSubcategory,
    filterProvider,
    categories,
  ]);

  const filteredIds = useMemo(() => filtered.map((p) => p.id), [filtered]);
  // Las acciones masivas solo aplican a lo que se ve con los filtros actuales.
  const visibleSelectedIds = useMemo(
    () => filteredIds.filter((id) => selected.has(id)),
    [filteredIds, selected],
  );
  const selectedCount = visibleSelectedIds.length;
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const someFilteredSelected =
    filteredIds.some((id) => selected.has(id)) && !allFilteredSelected;

  const brandOptions = useMemo(() => {
    const fromStore = brands
      .filter((b) => b.active)
      .map((b) => ({ value: b.name, label: b.name }));
    // incluir marca actual del form si no está
    if (
      form.brand &&
      !fromStore.some(
        (o) => o.value.toLowerCase() === form.brand.toLowerCase(),
      )
    ) {
      fromStore.unshift({ value: form.brand, label: form.brand });
    }
    return fromStore;
  }, [brands, form.brand]);

  const filterSubcategoryOptions = useMemo(
    () =>
      subcategories
        .filter((x) => x.categoryId === filterCategory && x.active)
        .map((x) => ({ value: x.name, label: x.name })),
    [subcategories, filterCategory],
  );

  const subcategoryOptions = useMemo(() => {
    const opts = [
      { value: "", label: "Sin subcategoría" },
      ...subcategories
        .filter((x) => x.categoryId === form.category && x.active)
        .map((x) => ({ value: x.name, label: x.name })),
    ];
    if (form.subcategory && !opts.some((o) => o.value === form.subcategory)) {
      opts.push({ value: form.subcategory, label: form.subcategory });
    }
    return opts;
  }, [subcategories, form.category, form.subcategory]);

  const categoryOptions = useMemo(() => {
    const fromStore = categories
      .filter((c) => c.active)
      .map((c) => ({ value: c.id, label: c.name }));
    if (
      form.category &&
      !fromStore.some((o) => o.value === form.category)
    ) {
      fromStore.unshift({
        value: form.category,
        label: categoryLabels[form.category] ?? form.category,
      });
    }
    return fromStore.length
      ? fromStore
      : (Object.entries(categoryLabels) as [string, string][]).map(
          ([value, label]) => ({ value, label }),
        );
  }, [categories, form.category]);

  const categoryLabel = (id: string) =>
    categories.find((c) => c.id === id)?.name ??
    categoryLabels[id] ??
    id;

  const providerOptions = useMemo(() => {
    const fromStore = providers.map((p) => ({
      value: p.name,
      label: p.name,
    }));
    if (
      form.provider &&
      !fromStore.some(
        (o) => o.value.toLowerCase() === form.provider.toLowerCase(),
      )
    ) {
      fromStore.unshift({ value: form.provider, label: form.provider });
    }
    return fromStore;
  }, [providers, form.provider]);

  const onPriceCurrencyChange = (next: CurrencyCode) => {
    setPriceCurrency(next);
    void updateConfig({ currency: next });
  };

  const bulkCategoryOptions = useMemo(
    () => [
      { value: "", label: "Elegir…" },
      ...categories
        .filter((c) => c.active)
        .map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories],
  );
  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const id of filteredIds) next.delete(id);
      } else {
        for (const id of filteredIds) next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelected(new Set());
    setBulkMenuOpen(false);
    setBulkPanel(null);
    setBulkTags([]);
    setBulkCategory("");
    setBulkBrand("");
  };

  const selectedIds = () => visibleSelectedIds;
  const coverSearchCurrentId = coverSearchQueueIds[coverSearchIndex] ?? null;
  const coverSearchProduct = useMemo(
    () =>
      coverSearchCurrentId == null
        ? null
        : products.find((p) => p.id === coverSearchCurrentId) ?? null,
    [products, coverSearchCurrentId],
  );
  const coverSearchBusy = coverSearchLoading || coverSearchSaving;

  useEffect(() => {
    if (!bulkMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!bulkMenuRef.current?.contains(e.target as Node)) {
        setBulkMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBulkMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [bulkMenuOpen]);

  useEffect(() => {
    if (rowAiMenuId == null) return;
    const onPointerDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("[data-ai-actions-root]")) return;
      setRowAiMenuId(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRowAiMenuId(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [rowAiMenuId]);

  useEffect(() => {
    if (panel !== "form") return;
    const id = window.requestAnimationFrame(() => {
      formPanelRef.current?.scrollIntoView({ block: "nearest" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [panel, editing?.id]);

  const runBulk = async (fn: () => Promise<void>) => {
    setBulkBusy(true);
    try {
      await fn();
      clearSelection();
    } catch (err) {
      void notice({
        title: "No se pudo completar",
        message: err instanceof Error ? err.message : "Error en acción masiva",
      });
    } finally {
      setBulkBusy(false);
      setBulkAction("");
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  const openBulkPanel = (panel: "tags" | "category" | "brand") => {
    setBulkMenuOpen(false);
    setBulkPanel(panel);
  };
  const closeForm = useCallback(() => {
    setPanel("none");
    setEditing(null);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setPriceCurrency(normalizeCurrency(storeCurrency));
    setPanel("form");
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setPriceCurrency(normalizeCurrency(storeCurrency));
    setForm({
      name: p.name,
      brand: p.brand,
      category: p.category,
      subcategory: p.subcategory ?? "",
      provider: p.provider ?? "",
      costPrice: p.costPrice,
      price: p.price,
      stock: String(p.stock),
      installments: p.installments,
      description: toRichTextHtml(p.description),
      tags: [...(p.tags ?? [])],
      colors: [...(p.colors ?? [])],
      ram: p.ram ?? "",
      storage: p.storage ?? "",
      screenSize: p.screenSize ?? "",
      processor: p.processor ?? "",
      operatingSystem: p.operatingSystem ?? "",
      gpu: p.gpu ?? "",
      usageType: p.usageType ?? "",
      imageUrl: p.imageUrl,
      imageUrls: p.imageUrls?.length
        ? p.imageUrls
        : p.imageUrl
          ? [p.imageUrl]
          : [],
      active: p.active,
      featured: p.featured,
    });
    setPanel("form");
  };

  const openBulk = () => {
    setEditing(null);
    setPanel("bulk");
  };

  const openPrices = () => {
    setEditing(null);
    setPanel("prices");
  };

  const openSupplier = () => {
    setEditing(null);
    setPanel("supplier");
  };

  const openImages = (ids: number[]) => {
    setImageQueueIds(ids);
    setPanel("images");
  };

  const buildCoverSearchQuery = (p: Product) =>
    `${p.brand} ${p.name} ${categoryLabel(p.category)} portada producto`;

  const fetchCoverCandidates = useCallback(
    async (queryText: string) => {
      const q = queryText.trim();
      if (!q) return;
      coverSearchReqRef.current += 1;
      const reqId = coverSearchReqRef.current;
      setCoverSearchLoading(true);
      setCoverSearchResults([]);
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 12000);
        const res = await fetch(`/api/images/search?q=${encodeURIComponent(q)}&limit=10`, {
          signal: controller.signal,
        });
        window.clearTimeout(timeout);
        const data = (await res.json()) as {
          results?: CoverImageCandidate[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || "No se pudo buscar imágenes");
        }
        const rawResults = data.results ?? [];
        const checked = await Promise.all(
          rawResults.map(async (candidate) => {
            const knownWidth = candidate.width ?? 0;
            const knownHeight = candidate.height ?? 0;
            if (knownWidth > 0 && knownHeight > 0) {
              if (
                knownWidth < MIN_COVER_IMAGE_SIDE ||
                knownHeight < MIN_COVER_IMAGE_SIDE
              ) {
                return null;
              }
              return candidate;
            }

            const measured = await resolveImageSize(candidate.imageUrl);
            if (!measured) return null;
            if (
              measured.width < MIN_COVER_IMAGE_SIDE ||
              measured.height < MIN_COVER_IMAGE_SIDE
            ) {
              return null;
            }
            return {
              ...candidate,
              width: measured.width,
              height: measured.height,
            };
          }),
        );

        const filtered = checked.filter(
          (item): item is CoverImageCandidate => Boolean(item),
        );
        if (coverSearchReqRef.current !== reqId) return;
        setCoverSearchResults(filtered);
      } catch (err) {
        if (coverSearchReqRef.current !== reqId) return;
        setCoverSearchResults([]);
        void notice({
          title: "No se pudo buscar imagen",
          message:
            err instanceof DOMException && err.name === "AbortError"
              ? "La búsqueda tardó demasiado. Probá una consulta más corta."
              : err instanceof Error
              ? err.message
              : "Error al buscar portadas automáticas",
        });
      } finally {
        if (coverSearchReqRef.current !== reqId) return;
        setCoverSearchLoading(false);
      }
    },
    [notice],
  );

  const openCoverSearch = (ids: number[]) => {
    if (ids.length === 0) return;
    setCoverSearchQueueIds(ids);
    setCoverSearchIndex(0);
    setCoverSearchOpen(true);
  };

  const closeCoverSearch = () => {
    setCoverSearchOpen(false);
    setCoverSearchQueueIds([]);
    setCoverSearchIndex(0);
    setCoverSearchResults([]);
    setCoverSearchQuery("");
    setCoverPreview(null);
  };

  const goNextCoverProduct = () => {
    if (coverSearchIndex >= coverSearchQueueIds.length - 1) {
      closeCoverSearch();
      return;
    }
    setCoverSearchResults([]);
    setCoverPreview(null);
    setCoverSearchIndex((prev) => prev + 1);
  };

  const saveCoverForCurrent = async (
    candidate: CoverImageCandidate,
    options?: { whiteBackground?: boolean },
  ) => {
    if (!coverSearchProduct) return;
    setCoverSearchSaving(true);
    try {
      const file = options?.whiteBackground
        ? await whitenBackgroundFile(candidate.imageUrl, coverSearchProduct.name)
        : await downloadExternalImageAsFile(
            candidate.imageUrl,
            coverSearchProduct.name,
          );
      const uploaded = await uploadImageAsWebp(file, "products");
      const finalImageUrl = uploaded.publicUrl;
      await updateProduct(coverSearchProduct.id, {
        imageUrl: finalImageUrl,
        imageUrls: [finalImageUrl],
      });
      goNextCoverProduct();
    } catch (err) {
      void notice({
        title: "No se pudo guardar imagen",
        message: err instanceof Error ? err.message : "Error al guardar portada",
      });
    } finally {
      setCoverSearchSaving(false);
    }
  };

  useEffect(() => {
    if (!coverSearchOpen || !coverSearchProduct) return;
    setCoverSearchResults([]);
    setCoverPreview(null);
    const nextQuery = buildCoverSearchQuery(coverSearchProduct);
    setCoverSearchQuery(nextQuery);
    void fetchCoverCandidates(nextQuery);
  }, [coverSearchOpen, coverSearchProduct, fetchCoverCandidates]);

  const onCategoryFormChange = (rawValue: string) => {
    const nextValue = rawValue.trim();
    if (!nextValue) return;

    const existingById = categories.find((c) => c.id === nextValue);
    const existingByName = categories.find(
      (c) => c.name.toLowerCase() === nextValue.toLowerCase(),
    );
    const existing = existingById ?? existingByName;
    if (existing) {
      setForm((prev) => ({
        ...prev,
        category: existing.id,
        subcategory: subcategories.some(
          (x) =>
            x.categoryId === existing.id && x.name === prev.subcategory,
        )
          ? prev.subcategory
          : "",
      }));
      return;
    }

    void (async () => {
      try {
        const created = await addCategory({
          id: slugifyCategoryId(nextValue),
          name: toTitleCase(nextValue),
        });
        setForm((prev) => ({
          ...prev,
          category: created.id,
          subcategory: "",
        }));
      } catch (err) {
        void notice({
          title: "No se pudo crear la categoría",
          message: err instanceof Error ? err.message : "Error al crear categoría",
        });
      }
    })();
  };

  const onSubcategoryFormChange = (rawValue: string) => {
    const nextValue = rawValue.trim();
    if (!nextValue) {
      setForm((prev) => ({ ...prev, subcategory: "" }));
      return;
    }

    const existing = subcategories.find(
      (x) =>
        x.categoryId === form.category &&
        x.name.toLowerCase() === nextValue.toLowerCase(),
    );
    if (existing) {
      setForm((prev) => ({ ...prev, subcategory: existing.name }));
      return;
    }

    void (async () => {
      try {
        const created = await addSubcategory({
          categoryId: form.category,
          name: toTitleCase(nextValue),
        });
        setForm((prev) => ({ ...prev, subcategory: created.name }));
      } catch (err) {
        void notice({
          title: "No se pudo crear la subcategoría",
          message:
            err instanceof Error ? err.message : "Error al crear subcategoría",
        });
      }
    })();
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const brandName = normalizeBrandName(form.brand);
    const providerName = form.provider.trim();

    try {
      if (!brandName) {
        void notice({
          title: "Marca requerida",
          message: "Elegí o agregá una marca para el producto.",
        });
        return;
      }
      const ensuredBrand = await ensureBrand(brandName);
      if (providerName) await ensureProvider(providerName);
      const payload = {
        name: normalizeProductName(form.name),
        brand: ensuredBrand.name,
        category: form.category,
        subcategory: form.subcategory.trim(),
        provider: providerName,
        costPrice: form.costPrice,
        price: form.price ?? 0,
        oldPrice: null,
        stock: Number(form.stock) || 0,
        installments: form.installments.trim(),
        description: toRichTextHtml(form.description),
        tags: form.tags,
        colors: form.colors,
        ram: form.ram.trim(),
        storage: form.storage.trim(),
        screenSize: form.screenSize.trim(),
        processor: form.processor.trim(),
        operatingSystem: form.operatingSystem.trim(),
        gpu: form.gpu.trim(),
        usageType: form.usageType.trim(),
        imageUrl: form.imageUrls[0] ?? null,
        imageUrls: form.imageUrls,
        active: form.active,
        featured: form.featured,
      };
      if (editing) await updateProduct(editing.id, payload);
      else await addProduct(payload);
      setPanel("none");
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      void notice({
        title: "No se pudo guardar",
        message: err instanceof Error ? err.message : "Error al guardar",
      });
    }
  };

  const normalizeFilteredNames = async () => {
    const changed = filtered.filter(
      (p) => normalizeProductName(p.name) !== p.name,
    );
    if (changed.length === 0) {
      void notice("No hay nombres para normalizar en el filtro actual.");
      return;
    }

    const ok = await confirm({
      title: "Normalizar nombres",
      message: `Se van a normalizar ${changed.length} producto${changed.length === 1 ? "" : "s"} del filtro actual. ¿Continuar?`,
      confirmLabel: "Normalizar",
    });
    if (!ok) return;

    setBulkBusy(true);
    setBulkAction("Normalizando nombres");
    setBulkProgress({ current: 0, total: changed.length });
    try {
      for (let i = 0; i < changed.length; i++) {
        const product = changed[i];
        await updateProduct(product.id, {
          name: normalizeProductName(product.name),
        });
        setBulkProgress({ current: i + 1, total: changed.length });
      }
      void notice(
        `Listo: se normalizaron ${changed.length} nombre${changed.length === 1 ? "" : "s"}.`,
      );
    } catch (err) {
      void notice({
        title: "No se pudo normalizar",
        message: err instanceof Error ? err.message : "Error al normalizar nombres",
      });
    } finally {
      setBulkBusy(false);
      setBulkAction("");
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  const buildAutoDescription = (p: Product) => {
    const title = p.name.toLowerCase().startsWith(p.brand.toLowerCase())
      ? p.name
      : `${p.brand} ${p.name}`;
    const category = categoryLabel(p.category);
    const isNotebook =
      p.category.toLowerCase() === "notebooks" ||
      p.category.toLowerCase() === "macbooks";
    const isPhone = p.category.toLowerCase() === "celulares";

    const intro = isNotebook
      ? `${title} es una excelente opción para quienes buscan rendimiento, confiabilidad y buena experiencia de uso en trabajo, estudio o entretenimiento.`
      : isPhone
        ? `${title} combina diseño, fluidez y prestaciones modernas para un uso diario completo, con muy buen equilibrio entre potencia y autonomía.`
        : `${title} es una propuesta destacada dentro de la categoría ${category.toLowerCase()}, pensada para quienes priorizan calidad y rendimiento sostenido.`;

    const technicalSpecs = [
      `- Marca: ${p.brand}`,
      `- Categoría: ${category}${p.subcategory ? ` · ${p.subcategory}` : ""}`,
      isNotebook && p.screenSize ? `- Tamaño de pantalla: ${p.screenSize}` : "",
      p.ram ? `- Memoria RAM: ${p.ram}` : "",
      p.storage
        ? isNotebook
          ? `- Disco rígido / almacenamiento: ${p.storage}`
          : `- Almacenamiento: ${p.storage}`
        : "",
      isNotebook && p.gpu ? `- Placa de video aceleradora: ${p.gpu}` : "",
      isNotebook && p.usageType ? `- Tipo de equipo: ${p.usageType}` : "",
      isNotebook && p.operatingSystem
        ? `- Sistema operativo: ${p.operatingSystem}`
        : "",
      isNotebook && p.processor ? `- Procesador: ${p.processor}` : "",
      p.colors?.length
        ? `- Colores disponibles: ${p.colors.map((color) => toTitleCase(color)).join(", ")} (Consultar)`
        : "",
      "- Producto original con garantía oficial.",
    ].filter(Boolean);

    const sellingPoints = [
      "Beneficios destacados:",
      "- Excelente relación precio/rendimiento dentro de su segmento.",
      "- Ideal para quienes buscan una compra segura y duradera.",
      "- Soporte postventa y asesoramiento personalizado de RAM Informática.",
    ];

    const tags = p.tags?.length ? `\n\nIdeal para: ${p.tags.join(", ")}.` : "";

    return toRichTextHtml(
      `${intro}\n\nEspecificaciones técnicas:\n${technicalSpecs.join("\n")}\n\n${sellingPoints.join("\n")}\n\nConsultanos por disponibilidad, medios de pago y opciones de financiación.${tags}`,
    );
  };

  const autoCompleteDescription = async (p: Product) => {
    const currentDescription = richTextToPlain(p.description || "").trim();
    if (currentDescription) {
      const ok = await confirm({
        title: "Reemplazar descripción",
        message:
          "Este producto ya tiene descripción. ¿Querés reemplazarla por una autogenerada?",
        confirmLabel: "Reemplazar",
      });
      if (!ok) return;
    }

    setAiDescribeBusyId(p.id);
    try {
      await updateProduct(p.id, { description: buildAutoDescription(p) });
      void notice("Descripción autocompletada.");
    } catch (err) {
      void notice({
        title: "No se pudo autocompletar",
        message: err instanceof Error ? err.message : "Error al generar descripción",
      });
    } finally {
      setAiDescribeBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-muted">
            {products.length} productos en el catálogo
            {missingImages.length > 0
              ? ` · ${missingImages.length} sin imagen`
              : ""}
          </p>
          {catalogError && (
            <p className="mt-1 text-sm font-semibold text-sale">
              No se pudo cargar el catálogo: {catalogError}{" "}
              <button
                type="button"
                onClick={() => void fetchProducts()}
                className="cursor-pointer border-none bg-transparent p-0 font-semibold text-primary underline"
              >
                Reintentar
              </button>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={missingImages.length === 0}
            onClick={() => openImages(missingImages)}
            className="cursor-pointer rounded-[9px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Asignar imágenes ({missingImages.length})
          </button>
          <button
            type="button"
            disabled={missingImages.length === 0}
            onClick={() => openCoverSearch(missingImages)}
            className="cursor-pointer rounded-[9px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buscar portada IA ({missingImages.length})
          </button>
          <button
            type="button"
            onClick={openSupplier}
            className="cursor-pointer rounded-[9px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold"
          >
            Importar de proveedor
          </button>
          <button
            type="button"
            onClick={openPrices}
            className="cursor-pointer rounded-[9px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold"
          >
            Actualizar precios
          </button>
          <button
            type="button"
            onClick={openBulk}
            className="cursor-pointer rounded-[9px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold"
          >
            Carga masiva
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="cursor-pointer rounded-[9px] border-none bg-primary px-4 py-2.5 text-sm font-bold !text-white"
          >
            + Nuevo producto
          </button>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, marca, tags..."
          className={`${inputClass} max-w-md`}
        />
        <div className="flex flex-wrap gap-3">
          <div className="w-full sm:w-48">
            <ComboSelect
              value={filterBrand}
              options={[
                { value: "", label: "Todas las marcas" },
                ...brands
                  .filter((b) => b.active)
                  .map((b) => ({ value: b.name, label: b.name })),
              ]}
              onChange={setFilterBrand}
              placeholder="Filtrar por marca"
              searchable
              fullWidth
            />
          </div>
          <div className="w-full sm:w-48">
            <ComboSelect
              value={filterCategory}
              options={[
                { value: "", label: "Todas las categorías" },
                ...categories
                  .filter((c) => c.active)
                  .map((c) => ({ value: c.id, label: c.name })),
              ]}
              onChange={(v) => {
                setFilterCategory(v as CategoryId | "");
                setFilterSubcategory("");
              }}
              placeholder="Filtrar por categoría"
              searchable
              fullWidth
            />
          </div>
          {filterSubcategoryOptions.length > 0 && (
            <div className="w-full sm:w-48">
              <ComboSelect
                value={filterSubcategory}
                options={[
                  { value: "", label: "Todas las subcategorías" },
                  ...filterSubcategoryOptions,
                ]}
                onChange={setFilterSubcategory}
                placeholder="Filtrar por subcategoría"
                searchable
                fullWidth
              />
            </div>
          )}
          <div className="w-full sm:w-48">
            <ComboSelect
              value={filterProvider}
              options={[
                { value: "", label: "Todos los proveedores" },
                ...providers.map((p) => ({
                  value: p.name,
                  label: p.name,
                })),
              ]}
              onChange={setFilterProvider}
              placeholder="Filtrar por proveedor"
              searchable
              fullWidth
            />
          </div>
          {(filterBrand ||
            filterCategory ||
            filterSubcategory ||
            filterProvider ||
            query) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilterBrand("");
                setFilterCategory("");
                setFilterSubcategory("");
                setFilterProvider("");
              }}
              className="cursor-pointer rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm font-semibold text-muted hover:bg-accent-soft"
            >
              Limpiar filtros
            </button>
          )}
          <button
            type="button"
            disabled={bulkBusy || filtered.length === 0}
            onClick={() => void normalizeFilteredNames()}
            className="cursor-pointer rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm font-semibold text-muted hover:bg-accent-soft disabled:opacity-50"
          >
            Normalizar nombres (filtro)
          </button>
        </div>
      </div>

      {panel === "bulk" && (
        <BulkProductImport
          onClose={() => setPanel("none")}
          onImported={(created) => {
            openImages(created.map((p) => p.id));
          }}
        />
      )}

      {panel === "supplier" && (
        <SupplierListImport
          onClose={() => setPanel("none")}
          onImported={(created) => openImages(created.map((p) => p.id))}
        />
      )}

      {panel === "prices" && (
        <SupplierPriceUpdate onClose={() => setPanel("none")} />
      )}

      {panel === "images" && (
        <ProductImageAssign
          productIds={imageQueueIds}
          onClose={() => setPanel("none")}
        />
      )}

      {panel === "form" && (
        <AdminFormModal
          open
          title={editing ? `Editar #${editing.id}` : "Nuevo producto"}
          onClose={closeForm}
          onSubmit={onSave}
          formRef={formPanelRef}
          maxWidth="3xl"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onBlur={(e) =>
                setForm((prev) => ({
                  ...prev,
                  name: normalizeProductName(e.target.value),
                }))
              }
              required
            />
            <ComboSelect
              value={form.brand}
              options={brandOptions}
              onChange={(brand) => setForm({ ...form, brand })}
              placeholder="Marca"
              searchPlaceholder="Buscar o agregar marca…"
              searchable
              creatable
              createLabel={(q) => `Agregar marca “${q}”`}
              fullWidth
            />
            <ComboSelect
              value={form.category}
              options={categoryOptions}
              onChange={onCategoryFormChange}
              placeholder="Categoría"
              searchPlaceholder="Buscar categoría…"
              searchable
              creatable
              createLabel={(q) => `Agregar categoría “${q}”`}
              fullWidth
            />
            <ComboSelect
              value={form.subcategory}
              options={subcategoryOptions}
              onChange={onSubcategoryFormChange}
              placeholder="Subcategoría"
              searchPlaceholder="Buscar subcategoría…"
              searchable
              creatable
              createLabel={(q) => `Agregar subcategoría “${q}”`}
              fullWidth
            />
            <ComboSelect
              value={form.provider}
              options={providerOptions}
              onChange={(provider) => setForm({ ...form, provider })}
              placeholder="Proveedor"
              searchPlaceholder="Buscar o agregar proveedor…"
              searchable
              creatable
              createLabel={(q) => `Agregar proveedor “${q}”`}
              fullWidth
            />
            <input
              className={inputClass}
              placeholder="Stock"
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
            />
            <MoneyInput
              className={inputClass}
              placeholder={`Precio costo (${prefix})`}
              currency={priceCurrency}
              currencyEditable
              onCurrencyChange={onPriceCurrencyChange}
              value={form.costPrice}
              onChange={(costPrice) =>
                setForm((prev) => ({
                  ...prev,
                  costPrice,
                  price: salePriceFromCost(costPrice, prev.price ?? 0),
                }))
              }
              allowEmpty
            />
            <MoneyInput
              className={inputClass}
              placeholder={`Precio venta (${prefix})`}
              currency={priceCurrency}
              value={form.price}
              onChange={(price) => setForm({ ...form, price })}
              required
            />
            <div className="flex flex-wrap items-center gap-4 md:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                />
                Activo
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm({ ...form, featured: e.target.checked })
                  }
                />
                Destacado
              </label>
            </div>
            <div className="md:col-span-2">
              <MultiImageUploader
                value={form.imageUrls}
                onChange={(imageUrls) =>
                  setForm({
                    ...form,
                    imageUrls,
                    imageUrl: imageUrls[0] ?? null,
                  })
                }
                folder="products"
              />
            </div>
            <div className="md:col-span-2 space-y-4 rounded-xl border border-border bg-background/60 p-4">
              <div>
                <div className="text-[12.5px] font-bold tracking-wide text-muted uppercase">
                  Características
                </div>
                <p className="mt-1 text-[12.5px] text-muted">
                  Specs y colores del producto. La paleta de colores se adapta a
                  la marca.
                </p>
              </div>

              {form.category === "celulares" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1.5 text-[12px] font-semibold text-foreground">
                      Memoria RAM
                    </div>
                    <ComboSelect
                      value={form.ram}
                      options={RAM_OPTIONS}
                      onChange={(ram) => setForm({ ...form, ram })}
                      placeholder="Elegir RAM"
                      searchable
                      creatable
                      createLabel={(q) => `Usar “${q}”`}
                      fullWidth
                    />
                  </div>
                  <div>
                    <div className="mb-1.5 text-[12px] font-semibold text-foreground">
                      Almacenamiento
                    </div>
                    <ComboSelect
                      value={form.storage}
                      options={STORAGE_OPTIONS}
                      onChange={(storage) => setForm({ ...form, storage })}
                      placeholder="Elegir almacenamiento"
                      searchable
                      creatable
                      createLabel={(q) => `Usar “${q}”`}
                      fullWidth
                    />
                  </div>
                </div>
              )}

              {(form.category === "notebooks" || form.category === "macbooks") && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className={inputClass}
                    placeholder="Tamaño de pantalla (ej. 15.6 pulgadas)"
                    value={form.screenSize}
                    onChange={(e) =>
                      setForm({ ...form, screenSize: e.target.value })
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Memoria RAM (ej. 16 GB)"
                    value={form.ram}
                    onChange={(e) => setForm({ ...form, ram: e.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder="Disco rígido / almacenamiento (ej. 512 GB SSD)"
                    value={form.storage}
                    onChange={(e) =>
                      setForm({ ...form, storage: e.target.value })
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Placa de video aceleradora (ej. NVIDIA RTX 4060 o No)"
                    value={form.gpu}
                    onChange={(e) => setForm({ ...form, gpu: e.target.value })}
                  />
                  <ComboSelect
                    value={form.usageType}
                    options={NOTEBOOK_USAGE_OPTIONS}
                    onChange={(usageType) => setForm({ ...form, usageType })}
                    placeholder="Tipo de equipo"
                    fullWidth
                  />
                  <input
                    className={inputClass}
                    placeholder="Sistema operativo (ej. Windows 11 Home)"
                    value={form.operatingSystem}
                    onChange={(e) =>
                      setForm({ ...form, operatingSystem: e.target.value })
                    }
                  />
                  <input
                    className={`${inputClass} sm:col-span-2`}
                    placeholder="Procesador (ej. Intel Core i7 13620H)"
                    value={form.processor}
                    onChange={(e) =>
                      setForm({ ...form, processor: e.target.value })
                    }
                  />
                </div>
              )}

              <div>
                <div className="mb-2 text-[12px] font-semibold text-foreground">
                  Colores
                </div>
                <ColorSelect
                  value={form.colors}
                  onChange={(colors) => setForm({ ...form, colors })}
                  brand={form.brand}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="mb-2 text-[12px] font-semibold text-muted">
                Tags
              </div>
              <TagInput
                value={form.tags}
                onChange={(tags) => setForm({ ...form, tags })}
                placeholder="Tags (Enter): ej. gaming, 5g, oferta"
              />
            </div>

            <div className="md:col-span-2">
              <RichTextEditor
                value={form.description}
                onChange={(description) =>
                  setForm((prev) => ({ ...prev, description }))
                }
                placeholder="Descripción (opcional). Podés pegar texto con formato."
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="cursor-pointer rounded-lg border-none bg-primary px-4 py-2.5 text-sm font-bold !text-white"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="cursor-pointer rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>
          </div>
        </AdminFormModal>
      )}

      {coverSearchOpen && coverSearchProduct && (
        <AdminFormModal
          open
          title={`Buscar portada IA (${coverSearchIndex + 1}/${coverSearchQueueIds.length})`}
          onClose={closeCoverSearch}
          onSubmit={(e) => e.preventDefault()}
          maxWidth="3xl"
        >
          <div className="relative space-y-3">
            {coverSearchBusy && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-surface/75 backdrop-blur-[1px]">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground shadow-sm">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary/35 border-t-primary" />
                  {coverSearchSaving
                    ? "Guardando imagen seleccionada..."
                    : "Cargando resultados..."}
                </div>
              </div>
            )}
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="text-sm font-semibold">{coverSearchProduct.name}</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {coverSearchProduct.brand} · {categoryLabel(coverSearchProduct.category)}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={coverSearchQuery}
                onChange={(e) => setCoverSearchQuery(e.target.value)}
                placeholder="Consulta de búsqueda"
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => void fetchCoverCandidates(coverSearchQuery)}
                disabled={coverSearchBusy}
                className="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {coverSearchLoading ? "Buscando..." : "Buscar"}
              </button>
            </div>

            {coverSearchResults.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                {coverSearchLoading
                  ? "Buscando opciones de portada..."
                  : "Sin resultados. Probá ajustar la consulta."}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {coverSearchResults.map((candidate, idx) => (
                  <div
                    key={`${candidate.imageUrl}-${idx}`}
                    className="overflow-hidden rounded-lg border border-border bg-surface"
                  >
                    <button
                      type="button"
                      onClick={() => setCoverPreview(candidate)}
                      className="block h-36 w-full cursor-zoom-in border-none bg-white p-2"
                      aria-label={`Ampliar resultado ${idx + 1}`}
                    >
                      <img
                        src={candidate.thumbnailUrl || candidate.imageUrl}
                        alt={candidate.title || `Resultado ${idx + 1}`}
                        className="h-full w-full object-contain object-center"
                        loading="lazy"
                      />
                    </button>
                    <div className="space-y-2 p-2.5">
                      <p className="line-clamp-2 text-[12px] text-muted">
                        {candidate.title || "Imagen sin título"}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={coverSearchBusy}
                          onClick={() => {
                            void saveCoverForCurrent(candidate);
                          }}
                          className="cursor-pointer rounded-md border-none bg-primary px-2.5 py-1.5 text-[12px] font-bold text-white disabled:opacity-50"
                        >
                          {coverSearchSaving ? "Guardando..." : "Usar esta"}
                        </button>
                        <button
                          type="button"
                          disabled={coverSearchBusy}
                          onClick={() => {
                            void saveCoverForCurrent(candidate, {
                              whiteBackground: true,
                            });
                          }}
                          className="cursor-pointer rounded-md border border-border bg-surface px-2.5 py-1.5 text-[12px] font-semibold text-foreground disabled:opacity-50"
                        >
                          Fondo blanco
                        </button>
                        {candidate.sourceUrl ? (
                          <a
                            href={candidate.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-border px-2.5 py-1.5 text-[12px] font-semibold text-foreground no-underline hover:bg-accent-soft hover:!no-underline"
                          >
                            Fuente
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-2">
              <button
                type="button"
                disabled={coverSearchBusy}
                onClick={closeCoverSearch}
                className="cursor-pointer rounded-md border border-border bg-transparent px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={coverSearchBusy}
                onClick={goNextCoverProduct}
                className="cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {coverSearchLoading && !coverSearchSaving
                  ? "Omitiendo..."
                  : "Omitir y siguiente"}
              </button>
            </div>

            {coverPreview && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Vista previa de portada"
                className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4"
                onClick={() => setCoverPreview(null)}
              >
                <div
                  className="w-full max-w-4xl rounded-xl border border-border bg-surface p-3 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {coverPreview.title || "Vista previa"}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoverPreview(null)}
                      className="cursor-pointer rounded-md border border-border bg-surface px-2 py-1 text-xs font-semibold"
                    >
                      Cerrar
                    </button>
                  </div>
                  <div className="flex h-[70vh] max-h-[680px] items-center justify-center rounded-lg bg-white p-3">
                    <img
                      src={coverPreview.imageUrl}
                      alt={coverPreview.title || "Vista previa portada"}
                      className="h-full w-full object-contain object-center"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </AdminFormModal>
      )}

      <div className="rounded-xl border border-border bg-surface">
        {selectedCount > 0 && (
          <div className="flex flex-col gap-3 rounded-t-xl border-b border-border bg-primary-softer/60 px-4 py-3">
            {bulkBusy && bulkAction && (
              <div className="flex flex-col gap-2">
                <div className="text-sm font-semibold text-foreground">
                  {bulkAction}... ({bulkProgress.current}/{bulkProgress.total})
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-primary-softer">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{
                      width: `${
                        bulkProgress.total > 0
                          ? (bulkProgress.current / bulkProgress.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">
                {selectedCount} seleccionado{selectedCount === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                disabled={bulkBusy}
                onClick={clearSelection}
                className="cursor-pointer rounded-md border-none bg-transparent px-2 py-1 text-[12.5px] font-semibold text-muted"
              >
                Limpiar
              </button>
              <div className="flex-1" />
              <div ref={bulkMenuRef} className="relative">
                <button
                  type="button"
                  disabled={bulkBusy}
                  aria-haspopup="menu"
                  aria-expanded={bulkMenuOpen}
                  onClick={() => setBulkMenuOpen((v) => !v)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[13px] font-semibold disabled:opacity-50"
                >
                  Acciones masivas
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    className={`transition-transform ${bulkMenuOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    <path d="M3 4.5 6 7.5 9 4.5" />
                  </svg>
                </button>
                {bulkMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 z-30 mt-1.5 min-w-[220px] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-[0_12px_32px_rgba(0,0,0,0.16)]"
                  >
                    <BulkMenuItem
                      icon={<PowerOffIcon />}
                      label="Desactivar"
                      onClick={() =>
                        void runBulk(async () => {
                          setBulkMenuOpen(false);
                          await updateProducts(selectedIds(), {
                            active: false,
                          });
                        })
                      }
                    />
                    <BulkMenuItem
                      icon={<StarIcon />}
                      label="Destacar"
                      onClick={() =>
                        void runBulk(async () => {
                          setBulkMenuOpen(false);
                          await updateProducts(selectedIds(), {
                            featured: true,
                          });
                        })
                      }
                    />
                    <BulkMenuItem
                      icon={<StarOffIcon />}
                      label="Quitar destacado"
                      onClick={() =>
                        void runBulk(async () => {
                          setBulkMenuOpen(false);
                          await updateProducts(selectedIds(), {
                            featured: false,
                          });
                        })
                      }
                    />
                    <BulkMenuItem
                      icon={<TagIcon />}
                      label="Taguear"
                      onClick={() => openBulkPanel("tags")}
                    />
                    <BulkMenuItem
                      icon={<TagRemoveIcon />}
                      label="Quitar tags"
                      onClick={() => {
                        setBulkMenuOpen(false);
                        setBulkAction("Borrando tags");
                        void runBulk(async () => {
                          const ids = selectedIds();
                          setBulkProgress({ current: 0, total: ids.length });
                          for (let i = 0; i < ids.length; i++) {
                            await updateProduct(ids[i], { tags: [] });
                            setBulkProgress({ current: i + 1, total: ids.length });
                          }
                        });
                      }}
                    />
                    <BulkMenuItem
                      icon={<FolderIcon />}
                      label="Categoría y nombre"
                      onClick={() => openBulkPanel("category")}
                    />
                    <BulkMenuItem
                      icon={<BrandIcon />}
                      label="Marca"
                      onClick={() => openBulkPanel("brand")}
                    />
                    <BulkMenuItem
                      icon={<ImageIcon />}
                      label="Cargar imágenes"
                      onClick={() => {
                        setBulkMenuOpen(false);
                        openImages(selectedIds());
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                    <div className="my-1 border-t border-border-soft" />
                    <BulkMenuItem
                      icon={<TrashIcon />}
                      label="Eliminar"
                      danger
                      onClick={() => {
                        setBulkMenuOpen(false);
                        void (async () => {
                          const ok = await confirm({
                            title: "Eliminar productos",
                            message: `¿Eliminar ${selectedCount} producto${selectedCount === 1 ? "" : "s"}? Esta acción no se puede deshacer.`,
                            confirmLabel: "Eliminar",
                            tone: "danger",
                          });
                          if (!ok) return;
                          await runBulk(async () => {
                            await deleteProducts(selectedIds());
                          });
                        })();
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {bulkPanel === "tags" && (
              <div className="rounded-lg border border-border bg-surface p-3">
                <div className="mb-2 text-[11px] font-semibold tracking-wide text-muted uppercase">
                  Agregar tags a {selectedCount} producto
                  {selectedCount === 1 ? "" : "s"}
                </div>
                <TagInput
                  value={bulkTags}
                  onChange={setBulkTags}
                  placeholder="Tag + Enter…"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={bulkBusy || bulkTags.length === 0}
                    onClick={() =>
                      void runBulk(async () => {
                        const ids = selectedIds();
                        const catalog = useCatalogStore.getState().products;
                        for (const id of ids) {
                          const p = catalog.find((x) => x.id === id);
                          if (!p) continue;
                          const merged = [
                            ...new Set([
                              ...(p.tags ?? []),
                              ...bulkTags.map((t) => t.trim()).filter(Boolean),
                            ]),
                          ];
                          await updateProduct(id, { tags: merged });
                        }
                      })
                    }
                    className="cursor-pointer rounded-lg border-none bg-primary px-3 py-2 text-[12.5px] font-bold !text-white disabled:opacity-50"
                  >
                    Aplicar tags
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkPanel(null);
                      setBulkTags([]);
                    }}
                    className="cursor-pointer rounded-lg border border-border bg-transparent px-3 py-2 text-[12.5px] font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {bulkPanel === "category" && (
              <div className="rounded-lg border border-border bg-surface p-3">
                <div className="mb-2 text-[11px] font-semibold tracking-wide text-muted uppercase">
                  Cambiar categoría y/o nombre de {selectedCount} producto
                  {selectedCount === 1 ? "" : "s"}
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <ComboSelect
                    value={bulkCategory}
                    options={[
                      { value: "", label: "No cambiar categoría" },
                      ...bulkCategoryOptions,
                    ]}
                    onChange={(v) => {
                      setBulkCategory(v as CategoryId | "");
                      setBulkSubcategory("");
                    }}
                    placeholder="Categoría"
                    searchable
                    fullWidth
                  />
                  <ComboSelect
                    value={bulkSubcategory}
                    options={[
                      { value: "", label: "Sin subcategoría" },
                      ...subcategories
                        .filter(
                          (x) => x.categoryId === bulkCategory && x.active,
                        )
                        .map((x) => ({ value: x.name, label: x.name })),
                    ]}
                    onChange={setBulkSubcategory}
                    placeholder="Subcategoría"
                    fullWidth
                  />
                </div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    className={`${inputClass} min-w-0 flex-1`}
                    placeholder="Texto para agregar al nombre (ej. Televisor)"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                  <div className="flex shrink-0 overflow-hidden rounded-lg border border-border text-[12.5px] font-semibold">
                    {(
                      [
                        ["before", "Al inicio"],
                        ["after", "Al final"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setBulkTextPos(value)}
                        aria-pressed={bulkTextPos === value}
                        className={`cursor-pointer border-none px-3 py-2 ${
                          bulkTextPos === value
                            ? "bg-primary text-white"
                            : "bg-surface text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {bulkText.trim() && (
                  <p className="mt-2 text-xs text-muted">
                    Ejemplo:{" "}
                    <span className="font-semibold text-foreground">
                      {(() => {
                        const first = products.find((p) =>
                          selected.has(p.id),
                        );
                        return first
                          ? applyNameText(
                              first.name,
                              bulkText,
                              bulkTextPos,
                            )
                          : "";
                      })()}
                    </span>
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={
                      bulkBusy || (!bulkCategory && !bulkText.trim())
                    }
                    onClick={() => {
                      setBulkAction("Actualizando productos");
                      void runBulk(async () => {
                        const ids = selectedIds();
                        const text = bulkText.trim();
                        if (!text) {
                          await updateProducts(ids, {
                            category: bulkCategory as CategoryId,
                            subcategory: bulkSubcategory,
                          });
                          return;
                        }
                        const catalog = useCatalogStore.getState().products;
                        setBulkProgress({ current: 0, total: ids.length });
                        for (let i = 0; i < ids.length; i++) {
                          const p = catalog.find((x) => x.id === ids[i]);
                          if (p) {
                            await updateProduct(p.id, {
                              name: applyNameText(p.name, text, bulkTextPos),
                              ...(bulkCategory
                                ? {
                                    category: bulkCategory,
                                    subcategory: bulkSubcategory,
                                  }
                                : {}),
                            });
                          }
                          setBulkProgress({
                            current: i + 1,
                            total: ids.length,
                          });
                        }
                      });
                    }}
                    className="cursor-pointer rounded-lg border-none bg-primary px-3 py-2 text-[12.5px] font-bold !text-white disabled:opacity-50"
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkPanel(null);
                      setBulkCategory("");
                      setBulkSubcategory("");
                      setBulkText("");
                    }}
                    className="cursor-pointer rounded-lg border border-border bg-transparent px-3 py-2 text-[12.5px] font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {bulkPanel === "brand" && (
              <div className="rounded-lg border border-border bg-surface p-3">
                <div className="mb-2 text-[11px] font-semibold tracking-wide text-muted uppercase">
                  Cambiar marca
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <ComboSelect
                      value={bulkBrand}
                      options={[
                        { value: "", label: "Elegir…" },
                        ...brandOptions,
                      ]}
                      onChange={setBulkBrand}
                      placeholder="Marca"
                      searchPlaceholder="Buscar o agregar…"
                      searchable
                      creatable
                      createLabel={(q) => `Usar “${q}”`}
                      fullWidth
                    />
                  </div>
                  <button
                    type="button"
                    disabled={bulkBusy || !bulkBrand.trim()}
                    onClick={() =>
                      void runBulk(async () => {
                        const brand = normalizeBrandName(bulkBrand);
                        if (!brand) return;
                        const ensuredBrand = await ensureBrand(brand);
                        await updateProducts(selectedIds(), {
                          brand: ensuredBrand.name,
                        });
                      })
                    }
                    className="cursor-pointer rounded-lg border-none bg-primary px-3 py-2 text-[12.5px] font-bold !text-white disabled:opacity-50"
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkPanel(null);
                      setBulkBrand("");
                    }}
                    className="cursor-pointer rounded-lg border border-border bg-transparent px-3 py-2 text-[12.5px] font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className={`hidden gap-3 bg-primary-softer px-4 py-3 text-xs font-bold text-muted uppercase md:grid ${selectedCount === 0 ? "rounded-t-xl" : ""} ${TABLE_COLS}`}
        >
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              ref={(el) => {
                if (el) el.indeterminate = someFilteredSelected;
              }}
              onChange={toggleAllFiltered}
              aria-label="Seleccionar todo"
              className="h-4 w-4 cursor-pointer accent-[var(--primary)]"
            />
          </div>
          <div />
          <div>Producto</div>
          <div>Categoría</div>
          <div>$ Costo</div>
          <div>$ Venta</div>
          <div>Stock</div>
          <div>Estado</div>
          <div className="text-right">Acciones</div>
        </div>
        {filtered.map((p) => {
          const isSelected = selected.has(p.id);
          return (
            <div
              key={p.id}
              className={`grid grid-cols-1 gap-2 border-t border-border-soft px-4 py-3 text-sm md:items-center md:gap-3 ${TABLE_COLS} ${
                isSelected ? "bg-primary-softer/40" : ""
              }`}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(p.id)}
                  aria-label={`Seleccionar ${p.name}`}
                  className="h-4 w-4 cursor-pointer accent-[var(--primary)]"
                />
              </div>
              <ProductImage
                product={p}
                className="h-14 w-14 rounded-lg"
                sizes="56px"
              />
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-[12.5px] text-muted">{p.brand}</div>
                {!p.imageUrl && (
                  <div className="mt-1 text-[11.5px] font-semibold text-sale">
                    Sin imagen
                  </div>
                )}
                {(p.ram || p.storage) && (
                  <div className="mt-1 text-[11.5px] text-muted">
                    {[p.ram, p.storage].filter(Boolean).join(" · ")}
                  </div>
                )}
                {(p.colors ?? []).length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {p.colors.map((color) => {
                      const swatch = swatchForColor(color);
                      const light =
                        swatch === "#f4f4f4" ||
                        swatch === "#c0c4c8" ||
                        swatch === "#a8d4f0";
                      return (
                        <span
                          key={color}
                          className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-muted"
                        >
                          <span
                            className={`size-2.5 rounded-full ${light ? "border border-border" : ""}`}
                            style={{ backgroundColor: swatch }}
                            aria-hidden
                          />
                          {color}
                        </span>
                      );
                    })}
                  </div>
                )}
                {(p.tags ?? []).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-soft"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-muted">{categoryLabel(p.category)}</div>
              <div>
                <span className="mb-1 block text-[11px] font-semibold text-muted uppercase md:hidden">
                  $ Costo
                </span>
                <InlineCostEditor
                  product={p}
                  currency={storeCurrency}
                  onSave={async (costPrice, price) => {
                    try {
                      await updateProduct(p.id, { costPrice, price });
                    } catch (err) {
                      void notice({
                        title: "No se pudo guardar el costo",
                        message:
                          err instanceof Error ? err.message : "Error al guardar",
                      });
                      throw err;
                    }
                  }}
                />
              </div>
              <div>
                <span className="mb-1 block text-[11px] font-semibold text-muted uppercase md:hidden">
                  $ Venta
                </span>
                <div className="font-semibold tabular-nums">
                  {formatPrice(p.price)}
                </div>
              </div>
              <div className={p.stock === 0 ? "font-semibold text-sale" : ""}>
                {p.stock}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      try {
                        await updateProduct(p.id, { active: !p.active });
                      } catch (err) {
                        void notice({
                          title: "No se pudo cambiar el estado",
                          message:
                            err instanceof Error ? err.message : "Error",
                        });
                      }
                    })();
                  }}
                  className={`cursor-pointer rounded-full border-none px-2.5 py-1 text-[11.5px] font-bold tracking-wide uppercase ${
                    p.active
                      ? "bg-success-soft text-success-dark"
                      : "bg-accent-soft text-muted"
                  }`}
                  title={
                    p.active
                      ? "Click para desactivar"
                      : "Click para activar"
                  }
                >
                  {p.active ? "Activo" : "Inactivo"}
                </button>
              </div>
              <div
                data-ai-actions-root
                className="relative flex gap-1.5 md:justify-end"
              >
                <button
                  type="button"
                  onClick={() =>
                    setRowAiMenuId((prev) => (prev === p.id ? null : p.id))
                  }
                  aria-label={`Opciones IA para ${p.name}`}
                  title="Opciones IA"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-[#D4A017] hover:bg-accent-soft"
                >
                  {aiDescribeBusyId === p.id ? (
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/35 border-t-primary" />
                  ) : (
                    <SparklesIcon />
                  )}
                </button>
                {rowAiMenuId === p.id && (
                  <div className="absolute top-9 right-0 z-20 w-52 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-[0_12px_26px_rgba(0,0,0,0.16)]">
                    <button
                      type="button"
                      onClick={() => {
                        setRowAiMenuId(null);
                        openCoverSearch([p.id]);
                      }}
                      className="w-full cursor-pointer border-none bg-transparent px-3 py-2 text-left text-[12.5px] font-medium text-foreground hover:bg-accent-soft"
                    >
                      Buscar portada IA
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRowAiMenuId(null);
                        void autoCompleteDescription(p);
                      }}
                      className="w-full cursor-pointer border-none bg-transparent px-3 py-2 text-left text-[12.5px] font-medium text-foreground hover:bg-accent-soft"
                    >
                      Autocompletar descripción
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  aria-label={`Editar ${p.name}`}
                  title="Editar"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-accent-soft"
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      try {
                        const created = await addProduct({
                          name: `${p.name} (copia)`,
                          brand: p.brand,
                          category: p.category,
                          subcategory: p.subcategory,
                          provider: p.provider,
                          costPrice: p.costPrice,
                          price: p.price,
                          oldPrice: p.oldPrice,
                          stock: p.stock,
                          installments: p.installments,
                          description: p.description,
                          tags: [...(p.tags ?? [])],
                          colors: [...(p.colors ?? [])],
                          ram: p.ram ?? "",
                          storage: p.storage ?? "",
                          screenSize: p.screenSize ?? "",
                          processor: p.processor ?? "",
                          operatingSystem: p.operatingSystem ?? "",
                          gpu: p.gpu ?? "",
                          usageType: p.usageType ?? "",
                          imageUrl: p.imageUrl,
                          imageUrls: [...(p.imageUrls ?? [])],
                          active: false,
                          featured: false,
                        });
                        openEdit(created);
                      } catch (err) {
                        void notice({
                          title: "No se pudo clonar",
                          message:
                            err instanceof Error ? err.message : "Error",
                        });
                      }
                    })();
                  }}
                  aria-label={`Clonar ${p.name}`}
                  title="Clonar"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-accent-soft"
                >
                  <CloneIcon />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      const ok = await confirm({
                        title: "Eliminar producto",
                        message: `¿Eliminar “${p.name}”? Esta acción no se puede deshacer.`,
                        confirmLabel: "Eliminar",
                        tone: "danger",
                      });
                      if (!ok) return;
                      try {
                        await deleteProduct(p.id);
                        setSelected((prev) => {
                          const next = new Set(prev);
                          next.delete(p.id);
                          return next;
                        });
                      } catch (err) {
                        void notice({
                          title: "No se pudo eliminar",
                          message:
                            err instanceof Error ? err.message : "Error",
                        });
                      }
                    })();
                  }}
                  aria-label={`Eliminar ${p.name}`}
                  title="Eliminar"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-sale hover:bg-danger-soft"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InlineCostEditor({
  product,
  currency,
  onSave,
}: {
  product: Product;
  currency: CurrencyCode;
  onSave: (costPrice: number | null, price: number) => Promise<void>;
}) {
  const [draft, setDraft] = useState<number | null>(product.costPrice);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(product.costPrice);
  }, [product.id, product.costPrice]);

  const commit = async () => {
    if (saving) return;
    const same =
      draft === product.costPrice ||
      (draft == null && product.costPrice == null);
    if (same) return;
    const nextSale = salePriceFromCost(draft, product.price);
    setSaving(true);
    try {
      await onSave(draft, nextSale);
    } catch {
      setDraft(product.costPrice);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MoneyInput
      value={draft}
      onChange={setDraft}
      currency={currency}
      allowEmpty
      className={`${costInputClass} ${saving ? "opacity-60" : ""}`}
      onBlur={() => {
        void commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          setDraft(product.costPrice);
          e.currentTarget.blur();
        }
      }}
    />
  );
}

function BulkMenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-3 py-2.5 text-left text-[13px] font-medium hover:bg-accent-soft ${
        danger ? "text-sale hover:bg-danger-soft" : "text-foreground"
      }`}
    >
      <span
        className={`inline-flex size-7 shrink-0 items-center justify-center rounded-md ${
          danger
            ? "bg-danger-soft text-sale"
            : "bg-accent-soft text-muted"
        }`}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

function iconProps() {
  return {
    width: 15,
    height: 15,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
}

function PowerOffIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 2v10" />
      <path d="M18.4 6.6a8 8 0 1 1-12.8 0" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg {...iconProps()}>
      <path d="m12 3 2.7 5.5 6 .9-4.4 4.3 1 6L12 16.9 6.7 19.7l1-6L3.4 9.4l6-.9L12 3z" />
    </svg>
  );
}

function StarOffIcon() {
  return (
    <svg {...iconProps()}>
      <path d="m12 3 2.7 5.5 6 .9-4.4 4.3 1 6L12 16.9 6.7 19.7l1-6L3.4 9.4l6-.9L12 3z" />
      <path d="M4 4l16 16" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M20.6 13.4 12.7 21.3a1.4 1.4 0 0 1-2 0L2.7 13.3a2 2 0 0 1-.6-1.4V4a1.5 1.5 0 0 1 1.5-1.5h7.9a2 2 0 0 1 1.4.6l7.7 7.7a1.4 1.4 0 0 1 0 2z" />
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TagRemoveIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M20.6 13.4 12.7 21.3a1.4 1.4 0 0 1-2 0L2.7 13.3a2 2 0 0 1-.6-1.4V4a1.5 1.5 0 0 1 1.5-1.5h7.9a2 2 0 0 1 1.4.6l7.7 7.7a1.4 1.4 0 0 1 0 2z" />
      <line x1="6" y1="8" x2="9" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
      <circle cx="18" cy="17" r="2.5" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m21 16-5-5-9 9" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 3 13.8 7.2 18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
      <path d="M19 3v4" />
      <path d="M21 5h-4" />
      <path d="M4 14v3" />
      <path d="M5.5 15.5h-3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function CloneIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
