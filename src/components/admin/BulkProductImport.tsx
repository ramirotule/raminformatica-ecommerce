"use client";

import { useMemo, useRef, useState } from "react";
import {
  buildBulkTemplateXlsx,
  parseBulkProductsFile,
  type BulkProductRow,
} from "@/lib/admin/bulk-products";
import { categoryLabels } from "@/lib/products";
import type { Product } from "@/lib/products";
import { useCatalogStore } from "@/store/catalog-store";

type Props = {
  onClose: () => void;
  onImported: (products: Product[]) => void;
};

export function BulkProductImport({ onClose, onImported }: Props) {
  const addProducts = useCatalogStore((s) => s.addProducts);
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<BulkProductRow[]>([]);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const validRows = useMemo(
    () => rows.filter((r) => r.errors.length === 0),
    [rows],
  );
  const invalidCount = rows.length - validRows.length;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setFatalError(null);
    setImportError(null);
    setFileName(file.name);
    const parsed = await parseBulkProductsFile(file);
    setFatalError(parsed.fatalError);
    setRows(parsed.rows);
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadTemplate = async () => {
    try {
      const blob = await buildBulkTemplateXlsx();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ram-productos-plantilla.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setFatalError(
        err instanceof Error
          ? err.message
          : "No se pudo generar la plantilla Excel",
      );
    }
  };

  const onImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    setImportError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        throw new Error("Sesión expirada. Volvé a iniciar sesión en el admin.");
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Sesión expirada. Volvé a iniciar sesión en el admin.");
      }

      const { useBrandsStore } = await import("@/store/brands-store");
      const ensureBrand = useBrandsStore.getState().ensureBrand;
      const brands = [
        ...new Set(
          validRows
            .map((r) => r.brand?.trim())
            .filter((b): b is string => Boolean(b)),
        ),
      ];
      for (const brand of brands) {
        await ensureBrand(brand);
      }
      const created = await addProducts(
        validRows.map(
          ({
            rowNumber: _r,
            errors: _e,
            ...input
          }) => input,
        ),
      );
      onImported(created);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "No se pudo importar el Excel",
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-border bg-surface p-5">
      <div className="mb-1 text-sm font-bold">Carga masiva de productos</div>
      <p className="mb-4 text-[13px] text-muted">
        Subí un Excel (.xlsx) con estos campos: nombre, marca, categoria,
        subcategoria, proveedor, descrip_prov, precio_costo, precio_venta,
        stock, imagenes, activo, destacado. Las imágenes también se pueden
        asignar después.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void downloadTemplate()}
          className="cursor-pointer rounded-lg border border-border bg-transparent px-3.5 py-2 text-[13px] font-semibold"
        >
          Descargar plantilla Excel
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer rounded-lg border-none bg-primary px-3.5 py-2 text-[13px] font-bold !text-white"
        >
          Elegir Excel…
        </button>
        {fileName && (
          <span className="self-center text-[12.5px] text-muted">{fileName}</span>
        )}
      </div>

      {fatalError && (
        <p className="mb-3 text-[13px] font-medium text-sale">{fatalError}</p>
      )}

      {rows.length > 0 && !fatalError && (
        <>
          <div className="mb-3 flex flex-wrap gap-3 text-[13px]">
            <span className="font-semibold text-foreground">
              {validRows.length} listos
            </span>
            {invalidCount > 0 && (
              <span className="font-semibold text-sale">
                {invalidCount} con error
              </span>
            )}
          </div>

          <div className="mb-4 max-h-64 overflow-auto rounded-lg border border-border">
            <table className="w-full min-w-[720px] border-collapse text-left text-[12.5px]">
              <thead className="sticky top-0 bg-primary-softer text-muted">
                <tr>
                  <th className="px-3 py-2 font-bold">#</th>
                  <th className="px-3 py-2 font-bold">Nombre</th>
                  <th className="px-3 py-2 font-bold">Marca</th>
                  <th className="px-3 py-2 font-bold">Cat.</th>
                  <th className="px-3 py-2 font-bold">Costo</th>
                  <th className="px-3 py-2 font-bold">Venta</th>
                  <th className="px-3 py-2 font-bold">Stock</th>
                  <th className="px-3 py-2 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.rowNumber}
                    className="border-t border-border-soft align-top"
                  >
                    <td className="px-3 py-2 text-muted">{r.rowNumber}</td>
                    <td className="px-3 py-2 font-medium">{r.name || "—"}</td>
                    <td className="px-3 py-2">{r.brand || "—"}</td>
                    <td className="px-3 py-2">
                      {categoryLabels[r.category] ?? r.category}
                      {r.subcategory ? (
                        <span className="text-muted-soft">
                          {" "}
                          / {r.subcategory}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{r.costPrice ?? "—"}</td>
                    <td className="px-3 py-2">{r.price}</td>
                    <td className="px-3 py-2">{r.stock}</td>
                    <td className="px-3 py-2">
                      {r.errors.length === 0 ? (
                        <span className="text-[12px] font-semibold text-primary">
                          OK
                          {!r.active ? " · inactivo" : ""}
                          {r.featured ? " · destacado" : ""}
                        </span>
                      ) : (
                        <span className="text-[12px] font-medium text-sale">
                          {r.errors.join("; ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {importError && (
        <p className="mb-3 text-[13px] font-medium text-sale">{importError}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={importing || validRows.length === 0}
          onClick={() => void onImport()}
          className="cursor-pointer rounded-lg border-none bg-primary px-4 py-2.5 text-sm font-bold !text-white disabled:opacity-50"
        >
          {importing
            ? "Importando…"
            : `Importar ${validRows.length || ""} productos`}
        </button>
        <button
          type="button"
          disabled={importing}
          onClick={onClose}
          className="cursor-pointer rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-semibold"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
