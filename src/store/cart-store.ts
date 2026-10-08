"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { useCatalogStore } from "@/store/catalog-store";
import { useStoreConfig } from "@/store/store-config";

export type CartItem = { id: number; qty: number };

type CartState = {
  items: CartItem[];
  userId: string | null;
  hydrated: boolean;
  syncing: boolean;
  /** Carga el carrito del usuario o mantiene el de invitado. */
  syncForUser: (userId: string | null) => Promise<void>;
  addItem: (id: number, qty?: number) => Promise<void>;
  setQty: (id: number, qty: number) => Promise<void>;
  changeQty: (id: number, delta: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: () => number;
  subtotal: () => number;
  shipping: () => number;
  total: () => number;
};

const GUEST_KEY = "ram-guest-cart";

function readGuestCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(GUEST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(GUEST_KEY, JSON.stringify(items));
}

function clearGuestCart() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GUEST_KEY);
}

function mergeItems(base: CartItem[], extra: CartItem[]): CartItem[] {
  const map = new Map<number, number>();
  for (const c of base) map.set(c.id, (map.get(c.id) ?? 0) + c.qty);
  for (const c of extra) map.set(c.id, (map.get(c.id) ?? 0) + c.qty);
  return [...map.entries()].map(([id, qty]) => ({ id, qty }));
}

async function requireUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function fetchDbCart(userId: string): Promise<CartItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ram_cart_items")
    .select("product_id, qty")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: Number(r.product_id),
    qty: Number(r.qty),
  }));
}

async function upsertDbItem(userId: string, productId: number, qty: number) {
  const supabase = createClient();
  const { error } = await supabase.from("ram_cart_items").upsert(
    {
      user_id: userId,
      product_id: productId,
      qty,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,product_id" },
  );
  if (error) throw new Error(error.message);
}

async function deleteDbItem(userId: string, productId: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("ram_cart_items")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);
  if (error) throw new Error(error.message);
}

async function clearDbCart(userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("ram_cart_items")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  userId: null,
  hydrated: false,
  syncing: false,

  syncForUser: async (userId) => {
    set({ syncing: true });
    try {
      if (!userId) {
        set({
          items: readGuestCart(),
          userId: null,
          hydrated: true,
          syncing: false,
        });
        return;
      }

      const guest = readGuestCart();
      let remote = await fetchDbCart(userId);

      if (guest.length) {
        const merged = mergeItems(remote, guest);
        // Persist merged to DB
        for (const item of merged) {
          await upsertDbItem(userId, item.id, item.qty);
        }
        // Remove products no longer in merged (shouldn't happen) 
        clearGuestCart();
        remote = await fetchDbCart(userId);
      }

      set({
        items: remote,
        userId,
        hydrated: true,
        syncing: false,
      });
    } catch {
      set({
        items: userId ? get().items : readGuestCart(),
        userId,
        hydrated: true,
        syncing: false,
      });
    }
  },

  addItem: async (id, qty = 1) => {
    const userId = get().userId ?? (await requireUserId());
    if (!userId) {
      const items = mergeItems(get().items, [{ id, qty }]);
      writeGuestCart(items);
      set({ items, userId: null });
      return;
    }

    const existing = get().items.find((c) => c.id === id);
    const nextQty = (existing?.qty ?? 0) + qty;
    await upsertDbItem(userId, id, nextQty);
    set((s) => ({
      userId,
      items: mergeItems(
        s.items.filter((c) => c.id !== id),
        [{ id, qty: nextQty }],
      ),
    }));
  },

  setQty: async (id, qty) => {
    const next = Math.max(1, qty);
    const userId = get().userId ?? (await requireUserId());
    if (!userId) {
      const items = get().items.map((c) =>
        c.id === id ? { ...c, qty: next } : c,
      );
      writeGuestCart(items);
      set({ items });
      return;
    }
    await upsertDbItem(userId, id, next);
    set((s) => ({
      items: s.items.map((c) => (c.id === id ? { ...c, qty: next } : c)),
    }));
  },

  changeQty: async (id, delta) => {
    const current = get().items.find((c) => c.id === id)?.qty ?? 1;
    await get().setQty(id, current + delta);
  },

  removeItem: async (id) => {
    const userId = get().userId ?? (await requireUserId());
    if (!userId) {
      const items = get().items.filter((c) => c.id !== id);
      writeGuestCart(items);
      set({ items });
      return;
    }
    await deleteDbItem(userId, id);
    set((s) => ({ items: s.items.filter((c) => c.id !== id) }));
  },

  clearCart: async () => {
    const userId = get().userId ?? (await requireUserId());
    if (!userId) {
      clearGuestCart();
      set({ items: [] });
      return;
    }
    await clearDbCart(userId);
    set({ items: [] });
  },

  cartCount: () => get().items.reduce((sum, c) => sum + c.qty, 0),
  subtotal: () => {
    const products = useCatalogStore.getState().products;
    return get().items.reduce((sum, c) => {
      const p = products.find((pp) => pp.id === c.id);
      return sum + (p ? p.price * c.qty : 0);
    }, 0);
  },
  shipping: () => {
    const subtotal = get().subtotal();
    const { freeShippingFrom, shippingCost } =
      useStoreConfig.getState().config;
    if (subtotal === 0 || subtotal > freeShippingFrom) return 0;
    return shippingCost;
  },
  total: () => get().subtotal() + get().shipping(),
}));
