"use client";

import { create } from "zustand";
import type { CurrencyCode } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import {
  mapStoreConfig,
  toStoreConfigUpdate,
  type StoreConfigRow,
} from "@/lib/supabase/mappers";

export type HeroSlide = {
  imageUrl: string;
  mobileImageUrl?: string;
  href: string;
  title?: string;
};

export type GetnetConfig = {
  coefficient3: number;
  coefficient6: number;
  coefficient9: number;
  coefficient12: number;
  coefficient18: number;
  coefficient24: number;
  discountPct3: number;
  discountPct6: number;
  discountPct9: number;
  discountPct12: number;
  discountPct18: number;
  discountPct24: number;
  arancelInstallmentsPct: number;
  ivaPct: number;
};

export type PersonalCreditConfig = {
  surchargePct3: number;
  surchargePct6: number;
  surchargePct9: number;
  surchargePct12: number;
};

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
  maintenanceEnabled: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  heroSlides: HeroSlide[];
  getnet: GetnetConfig;
  personalCredit: PersonalCreditConfig;
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
  maintenanceEnabled: false,
  maintenanceTitle: "Estamos actualizando la pagina para una mejor experiencia.",
  maintenanceMessage: "Disculpe las molestias.",
  heroSlides: [],
  getnet: {
    coefficient3: 1.0913,
    coefficient6: 1.1666,
    coefficient9: 1.2724,
    coefficient12: 1.3659,
    coefficient18: 1.569,
    coefficient24: 1.795,
    // Referencia tomada de tu simulación real en Getnet (La Pampa).
    discountPct3: 14.7009,
    discountPct6: 20.7952,
    discountPct9: 28.1509,
    discountPct12: 33.6968,
    discountPct18: 43.4676,
    discountPct24: 51.7385,
    arancelInstallmentsPct: 2.53,
    ivaPct: 21,
  },
  personalCredit: {
    surchargePct3: 25,
    surchargePct6: 55,
    surchargePct9: 85,
    surchargePct12: 120,
  },
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
