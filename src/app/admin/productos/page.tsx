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
import { useBrandsStore } from "@/store/brands-store";
import { useCategoriesStore } from "@/store/categories-store";
import { useSubcategoriesStore } from "@/store/subcategories-store";
import { useProvidersStore } from "@/store/providers-store";
import { useStoreConfig } from "@/store/store-config";
import {
  currencyPrefix,
  normalizeCurrency,
  salePriceFromCost,
  type CurrencyCode,
} from "@/lib/format";

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

const INSTALLMENT_OPTIONS: { value: string; label: string }[] = [
  { value: "Hasta 3 cuotas sin interés", label: "Hasta 3 cuotas sin interés" },
  { value: "Hasta 6 cuotas sin interés", label: "Hasta 6 cuotas sin interés" },
  { value: "Hasta 12 cuotas sin interés", label: "Hasta 12 cuotas sin interés" },
  { value: "Precio de contado", label: "Precio de contado" },
];

const emptyForm = {
  name: "",
  brand: "",
  category: "celulares" as CategoryId,
  subcategory: "",
  provider: "",
  costPrice: null as number | null,
  price: null as number | null,
  stock: "",
  installments: "Hasta 6 cuotas sin interés",
  description: "",
  tags: [] as string[],
  colors: [] as string[],
  ram: "",
  storage: "",
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

type Panel = "none" | "form" | "bulk" | "images" | "prices" | "supplier";

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
  const subcategories = useMemo(
    () =>
      [...storeSubcategories].sort((a, b) =>
        a.name.localeCompare(b.name, "es"),
      ),
    [storeSubcategories],
  );
  const providers = useProvidersStore((s) => s.providers);
  const ensureProvider = useProvidersStore((s) => s.ensureProvider);

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
  const formPanelRef = useRef<HTMLFormElement>(null);
  const [bulkPanel, setBulkPanel] = useState<
    null | "tags" | "category" | "brand"
  >(null);
  const bulkMenuRef = useRef<HTMLDivElement>(null);

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
          p.description.toLowerCase().includes(q) ||
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
  const installmentOptions = useMemo(() => {
    const base = INSTALLMENT_OPTIONS.map((o) => ({ ...o }));
    if (
      form.installments &&
      !base.some((o) => o.value === form.installments)
    ) {
      base.unshift({
        value: form.installments,
        label: form.installments,
      });
    }
    return base;
  }, [form.installments]);

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
      description: p.description,
      tags: [...(p.tags ?? [])],
      colors: [...(p.colors ?? [])],
      ram: p.ram ?? "",
      storage: p.storage ?? "",
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

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const brandName = form.brand.trim();
    const providerName = form.provider.trim();
    const payload = {
      name: form.name.trim(),
      brand: brandName,
      category: form.category,
      subcategory: form.subcategory.trim(),
      provider: providerName,
      costPrice: form.costPrice,
      price: form.price ?? 0,
      oldPrice: null,
      stock: Number(form.stock) || 0,
      installments: form.installments.trim(),
      description: form.description.trim(),
      tags: form.tags,
      colors: form.colors,
      ram: form.ram.trim(),
      storage: form.storage.trim(),
      imageUrl: form.imageUrls[0] ?? null,
      imageUrls: form.imageUrls,
      active: form.active,
      featured: form.featured,
    };

    try {
      if (!brandName) {
        void notice({
          title: "Marca requerida",
          message: "Elegí o agregá una marca para el producto.",
        });
        return;
      }
      await ensureBrand(brandName);
      if (providerName) await ensureProvider(providerName);
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
          {missingImages.length > 0 && (
            <button
              type="button"
              onClick={() => openImages(missingImages)}
              className="cursor-pointer rounded-[9px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold"
            >
              Asignar imágenes ({missingImages.length})
            </button>
          )}
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
              onChange={(category) =>
                setForm({
                  ...form,
                  category,
                  subcategory: subcategories.some(
                    (x) =>
                      x.categoryId === category && x.name === form.subcategory,
                  )
                    ? form.subcategory
                    : "",
                })
              }
              placeholder="Categoría"
              searchPlaceholder="Buscar categoría…"
              searchable
              fullWidth
            />
            <ComboSelect
              value={form.subcategory}
              options={subcategoryOptions}
              onChange={(subcategory) => setForm({ ...form, subcategory })}
              placeholder="Subcategoría"
              searchPlaceholder="Buscar subcategoría…"
              searchable
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
              onChange={(costPrice) => setForm({ ...form, costPrice })}
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
              <ComboSelect
                value={form.installments}
                options={installmentOptions}
                onChange={(installments) => setForm({ ...form, installments })}
                placeholder="Cuotas / financiamiento"
                searchPlaceholder="Buscar opción de cuotas…"
                searchable
                fullWidth
              />
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

            <textarea
              className={`${inputClass} min-h-[90px] md:col-span-2`}
              placeholder="Descripción (opcional)"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
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
                        const brand = bulkBrand.trim();
                        if (!brand) return;
                        await ensureBrand(brand);
                        await updateProducts(selectedIds(), { brand });
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
              <div className="flex gap-1.5 md:justify-end">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  aria-label={`Editar ${p.name}`}
                  title="Editar"
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-accent-soft"
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
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-accent-soft"
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
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-sale hover:bg-danger-soft"
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
