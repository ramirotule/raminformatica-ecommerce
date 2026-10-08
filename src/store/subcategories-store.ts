"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

export type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  active: boolean;
};

type SubcategoriesState = {
  subcategories: Subcategory[];
  loading: boolean;
  hydrated: boolean;
  fetchSubcategories: () => Promise<void>;
  addSubcategory: (input: {
    categoryId: string;
    name: string;
    sortOrder?: number;
  }) => Promise<Subcategory>;
  updateSubcategory: (
    id: string,
    input: { name?: string; sortOrder?: number; active?: boolean },
  ) => Promise<void>;
  deleteSubcategory: (id: string) => Promise<void>;
};

type Row = {
  id: string;
  category_id: string;
  name: string;
  sort_order: number;
  active: boolean | null;
};

function mapSubcategory(row: Row): Subcategory {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    sortOrder: row.sort_order,
    active: row.active ?? true,
  };
}

const bySort = (a: Subcategory, b: Subcategory) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es");

export const useSubcategoriesStore = create<SubcategoriesState>((set) => ({
  subcategories: [],
  loading: false,
  hydrated: false,
  fetchSubcategories: async () => {
    set({ loading: true });
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_subcategories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    // Si la tabla todavía no existe, seguimos sin subcategorías.
    if (error) {
      set({ loading: false, hydrated: true });
      return;
    }

    set({
      subcategories: ((data ?? []) as Row[]).map(mapSubcategory),
      loading: false,
      hydrated: true,
    });
  },
  addSubcategory: async (input) => {
    const name = input.name.trim();
    if (!name) throw new Error("El nombre es obligatorio");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_subcategories")
      .insert({
        category_id: input.categoryId,
        name,
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(
        error?.code === "23505"
          ? "Ya existe una subcategoría con ese nombre en esta categoría"
          : (error?.message ?? "Error al crear subcategoría"),
      );
    }
    const sub = mapSubcategory(data as Row);
    set((s) => ({ subcategories: [...s.subcategories, sub].sort(bySort) }));
    return sub;
  },
  updateSubcategory: async (id, input) => {
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.name != null) patch.name = input.name.trim();
    if (input.sortOrder != null) patch.sort_order = input.sortOrder;
    if (input.active != null) patch.active = input.active;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_subcategories")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "Error al actualizar subcategoría");
    }
    const sub = mapSubcategory(data as Row);
    set((s) => ({
      subcategories: s.subcategories
        .map((x) => (x.id === id ? sub : x))
        .sort(bySort),
    }));
  },
  deleteSubcategory: async (id) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("ram_subcategories")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    set((s) => ({
      subcategories: s.subcategories.filter((x) => x.id !== id),
    }));
  },
}));
