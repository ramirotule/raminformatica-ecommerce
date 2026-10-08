"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import {
  mapAddress,
  mapOrder,
  mapProfile,
  type AddressRow,
  type OrderItemRow,
  type OrderRow,
  type ProfileRow,
} from "@/lib/supabase/mappers";
import type { Order } from "@/lib/products";
import { useStoreConfig } from "@/store/store-config";

export type Address = {
  id: string;
  label: string;
  street: string;
  city: string;
  province: string;
  zip: string;
  phone: string;
};

export type ProfileData = {
  name: string;
  email: string;
  phone: string;
  dni: string;
};

type AccountProfileState = {
  profile: ProfileData;
  addresses: Address[];
  orders: Order[];
  loading: boolean;
  hydrated: boolean;
  fetchAll: (userId: string) => Promise<void>;
  setProfile: (partial: Partial<ProfileData>) => Promise<void>;
  addAddress: (input: Omit<Address, "id">) => Promise<void>;
  updateAddress: (
    id: string,
    input: Partial<Omit<Address, "id">>,
  ) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  clear: () => void;
};

const emptyProfile: ProfileData = {
  name: "",
  email: "",
  phone: "",
  dni: "",
};

export const useAccountProfileStore = create<AccountProfileState>((set, get) => ({
  profile: emptyProfile,
  addresses: [],
  orders: [],
  loading: false,
  hydrated: false,
  clear: () =>
    set({
      profile: emptyProfile,
      addresses: [],
      orders: [],
      hydrated: false,
    }),
  fetchAll: async (userId) => {
    set({ loading: true });
    const supabase = createClient();
    const currency = useStoreConfig.getState().config.currency;

    const [profileRes, addrRes, ordersRes] = await Promise.all([
      supabase.from("ram_profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("ram_addresses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("ram_orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    const orderIds = (ordersRes.data ?? []).map((o) => o.id as string);
    let itemRows: OrderItemRow[] = [];
    if (orderIds.length) {
      const { data } = await supabase
        .from("ram_order_items")
        .select("*")
        .in("order_id", orderIds);
      itemRows = (data ?? []) as OrderItemRow[];
    }

    const orders = ((ordersRes.data ?? []) as OrderRow[]).map((o) =>
      mapOrder(
        o,
        itemRows.filter((i) => i.order_id === o.id),
        currency,
      ),
    );

    set({
      profile: profileRes.data
        ? mapProfile(profileRes.data as ProfileRow)
        : emptyProfile,
      addresses: ((addrRes.data ?? []) as AddressRow[]).map(mapAddress),
      orders,
      loading: false,
      hydrated: true,
    });
  },
  setProfile: async (partial) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No hay sesión");

    const next = { ...get().profile, ...partial };
    const { error } = await supabase.from("ram_profiles").upsert({
      id: user.id,
      name: next.name,
      email: next.email || user.email || "",
      phone: next.phone,
      dni: next.dni,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    set({ profile: next });
  },
  addAddress: async (input) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No hay sesión");

    const { data, error } = await supabase
      .from("ram_addresses")
      .insert({ ...input, user_id: user.id })
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Error");
    set((s) => ({
      addresses: [...s.addresses, mapAddress(data as AddressRow)],
    }));
  },
  updateAddress: async (id, input) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ram_addresses")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Error");
    set((s) => ({
      addresses: s.addresses.map((a) =>
        a.id === id ? mapAddress(data as AddressRow) : a,
      ),
    }));
  },
  deleteAddress: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("ram_addresses").delete().eq("id", id);
    if (error) throw new Error(error.message);
    set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) }));
  },
}));
