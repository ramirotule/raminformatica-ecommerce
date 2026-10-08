"use client";

import { useCallback, useMemo, useState } from "react";
import { AdminFormModal } from "@/components/admin/AdminFormModal";
import { SubcategoriesModal } from "@/components/admin/SubcategoriesModal";
import { useDialog } from "@/components/DialogProvider";
import { useSubcategoriesStore } from "@/store/subcategories-store";
import {
  slugifyCategoryId,
  useCategoriesStore,
  type Category,
} from "@/store/categories-store";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary";

export default function AdminCategoriasPage() {
  const { confirm, notice } = useDialog();
  const categories = useCategoriesStore((s) => s.categories);
  const addCategory = useCategoriesStore((s) => s.addCategory);
  const updateCategory = useCategoriesStore((s) => s.updateCategory);
  const deleteCategory = useCategoriesStore((s) => s.deleteCategory);

  const subcategories = useSubcategoriesStore((s) => s.subcategories);
  const [subFor, setSubFor] = useState<Category | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [active, setActive] = useState(true);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
    );
  }, [categories, query]);

  const closeForm = useCallback(() => {
    setOpen(false);
    setEditing(null);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setId("");
    setSortOrder(String((categories.at(-1)?.sortOrder ?? 0) + 1));
    setActive(true);
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setId(c.id);
    setSortOrder(String(c.sortOrder));
    setActive(c.active);
    setOpen(true);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCategory(editing.id, {
          name: name.trim(),
          sortOrder: Number(sortOrder) || 0,
          active,
        });
      } else {
        await addCategory({
          id: id.trim() || slugifyCategoryId(name),
          name: name.trim(),
          sortOrder: Number(sortOrder) || 0,
        });
      }
      closeForm();
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
          <h1 className="text-2xl font-bold">Categorías</h1>
          <p className="text-sm text-muted">{categories.length} categorías</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="cursor-pointer rounded-[9px] border-none bg-primary px-4 py-2.5 text-sm font-bold !text-white"
        >
          + Nueva categoría
        </button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar categoría…"
        className={`${inputClass} mb-5 max-w-md`}
      />

      <AdminFormModal
        open={open}
        title={editing ? `Editar ${editing.id}` : "Nueva categoría"}
        onClose={closeForm}
        onSubmit={onSave}
        maxWidth="xl"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className={inputClass}
            placeholder="Nombre (ej. Celulares)"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!editing) setId(slugifyCategoryId(e.target.value));
            }}
            required
          />
          <input
            className={inputClass}
            placeholder="Id / slug (ej. celulares)"
            value={id}
            onChange={(e) => setId(slugifyCategoryId(e.target.value))}
            required
            disabled={Boolean(editing)}
          />
          <input
            className={inputClass}
            placeholder="Orden"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
          {editing && (
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Activa
            </label>
          )}
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

      <SubcategoriesModal category={subFor} onClose={() => setSubFor(null)} />

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[80px_1fr_120px_100px_180px] gap-3 bg-primary-softer px-4 py-3 text-xs font-bold text-muted uppercase md:grid">
          <div>Orden</div>
          <div>Nombre</div>
          <div>Id</div>
          <div>Estado</div>
          <div className="text-right">Acciones</div>
        </div>
        {filtered.map((c) => (
          <div
            key={c.id}
            className="grid grid-cols-1 gap-2 border-t border-border-soft px-4 py-3 text-sm md:grid-cols-[80px_1fr_120px_100px_180px] md:items-center md:gap-3"
          >
            <div className="text-muted">{c.sortOrder}</div>
            <div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-muted">
                {subcategories.filter((x) => x.categoryId === c.id).length}{" "}
                subcategorías
              </div>
            </div>
            <div className="font-mono text-[12.5px] text-muted">{c.id}</div>
            <div className={c.active ? "text-success" : "text-sale"}>
              {c.active ? "Activa" : "Inactiva"}
            </div>
            <div className="flex gap-1.5 md:justify-end">
              <button
                type="button"
                onClick={() => setSubFor(c)}
                className="h-8 cursor-pointer rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold hover:bg-accent-soft"
              >
                Subcategorías
              </button>
              <button
                type="button"
                onClick={() => openEdit(c)}
                aria-label={`Editar ${c.name}`}
                title="Editar"
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-accent-soft"
              >
                <EditIcon />
              </button>
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    const ok = await confirm({
                      title: "Eliminar categoría",
                      message: `¿Eliminar “${c.name}”?`,
                      confirmLabel: "Eliminar",
                      tone: "danger",
                    });
                    if (!ok) return;
                    try {
                      await deleteCategory(c.id);
                    } catch (err) {
                      void notice({
                        title: "No se pudo eliminar",
                        message:
                          err instanceof Error ? err.message : "Error",
                      });
                    }
                  })();
                }}
                aria-label={`Eliminar ${c.name}`}
                title="Eliminar"
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-sale hover:bg-danger-soft"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
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

function EditIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
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
