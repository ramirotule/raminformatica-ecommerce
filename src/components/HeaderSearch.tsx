"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArsPrice } from "@/components/ArsPrice";
import { ProductImage } from "@/components/ProductImage";
import { useCurrency } from "@/hooks/useCurrency";
import {
  categoryLabels,
  productHref,
  productMatchesQuery,
  type Product,
} from "@/lib/products";
import { useCatalogStore } from "@/store/catalog-store";

const MAX_RESULTS = 8;

export function HeaderSearch() {
  const router = useRouter();
  const products = useCatalogStore((s) => s.products);
  const { formatPrice } = useCurrency();
  const listId = useId();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const deferredSearch = useDeferredValue(search);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = deferredSearch.trim();

  const results = useMemo(() => {
    if (query.length < 2) return [] as Product[];
    return products
      .filter((p) => p.active && productMatchesQuery(p, query))
      .slice(0, MAX_RESULTS);
  }, [products, query]);

  const showPanel = open && query.length >= 2;

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  useEffect(() => {
    if (!showPanel) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showPanel]);

  const goToCatalog = (q: string) => {
    const trimmed = q.trim();
    setOpen(false);
    router.push(
      trimmed ? `/catalogo?q=${encodeURIComponent(trimmed)}` : "/catalogo",
    );
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && results[activeIndex]) {
      setOpen(false);
      router.push(productHref(results[activeIndex]));
      return;
    }
    goToCatalog(search);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPanel) return;
    const total = results.length + (results.length > 0 ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(total, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? total - 1 : i - 1));
    }
  };

  return (
    <div ref={rootRef} className="relative ml-2 hidden max-w-[520px] min-w-[260px] flex-1 md:block">
      <form onSubmit={onSubmit} role="search">
        <input
          ref={inputRef}
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscar productos, marcas..."
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={showPanel ? listId : undefined}
          aria-expanded={showPanel}
          className="w-full rounded-lg border border-border bg-accent-soft px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary"
        />
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+8px)] left-0 z-50 w-[max(100%,440px)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-[0_16px_40px_rgba(0,0,0,0.14)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
        >
          {results.length === 0 ? (
            <div className="px-4 py-5 text-sm text-muted">
              No encontramos productos para “{query}”.
            </div>
          ) : (
            <ul className="max-h-[min(70vh,420px)] overflow-y-auto py-1.5">
              {results.map((product, index) => {
                const active = index === activeIndex;
                return (
                  <li key={product.id} role="option" aria-selected={active}>
                    <Link
                      href={productHref(product)}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`flex items-center gap-3 px-3 py-2 no-underline hover:!no-underline ${
                        active ? "bg-primary-soft" : "hover:bg-accent-soft"
                      }`}
                    >
                      <ProductImage
                        product={product}
                        className="h-12 w-12 shrink-0 rounded-md border border-border-soft"
                        sizes="48px"
                        showDiscount={false}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-semibold text-foreground">
                          {product.name}
                        </div>
                        <div className="truncate text-[12px] text-muted">
                          {product.brand}
                          {categoryLabels[product.category]
                            ? ` · ${categoryLabels[product.category]}`
                            : ""}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[13px] font-bold tabular-nums text-foreground">
                          {formatPrice(product.price)}
                        </div>
                        <ArsPrice amount={product.price} className="text-[11px]" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={() => goToCatalog(search)}
            onMouseEnter={() => setActiveIndex(results.length)}
            className={`flex w-full cursor-pointer items-center justify-between border-none border-t border-border bg-transparent px-4 py-3 text-left text-[13px] font-semibold ${
              activeIndex === results.length
                ? "bg-primary-soft text-primary-dark"
                : "text-primary hover:bg-accent-soft"
            }`}
          >
            <span>
              {results.length > 0
                ? "Ver todos los resultados"
                : "Buscar en el catálogo"}
            </span>
            <span aria-hidden>→</span>
          </button>
        </div>
      )}
    </div>
  );
}
