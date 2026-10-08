"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ComboSelect } from "@/components/ComboSelect";
import { PriceRangeBar } from "@/components/PriceRangeBar";
import { ProductCard } from "@/components/ProductCard";
import { convertAmount, useCurrency } from "@/hooks/useCurrency";
import {
  categoryLabels,
  filterProducts,
  getAllBrands,
  type CategoryId,
  type SortOption,
} from "@/lib/products";
import { useCatalogStore } from "@/store/catalog-store";
import { useCategoriesStore } from "@/store/categories-store";
import { useSubcategoriesStore } from "@/store/subcategories-store";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevancia" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "name_asc", label: "Nombre: A → Z" },
  { value: "name_desc", label: "Nombre: Z → A" },
  { value: "category_asc", label: "Categoría: A → Z" },
  { value: "category_desc", label: "Categoría: Z → A" },
  { value: "brand_asc", label: "Marca: A → Z" },
  { value: "brand_desc", label: "Marca: Z → A" },
];

const PAGE_SIZE = 8;

export default function CatalogoClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency, storeCurrency, blueVenta } = useCurrency();
  const initialCat =
    (searchParams.get("categoria") as CategoryId | null) ?? "all";
  const initialQuery = searchParams.get("q") ?? "";
  const initialBrand = searchParams.get("marca") ?? "all";
  const products = useCatalogStore((s) => s.products);
  const storeCategories = useCategoriesStore((s) => s.categories);
  const storeSubcategories = useSubcategoriesStore((s) => s.subcategories);

  const brands = useMemo(() => getAllBrands(products), [products]);

  const [category, setCategory] = useState<CategoryId | "all">(
    initialCat === "all" || Boolean(initialCat) ? initialCat : "all",
  );
  const [brand, setBrand] = useState<string>(initialBrand || "all");
  const [subcategory, setSubcategory] = useState<string>(
    searchParams.get("subcategoria") ?? "all",
  );
  /** Rangos en moneda de visualización. */
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [filterByPrice, setFilterByPrice] = useState(false);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  /** En celular la lista de categorías es un acordeón (cerrado por defecto). */
  const [catOpen, setCatOpen] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    const cat = searchParams.get("categoria");
    setCategory(cat && cat !== "all" ? cat : "all");
    setSubcategory(searchParams.get("subcategoria") ?? "all");
    const marca = searchParams.get("marca");
    if (!marca) {
      setBrand("all");
      return;
    }
    const match = brands.find(
      (b) => b.toLowerCase() === marca.toLowerCase(),
    );
    setBrand(match ?? marca);
  }, [searchParams, brands]);

  const pushCatalogUrl = (next: {
    category?: CategoryId | "all";
    query?: string;
    brand?: string;
    subcategory?: string;
  }) => {
    const params = new URLSearchParams();
    const cat = next.category ?? category;
    const q = next.query !== undefined ? next.query : query;
    const b = next.brand ?? brand;
    const sub = next.subcategory ?? subcategory;

    if (cat && cat !== "all") params.set("categoria", cat);
    if (cat && cat !== "all" && sub && sub !== "all")
      params.set("subcategoria", sub);

    const trimmed = q.trim();
    if (trimmed) params.set("q", trimmed);

    if (b && b !== "all") params.set("marca", b);

    const qs = params.toString();
    router.push(qs ? `/catalogo?${qs}` : "/catalogo", { scroll: false });
  };

  const selectCategory = (id: CategoryId | "all") => {
    setCategory(id);
    // En celular, al elegir una categoría sin subcategorías se pliega el menú.
    if (!(subcategoriesByCategory.get(id)?.length ?? 0)) setCatOpen(false);
    setSubcategory("all");
    // Si la marca elegida no existe en la nueva categoría, se limpia.
    const available =
      id === "all"
        ? products
        : products.filter((p) => p.category === id);
    const keepBrand =
      brand === "all" ||
      available.some((p) => p.brand.toLowerCase() === brand.toLowerCase());
    if (!keepBrand) setBrand("all");
    pushCatalogUrl({
      category: id,
      brand: keepBrand ? brand : "all",
      subcategory: "all",
    });
  };

  const selectSubcategory = (name: string) => {
    setSubcategory(name);
    pushCatalogUrl({ subcategory: name });
  };

  const selectBrand = (nextBrand: string) => {
    setBrand(nextBrand);
    pushCatalogUrl({ brand: nextBrand });
  };

  /** Base sin filtro de precio (para rangos y conteos). */
  const baseList = useMemo(
    () =>
      filterProducts(
        {
          category,
          brand,
          subcategory,
          query,
          sort: "relevance",
        },
        products,
      ),
    [category, brand, subcategory, query, products],
  );

  const toStoreAmount = (amount: number) =>
    convertAmount(amount, currency, storeCurrency, blueVenta);

  const priceBounds = useMemo(() => {
    const prices = baseList.map((p) =>
      convertAmount(p.price, storeCurrency, currency, blueVenta),
    );
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (max <= min) return null;
    return { min, max };
  }, [baseList, currency, storeCurrency, blueVenta]);

  // Si cambia la moneda o el universo de precios, resetear el rango
  useEffect(() => {
    setMinPrice(undefined);
    setMaxPrice(undefined);
  }, [currency, category, brand, subcategory, query]);

  const storeMin =
    filterByPrice && minPrice != null ? toStoreAmount(minPrice) : undefined;
  const storeMax =
    filterByPrice && maxPrice != null ? toStoreAmount(maxPrice) : undefined;

  const filtered = useMemo(
    () =>
      filterProducts(
        {
          category,
          brand,
          subcategory,
          query,
          minPrice: storeMin,
          maxPrice: storeMax,
          sort,
        },
        products,
      ),
    [category, brand, subcategory, query, storeMin, storeMax, sort, products],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  // Reset página al cambiar filtros
  useEffect(() => {
    setPage(1);
  }, [category, brand, subcategory, query, storeMin, storeMax, sort]);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const goToPage = (p: number) => {
    const next = Math.min(totalPages, Math.max(1, p));
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categories: { id: CategoryId | "all"; label: string }[] = useMemo(() => {
    const fromStore = storeCategories
      .filter((c) => c.active)
      .map((c) => ({ id: c.id, label: c.name }));
    const list = (
      fromStore.length
        ? fromStore
        : Object.entries(categoryLabels).map(([id, label]) => ({
            id,
            label,
          }))
    ).sort((a, b) => a.label.localeCompare(b.label, "es"));
    return [{ id: "all", label: "Todos" }, ...list];
  }, [storeCategories]);

  /** Subcategorías activas con productos de cada categoría, ordenadas A → Z. */
  const subcategoriesByCategory = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const sub of storeSubcategories) {
      if (!sub.active) continue;
      const hasProducts = products.some(
        (p) =>
          p.category === sub.categoryId &&
          (p.subcategory ?? "").toLowerCase() === sub.name.toLowerCase(),
      );
      if (!hasProducts) continue;
      const list = map.get(sub.categoryId) ?? [];
      list.push(sub.name);
      map.set(sub.categoryId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.localeCompare(b, "es"));
    }
    return map;
  }, [storeSubcategories, products]);

  /** Solo las marcas que tienen productos en la categoría elegida. */
  const categoryBrands = useMemo(
    () =>
      getAllBrands(
        category === "all"
          ? products
          : products.filter((p) => p.category === category),
      ),
    [products, category],
  );

  const brandOptions = useMemo(
    () => [
      { value: "all", label: "Todas las marcas" },
      ...categoryBrands.map((b) => ({ value: b, label: b })),
    ],
    [categoryBrands],
  );

  const priceActive =
    filterByPrice && (minPrice != null || maxPrice != null);

  const activeFilters =
    (brand !== "all" ? 1 : 0) +
    (subcategory !== "all" ? 1 : 0) +
    (priceActive ? 1 : 0) +
    (query.trim() ? 1 : 0) +
    (category !== "all" ? 1 : 0);

  const clearFilters = () => {
    setCategory("all");
    setBrand("all");
    setSubcategory("all");
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setFilterByPrice(false);
    setQuery("");
    setSort("relevance");
    router.push("/catalogo", { scroll: false });
  };

  const categoryItems = (
    <>
                {categories.map((cat) => {
                  const active = cat.id === category;
                  const subs = subcategoriesByCategory.get(cat.id) ?? [];
                  return (
                    <div key={cat.id} className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => selectCategory(cat.id)}
                        aria-expanded={subs.length > 0 ? active : undefined}
                        className={`cursor-pointer rounded-lg border-none px-3 py-2.5 text-left text-sm ${
                          active
                            ? "bg-primary-soft font-bold text-primary-dark"
                            : "bg-transparent font-medium text-body-text"
                        }`}
                      >
                        {cat.label}
                      </button>
                      {active && subs.length > 0 && (
                        <div className="ml-3 flex flex-col gap-0.5 border-l border-border pl-2">
                          {subs.map((name) => {
                            const selected =
                              subcategory.toLowerCase() === name.toLowerCase();
                            return (
                              <button
                                key={name}
                                type="button"
                                // Tocar la elegida de nuevo la deselecciona.
                                onClick={() =>
                                  selectSubcategory(selected ? "all" : name)
                                }
                                aria-pressed={selected}
                                className={`cursor-pointer rounded-md border-none px-3 py-1.5 text-left text-[13px] ${
                                  selected
                                    ? "bg-primary-softer font-bold text-primary-dark"
                                    : "bg-transparent font-medium text-muted"
                                }`}
                              >
                                {name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
    </>
  );

  return (
    <>
      {/* Full-bleed: menú pegado a la izquierda del viewport */}
      <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2">
        <div className="px-4 pt-5 text-[13px] text-muted-soft md:px-6 lg:px-4 xl:px-5">
          <Link href="/" className="text-muted-soft">
            Inicio
          </Link>{" "}
          / <span className="text-foreground">Catálogo</span>
        </div>

        <div className="flex flex-col gap-5 px-4 py-5 pb-[60px] md:px-6 lg:flex-row lg:items-start lg:gap-6 lg:px-0 lg:pl-3 lg:pr-6 xl:pl-4 xl:pr-8">
          {/* Celular: categoría, luego marca + orden en una fila y buscador debajo */}
          <div className="space-y-3 lg:hidden">
            <button
              type="button"
              onClick={() => setCatOpen((v) => !v)}
              aria-expanded={catOpen}
              className="flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-left text-sm font-medium text-foreground"
            >
              <span className="truncate">
                <span className="text-muted">Categoría: </span>
                {categories.find((c) => c.id === category)?.label ?? "Todos"}
                {subcategory !== "all" ? ` · ${subcategory}` : ""}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className={`shrink-0 transition-transform ${catOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <path d="M3 4.5 6 7.5 9 4.5" />
              </svg>
            </button>
            {catOpen && (
              <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-1.5">
                {categoryItems}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <ComboSelect
                value={brand}
                options={brandOptions}
                onChange={selectBrand}
                placeholder="Marca"
                searchPlaceholder="Buscar marca…"
                searchable
                fullWidth
              />
              <ComboSelect
                value={sort}
                options={SORT_OPTIONS}
                onChange={setSort}
                placeholder="Ordenar"
                searchable
                searchPlaceholder="Buscar orden…"
                fullWidth
                menuAlignRight
              />
            </div>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar productos…"
              aria-label="Buscar productos"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary"
            />
          </div>

          <aside className="hidden w-full shrink-0 lg:block lg:space-y-7 lg:w-[210px] lg:pl-1 xl:w-[220px]">
            <div>
              <div className="mb-3 text-[13px] font-bold tracking-wide text-muted uppercase">
                Categoría
              </div>
              <div className="flex flex-col gap-1">
                {categoryItems}
              </div>
            </div>

            <div className="rounded-[10px] bg-primary-softer p-4 text-[12.5px] leading-relaxed text-muted">
              Precios con impuestos incluidos. Envío calculado en el checkout.
            </div>
          </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            <div className="shrink-0 text-sm text-muted">
              <span className="font-semibold text-foreground">
                {filtered.length}
              </span>{" "}
              {filtered.length === 1 ? "producto" : "productos"}
              {filtered.length > 0 && (
                <span className="ml-1.5 text-muted-soft">
                  · pág. {currentPage} de {totalPages}
                </span>
              )}
              {activeFilters > 0 && (
                <span className="ml-2 text-muted-soft">
                  · {activeFilters} filtro{activeFilters > 1 ? "s" : ""} activo
                  {activeFilters > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 lg:flex-nowrap lg:gap-4">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 lg:ml-6 xl:ml-10">
                {priceBounds && (
                  <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[13px] font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={filterByPrice}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setFilterByPrice(on);
                        if (!on) {
                          setMinPrice(undefined);
                          setMaxPrice(undefined);
                        }
                      }}
                      className="size-3.5 accent-primary"
                    />
                    Filtrar por precio
                  </label>
                )}

                {filterByPrice && priceBounds && (
                  <PriceRangeBar
                    minBound={priceBounds.min}
                    maxBound={priceBounds.max}
                    minValue={minPrice}
                    maxValue={maxPrice}
                    currency={currency}
                    onChange={(min, max) => {
                      setMinPrice(min);
                      setMaxPrice(max);
                    }}
                  />
                )}
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-2 max-lg:w-full lg:shrink-0 lg:justify-end">
                <ComboSelect
                  value={brand}
                  options={brandOptions}
                  onChange={selectBrand}
                  placeholder="Marca"
                  searchPlaceholder="Buscar marca…"
                  searchable
                  className="min-w-[140px] max-lg:hidden sm:min-w-[150px]"
                />
                {activeFilters > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="cursor-pointer border-none bg-transparent px-1 text-[12.5px] font-semibold whitespace-nowrap text-primary"
                  >
                    Limpiar
                  </button>
                )}
                <ComboSelect
                  className="max-lg:hidden"
                  label="Ordenar"
                  value={sort}
                  options={SORT_OPTIONS}
                  onChange={setSort}
                  searchable
                  searchPlaceholder="Buscar orden…"
                />
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
              <div className="mb-2 text-[15px] font-semibold">
                No hay productos con esos filtros
              </div>
              <div className="mb-5 text-sm text-muted">
                Probá limpiar marca, precio o la búsqueda.
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="cursor-pointer rounded-[9px] border-none bg-primary px-5 py-2.5 text-sm font-semibold text-white"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pageItems.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  aria-label="Paginación"
                  className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
                >
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                    className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-[13px] font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  {pageNumbers[0] > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => goToPage(1)}
                        className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-[13px] font-semibold"
                      >
                        1
                      </button>
                      {pageNumbers[0] > 2 && (
                        <span className="px-1 text-muted-soft">…</span>
                      )}
                    </>
                  )}
                  {pageNumbers.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => goToPage(n)}
                      aria-current={n === currentPage ? "page" : undefined}
                      className={`min-w-9 cursor-pointer rounded-lg border px-3 py-2 text-[13px] font-semibold ${
                        n === currentPage
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface text-foreground hover:bg-accent-soft"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                      {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                        <span className="px-1 text-muted-soft">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => goToPage(totalPages)}
                        className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-[13px] font-semibold"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                    className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-[13px] font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
