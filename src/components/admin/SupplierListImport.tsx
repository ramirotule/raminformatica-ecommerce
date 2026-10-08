"use client";

import { useMemo, useState } from "react";
import { ComboSelect } from "@/components/ComboSelect";
import { useDialog } from "@/components/DialogProvider";
import { useStoreCurrency } from "@/hooks/useCurrency";
import { normalizeKey } from "@/lib/admin/bulk-products";
import {
  inferBrandAndCategory,
  parseSupplierPriceText,
  productInputFromSupplierEntry,
} from "@/lib/admin/supplier-price-update";
import { salePriceFromCost } from "@/lib/format";
import { useBrandsStore } from "@/store/brands-store";
import { useCatalogStore, type ProductInput } from "@/store/catalog-store";
import { useCategoriesStore } from "@/store/categories-store";
import { useProvidersStore } from "@/store/providers-store";
import { useSubcategoriesStore } from "@/store/subcategories-store";

type Props = {
  onClose: () => void;
  onImported?: (created: { id: number }[]) => void;
};

type Row = {
  key: string;
  include: boolean;
  exists: boolean;
  name: string;
  brand: string;
  cost: number;
  price: number;
  category: string;
  subcategory: string;
  colors: string[];
  base: ReturnType<typeof productInputFromSupplierEntry>;
};

const cellInput =
  "w-full rounded-md border border-border bg-background px-2 py-1.5 text-[12.5px] text-foreground outline-none focus:border-primary";

export function SupplierListImport({ onClose, onImported }: Props) {
  const { notice } = useDialog();
  const { formatPrice } = useStoreCurrency();
  const providers = useProvidersStore((s) => s.providers);
  const ensureProvider = useProvidersStore((s) => s.ensureProvider);
  const ensureBrand = useBrandsStore((s) => s.ensureBrand);
  const categories = useCategoriesStore((s) => s.categories);
  const subcategories = useSubcategoriesStore((s) => s.subcategories);
  const products = useCatalogStore((s) => s.products);
  const addProducts = useCatalogStore((s) => s.addProducts);

  const [provider, setProvider] = useState("");
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkSub, setBulkSub] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const activeCategories = useMemo(
    () =>
      categories
        .filter((c) => c.active)
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [categories],
  );
  const categoryOptions = useMemo(
    () => [
      { value: "", label: "Elegir…" },
      ...activeCategories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [activeCategories],
  );
  const providerOptions = useMemo(
    () => providers.map((p) => ({ value: p.name, label: p.name })),
    [providers],
  );

  const subsFor = (categoryId: string) => [
    { value: "", label: "—" },
    ...subcategories
      .filter((s) => s.categoryId === categoryId && s.active)
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
      .map((s) => ({ value: s.name, label: s.name })),
  ];

  const existingKeys = useMemo(
    () =>
      new Set(
        products
          .filter(
            (p) =>
              !provider ||
              !p.provider ||
              normalizeKey(p.provider) === normalizeKey(provider),
          )
          .map((p) => normalizeKey(p.name)),
      ),
    [products, provider],
  );

  const onAnalyze = () => {
    setError(null);
    setDone(null);
    if (!provider.trim()) {
      setError("Elegí primero el proveedor.");
      return;
    }
    const entries = parseSupplierPriceText(text);
    if (entries.length === 0) {
      setRows(null);
      setError(
        "No pude leer productos. Pegá el listado con líneas ▪️ NOMBRE - $ PRECIO.",
      );
      return;
    }
    const validCategory = new Set(activeCategories.map((c) => c.id));
    setRows(
      entries.map((entry, i) => {
        const base = productInputFromSupplierEntry(entry);
        const inferred = inferBrandAndCategory(entry).category;
        const exists = existingKeys.has(normalizeKey(base.name));
        return {
          key: `${entry.lineNumber}-${i}`,
          include: !exists,
          exists,
          name: base.name,
          brand: base.brand,
          cost: entry.cost,
          price: salePriceFromCost(entry.cost, 0),
          category: validCategory.has(inferred) ? inferred : "",
          subcategory: "",
          colors: entry.tags,
          base,
        };
      }),
    );
  };

  const patchRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) =>
      rs ? rs.map((r) => (r.key === key ? { ...r, ...patch } : r)) : rs,
    );

  const selected = rows?.filter((r) => r.include) ?? [];
  const missingCategory = selected.filter((r) => !r.category).length;

  const applyBulk = () => {
    if (!bulkCategory) return;
    setRows((rs) =>
      rs
        ? rs.map((r) =>
            r.include
              ? { ...r, category: bulkCategory, subcategory: bulkSub }
              : r,
          )
        : rs,
    );
  };

  const onImport = async () => {
    if (!rows) return;
    if (selected.length === 0) {
      setError("No hay productos seleccionados.");
      return;
    }
    if (missingCategory > 0) {
      setError(
        `Falta asignar categoría a ${missingCategory} producto${missingCategory === 1 ? "" : "s"}.`,
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const prov = await ensureProvider(provider);
      const brandNames = [...new Set(selected.map((r) => r.brand.trim()))];
      for (const b of brandNames) if (b) await ensureBrand(b);

      const inputs: ProductInput[] = selected.map((r) => ({
        ...r.base,
        name: r.name.trim(),
        brand: r.brand.trim() || "Genérico",
        category: r.category,
        subcategory: r.subcategory,
        provider: prov.name,
        costPrice: r.cost,
        price: r.price,
        colors: r.colors,
        description: r.base.description,
      }));
      const created = await addProducts(inputs);
      setDone(
        `Listo: se crearon ${created.length} producto${created.length === 1 ? "" : "s"} de ${prov.name}.`,
      );
      setRows(null);
      setText("");
      onImported?.(created);
    } catch (err) {
      void notice({
        title: "No se pudo importar",
        message: err instanceof Error ? err.message : "Error al importar",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Importar listado de proveedor</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Elegí el proveedor, pegá su lista y asigná categoría y subcategoría
            a cada producto. El precio de venta se calcula desde el costo y lo
            podés ajustar antes de importar.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-semibold"
        >
          Cerrar
        </button>
      </div>

      <div className="mb-3 max-w-sm">
        <ComboSelect
          value={provider}
          options={providerOptions}
          onChange={(v) => {
            setProvider(v);
            setRows(null);
          }}
          placeholder="Proveedor"
          searchPlaceholder="Buscar o agregar proveedor…"
          searchable
          creatable
          createLabel={(q) => `Agregar proveedor “${q}”`}
          fullWidth
        />
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setRows(null);
          setDone(null);
        }}
        placeholder="Pegá acá el listado del proveedor (► secciones, ▪️ productos - $ precio, colores abajo)…"
        className="min-h-[200px] w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-foreground outline-none focus:border-primary"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAnalyze}
          className="cursor-pointer rounded-lg border-none bg-primary px-4 py-2.5 text-sm font-bold !text-white"
        >
          Analizar listado
        </button>
        <button
          type="button"
          disabled={!rows || busy || selected.length === 0}
          onClick={() => void onImport()}
          className="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Importando…" : `Importar (${selected.length})`}
        </button>
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-sale">{error}</p>}
      {done && (
        <p className="mt-3 text-sm font-semibold text-success-dark">{done}</p>
      )}

      {rows && (
        <>
          <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg bg-primary-softer p-3">
            <div className="text-[11px] font-bold tracking-wide text-muted uppercase">
              Asignar a los seleccionados
            </div>
            <div className="w-44">
              <ComboSelect
                value={bulkCategory}
                options={categoryOptions}
                onChange={(v) => {
                  setBulkCategory(v);
                  setBulkSub("");
                }}
                placeholder="Categoría"
                fullWidth
              />
            </div>
            <div className="w-44">
              <ComboSelect
                value={bulkSub}
                options={subsFor(bulkCategory)}
                onChange={setBulkSub}
                placeholder="Subcategoría"
                fullWidth
              />
            </div>
            <button
              type="button"
              disabled={!bulkCategory}
              onClick={applyBulk}
              className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Aplicar
            </button>
            <span className="ml-auto text-xs text-muted">
              {selected.length} de {rows.length} seleccionados
              {missingCategory > 0 && (
                <span className="font-semibold text-sale">
                  {" "}
                  · {missingCategory} sin categoría
                </span>
              )}
            </span>
          </div>

          <div className="mt-3 max-h-[520px] overflow-auto rounded-lg border border-border">
            <table className="w-full min-w-[980px] border-collapse text-left text-[12.5px]">
              <thead className="sticky top-0 z-10 bg-primary-softer text-muted">
                <tr>
                  <th className="w-9 px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todos"
                      checked={rows.length > 0 && rows.every((r) => r.include)}
                      onChange={(e) =>
                        setRows(
                          rows.map((r) => ({ ...r, include: e.target.checked })),
                        )
                      }
                    />
                  </th>
                  <th className="px-3 py-2 font-bold">Producto</th>
                  <th className="px-3 py-2 font-bold">Marca</th>
                  <th className="px-3 py-2 font-bold">Costo</th>
                  <th className="px-3 py-2 font-bold">Venta</th>
                  <th className="px-3 py-2 font-bold">Categoría</th>
                  <th className="px-3 py-2 font-bold">Subcategoría</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.key}
                    className={`border-t border-border-soft ${r.include ? "" : "opacity-50"}`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={r.include}
                        onChange={(e) =>
                          patchRow(r.key, { include: e.target.checked })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className={cellInput}
                        value={r.name}
                        onChange={(e) =>
                          patchRow(r.key, { name: e.target.value })
                        }
                      />
                      {r.exists && (
                        <div className="mt-1 text-[11px] font-semibold text-warning">
                          Ya existe en el catálogo
                        </div>
                      )}
                      {r.colors.length > 0 && (
                        <div className="mt-1 text-[11px] text-muted">
                          {r.colors.join(" · ")}
                        </div>
                      )}
                    </td>
                    <td className="w-32 px-3 py-2">
                      <input
                        className={cellInput}
                        value={r.brand}
                        onChange={(e) =>
                          patchRow(r.key, { brand: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                      {formatPrice(r.cost)}
                    </td>
                    <td className="w-32 px-3 py-2">
                      <input
                        className={`${cellInput} tabular-nums`}
                        type="number"
                        min={0}
                        value={r.price}
                        onChange={(e) =>
                          patchRow(r.key, { price: Number(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td className="w-44 px-3 py-2">
                      <select
                        className={`${cellInput} ${r.include && !r.category ? "border-sale" : ""}`}
                        value={r.category}
                        onChange={(e) =>
                          patchRow(r.key, {
                            category: e.target.value,
                            subcategory: "",
                          })
                        }
                      >
                        {categoryOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="w-44 px-3 py-2">
                      <select
                        className={cellInput}
                        value={r.subcategory}
                        disabled={!r.category}
                        onChange={(e) =>
                          patchRow(r.key, { subcategory: e.target.value })
                        }
                      >
                        {subsFor(r.category).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
