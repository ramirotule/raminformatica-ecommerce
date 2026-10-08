"use client";

import { useMemo, useState } from "react";
import { AdminFormModal } from "@/components/admin/AdminFormModal";
import { useDialog } from "@/components/DialogProvider";
import type { Category } from "@/store/categories-store";
import { useSubcategoriesStore } from "@/store/subcategories-store";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary";

type Props = {
  category: Category | null;
  onClose: () => void;
};

export function SubcategoriesModal({ category, onClose }: Props) {
  const { confirm, notice } = useDialog();
  const all = useSubcategoriesStore((s) => s.subcategories);
  const add = useSubcategoriesStore((s) => s.addSubcategory);
  const update = useSubcategoriesStore((s) => s.updateSubcategory);
  const remove = useSubcategoriesStore((s) => s.deleteSubcategory);

  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const list = useMemo(
    () => all.filter((s) => s.categoryId === category?.id),
    [all, category?.id],
  );

  const fail = (err: unknown) =>
    void notice({
      title: "No se pudo guardar",
      message: err instanceof Error ? err.message : "Error",
    });

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !name.trim()) return;
    try {
      await add({
        categoryId: category.id,
        name,
        sortOrder: (list.at(-1)?.sortOrder ?? 0) + 1,
      });
      setName("");
    } catch (err) {
      fail(err);
    }
  };

  const onRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await update(id, { name: editName });
      setEditingId(null);
    } catch (err) {
      fail(err);
    }
  };

  return (
    <AdminFormModal
      open={category != null}
      title={`Subcategorías de ${category?.name ?? ""}`}
      onClose={onClose}
      onSubmit={onAdd}
      maxWidth="lg"
    >
      <div className="flex gap-2">
        <input
          className={inputClass}
          placeholder="Nueva subcategoría (ej. Gamer)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className="cursor-pointer rounded-lg border-none bg-primary px-4 py-2.5 text-sm font-bold whitespace-nowrap !text-white"
        >
          Agregar
        </button>
      </div>

      <ul className="mt-4 divide-y divide-border-soft rounded-lg border border-border">
        {list.length === 0 && (
          <li className="px-3 py-3 text-sm text-muted">
            Esta categoría todavía no tiene subcategorías.
          </li>
        )}
        {list.map((s) => (
          <li key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm">
            {editingId === s.id ? (
              <>
                <input
                  className={inputClass}
                  value={editName}
                  autoFocus
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void onRename(s.id);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => void onRename(s.id)}
                  className="cursor-pointer rounded-lg border-none bg-primary px-3 py-2 text-xs font-bold !text-white"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="cursor-pointer rounded-lg border border-border bg-transparent px-3 py-2 text-xs font-semibold"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <span
                  className={`flex-1 font-semibold ${s.active ? "" : "text-muted line-through"}`}
                >
                  {s.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(s.id);
                    setEditName(s.name);
                  }}
                  className="cursor-pointer rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold hover:bg-accent-soft"
                >
                  Renombrar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void update(s.id, { active: !s.active }).catch(fail)
                  }
                  className="cursor-pointer rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold hover:bg-accent-soft"
                >
                  {s.active ? "Desactivar" : "Activar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      const ok = await confirm({
                        title: "Eliminar subcategoría",
                        message: `¿Eliminar “${s.name}”? Los productos que la tengan conservan el texto.`,
                        confirmLabel: "Eliminar",
                        tone: "danger",
                      });
                      if (!ok) return;
                      try {
                        await remove(s.id);
                      } catch (err) {
                        fail(err);
                      }
                    })();
                  }}
                  className="cursor-pointer rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-sale hover:bg-danger-soft"
                >
                  Eliminar
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </AdminFormModal>
  );
}
