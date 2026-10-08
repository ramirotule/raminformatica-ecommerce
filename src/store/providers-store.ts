"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { mapProvider, type ProviderRow } from "@/lib/supabase/mappers";

export type Provider = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

type ProvidersState = {
  providers: Provider[];
  loading: boolean;
  hydrated: boolean;
  fetchProviders: () => Promise<void>;
  addProvider: (input: Omit<Provider, "id">) => Promise<Provider>;
  updateProvider: (
    id: string,
    input: Partial<Omit<Provider, "id">>,
  ) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  ensureProvider: (name: string) => Promise<Provider>;
};

export const useProvidersStore = create<ProvidersState>((set, get) => ({
  providers: [],
  loading: false,
  hydrated: false,
  fetchProviders: async () => {
    set({ loading: true });
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_providers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      set({ loading: false, hydrated: true });
      return;
    }

    set({
      providers: ((data ?? []) as ProviderRow[]).map(mapProvider),
      loading: false,
      hydrated: true,
    });
  },
  addProvider: async (input) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_providers")
      .insert(input)
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Error al crear");
    const provider = mapProvider(data as ProviderRow);
    set((s) => ({
      providers: [...s.providers, provider].sort((a, b) =>
        a.name.localeCompare(b.name, "es"),
      ),
    }));
    return provider;
  },
  updateProvider: async (id, input) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_providers")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Error al actualizar");
    const provider = mapProvider(data as ProviderRow);
    set((s) => ({
      providers: s.providers.map((p) => (p.id === id ? provider : p)),
    }));
  },
  deleteProvider: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("ram_providers").delete().eq("id", id);
    if (error) throw new Error(error.message);
    set((s) => ({ providers: s.providers.filter((p) => p.id !== id) }));
  },
  ensureProvider: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("El nombre del proveedor es obligatorio");
    const existing = get().providers.find(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) return existing;
    return get().addProvider({
      name: trimmed,
      contact: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    });
  },
}));
