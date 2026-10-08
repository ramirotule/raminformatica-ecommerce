"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

export type Category = {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
};

type CategoriesState = {
  categories: Category[];
  loading: boolean;
  hydrated: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (input: {
    id: string;
    name: string;
    sortOrder?: number;
  }) => Promise<Category>;
  updateCategory: (
    id: string,
    input: { name?: string; sortOrder?: number; active?: boolean },
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
};

function mapCategory(row: {
  id: string;
  name: string;
  sort_order: number;
  active: boolean | null;
}): Category {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    active: row.active ?? true,
  };
}

export function slugifyCategoryId(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  loading: false,
  hydrated: false,
  fetchCategories: async () => {
    set({ loading: true });
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      set({ loading: false, hydrated: true });
      return;
    }

    set({
      categories: (data ?? []).map(mapCategory),
      loading: false,
      hydrated: true,
    });
  },
  addCategory: async (input) => {
    const id = input.id.trim() || slugifyCategoryId(input.name);
    const name = input.name.trim();
    if (!id || !name) throw new Error("Nombre e id son obligatorios");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_categories")
      .insert({
        id,
        name,
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "Error al crear categoría");
    }
    const category = mapCategory(data);
    set((s) => ({
      categories: [...s.categories, category].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es"),
      ),
    }));
    return category;
  },
  updateCategory: async (id, input) => {
    const supabase = createClient();
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.name != null) patch.name = input.name.trim();
    if (input.sortOrder != null) patch.sort_order = input.sortOrder;
    if (input.active != null) patch.active = input.active;

    const { data, error } = await supabase
      .from("ram_categories")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "Error al actualizar categoría");
    }
    const category = mapCategory(data);
    set((s) => ({
      categories: s.categories
        .map((c) => (c.id === id ? category : c))
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es"),
        ),
    }));
  },
  deleteCategory: async (id) => {
    const supabase = createClient();
    const { count } = await supabase
      .from("ram_products")
      .select("id", { count: "exact", head: true })
      .eq("category", id);
    if ((count ?? 0) > 0) {
      throw new Error(
        "Hay productos en esta categoría. Reasignalos antes de borrarla.",
      );
    }
    const { error } = await supabase
      .from("ram_categories")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },
}));
