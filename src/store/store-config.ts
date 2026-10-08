"use client";

import { create } from "zustand";
import type { CurrencyCode } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import {
  mapStoreConfig,
  toStoreConfigUpdate,
  type StoreConfigRow,
} from "@/lib/supabase/mappers";

export type StoreConfig = {
  storeName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  currency: CurrencyCode;
  freeShippingFrom: number;
  shippingCost: number;
  installmentsEnabled: boolean;
  maxInstallments: number;
  announcement: string;
};

type ConfigState = {
  config: StoreConfig;
  loading: boolean;
  hydrated: boolean;
  fetchConfig: () => Promise<void>;
  updateConfig: (partial: Partial<StoreConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
};

const defaultConfig: StoreConfig = {
  storeName: "RAM Informatica",
  tagline: "Tecnologia • Innovacion • Tu mundo",
  supportEmail: "raminformatik@gmail.com",
  supportPhone: "2954227622",
  currency: "USD",
  freeShippingFrom: 500000,
  shippingCost: 15000,
  installmentsEnabled: true,
  maxInstallments: 12,
  announcement: "Hasta 12 cuotas sin interés en productos seleccionados.",
};

export const useStoreConfig = create<ConfigState>((set, get) => ({
  config: defaultConfig,
  loading: false,
  hydrated: false,
  fetchConfig: async () => {
    set({ loading: true });
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_store_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      set({ loading: false, hydrated: true });
      return;
    }

    set({
      config: mapStoreConfig(data as StoreConfigRow),
      loading: false,
      hydrated: true,
    });
  },
  updateConfig: async (partial) => {
    const next = { ...get().config, ...partial };
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_store_config")
      .upsert({ id: 1, ...toStoreConfigUpdate(next) })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "No se pudo guardar la configuración");
    }

    set({ config: mapStoreConfig(data as StoreConfigRow) });
  },
  resetConfig: async () => {
    await get().updateConfig(defaultConfig);
  },
}));
