"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import {
  mapProduct,
  toProductInsert,
  type ProductRow,
} from "@/lib/supabase/mappers";
import type { CategoryId, Product } from "@/lib/products";

export type ProductInput = Omit<Product, "id" | "rating" | "reviews"> & {
  rating?: number;
  reviews?: number;
};

type CatalogState = {
  products: Product[];
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (input: ProductInput) => Promise<Product>;
  addProducts: (inputs: ProductInput[]) => Promise<Product[]>;
  updateProduct: (id: number, input: Partial<ProductInput>) => Promise<void>;
  updateProducts: (
    ids: number[],
    input: Partial<ProductInput>,
  ) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  deleteProducts: (ids: number[]) => Promise<void>;
  getProduct: (id: number) => Product | undefined;
};

export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  hydrated: false,
  fetchProducts: async () => {
    set({ loading: true, error: null });
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_products")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      set({ loading: false, error: error.message, hydrated: true });
      return;
    }

    set({
      products: ((data ?? []) as ProductRow[]).map(mapProduct),
      loading: false,
      hydrated: true,
      error: null,
    });
  },
  addProduct: async (input) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_products")
      .insert(toProductInsert(input))
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "No se pudo crear el producto");
    }

    const product = mapProduct(data as ProductRow);
    set((s) => ({ products: [...s.products, product] }));
    return product;
  },
  addProducts: async (inputs) => {
    if (inputs.length === 0) return [];
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_products")
      .insert(inputs.map(toProductInsert))
      .select("*");

    if (error || !data) {
      throw new Error(error?.message ?? "No se pudo importar el lote");
    }

    const products = (data as ProductRow[]).map(mapProduct);
    set((s) => ({ products: [...s.products, ...products] }));
    return products;
  },
  updateProduct: async (id, input) => {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.name != null) patch.name = input.name;
    if (input.brand != null) patch.brand = input.brand;
    if (input.category != null) patch.category = input.category;
    if (input.subcategory != null) patch.subcategory = input.subcategory;
    if (input.provider != null) patch.provider = input.provider;
    if (input.costPrice !== undefined) patch.cost_price = input.costPrice;
    if (input.price != null) patch.price = input.price;
    if (input.oldPrice !== undefined) patch.old_price = input.oldPrice;
    if (input.stock != null) patch.stock = input.stock;
    if (input.rating != null) patch.rating = input.rating;
    if (input.reviews != null) patch.reviews = input.reviews;
    if (input.installments != null) patch.installments = input.installments;
    if (input.description != null) patch.description = input.description;
    if (input.tags != null) patch.tags = input.tags;
    if (input.colors != null) patch.colors = input.colors;
    if (input.ram != null) patch.ram = input.ram;
    if (input.storage != null) patch.storage = input.storage;
    if (input.imageUrl !== undefined || input.imageUrls !== undefined) {
      const urls = [
        ...new Set(
          (input.imageUrls?.length
            ? input.imageUrls
            : input.imageUrl
              ? [input.imageUrl]
              : []
          ).filter(Boolean) as string[],
        ),
      ];
      patch.image_url = urls[0] ?? null;
      patch.image_urls = urls;
    }
    if (input.active != null) patch.active = input.active;
    if (input.featured != null) patch.featured = input.featured;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_products")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "No se pudo actualizar el producto");
    }

    const product = mapProduct(data as ProductRow);
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? product : p)),
    }));
  },
  updateProducts: async (ids, input) => {
    if (ids.length === 0) return;
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.brand != null) patch.brand = input.brand;
    if (input.category != null) patch.category = input.category;
    if (input.subcategory != null) patch.subcategory = input.subcategory;
    if (input.provider != null) patch.provider = input.provider;
    if (input.active != null) patch.active = input.active;
    if (input.featured != null) patch.featured = input.featured;
    if (input.installments != null) patch.installments = input.installments;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_products")
      .update(patch)
      .in("id", ids)
      .select("*");

    if (error || !data) {
      throw new Error(error?.message ?? "No se pudo actualizar el lote");
    }

    const updated = new Map(
      (data as ProductRow[]).map((row) => [Number(row.id), mapProduct(row)]),
    );
    set((s) => ({
      products: s.products.map((p) => updated.get(p.id) ?? p),
    }));
  },
  deleteProduct: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("ram_products").delete().eq("id", id);
    if (error) throw new Error(error.message);
    set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
  },
  deleteProducts: async (ids) => {
    if (ids.length === 0) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("ram_products")
      .delete()
      .in("id", ids);
    if (error) throw new Error(error.message);
    const remove = new Set(ids);
    set((s) => ({
      products: s.products.filter((p) => !remove.has(p.id)),
    }));
  },
  getProduct: (id) => get().products.find((p) => p.id === id),
}));

export type { CategoryId, Product };
