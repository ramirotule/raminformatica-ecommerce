"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart-store";
import { useCatalogStore } from "@/store/catalog-store";
import { useStoreConfig } from "@/store/store-config";

export type PaymentMethod = "card" | "installments" | "transfer";

type ShippingForm = {
  name: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
};

export type ConfirmOrderResult =
  | { ok: true }
  | { ok: false; error: string; needsAuth?: boolean };

type CheckoutState = {
  step: 1 | 2 | 3;
  payment: PaymentMethod;
  orderConfirmed: boolean;
  placing: boolean;
  lastError: string | null;
  shipping: ShippingForm;
  setStep: (step: 1 | 2 | 3) => void;
  setPayment: (payment: PaymentMethod) => void;
  setShipping: (partial: Partial<ShippingForm>) => void;
  confirmOrder: () => Promise<ConfirmOrderResult>;
  resetCheckout: () => void;
};

const emptyShipping: ShippingForm = {
  name: "",
  address: "",
  city: "",
  zip: "",
  phone: "",
};

const paymentLabels: Record<PaymentMethod, string> = {
  card: "Tarjeta de crédito",
  installments: "Pagar en Cuotas",
  transfer: "Transferencia bancaria",
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      step: 1,
      payment: "installments",
      orderConfirmed: false,
      placing: false,
      lastError: null,
      shipping: emptyShipping,
      setStep: (step) => set({ step, orderConfirmed: false }),
      setPayment: (payment) => set({ payment }),
      setShipping: (partial) =>
        set((s) => ({ shipping: { ...s.shipping, ...partial } })),
      resetCheckout: () =>
        set({
          step: 1,
          payment: "installments",
          orderConfirmed: false,
          placing: false,
          lastError: null,
          shipping: emptyShipping,
        }),
      confirmOrder: async () => {
        set({ placing: true, lastError: null });
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          set({ placing: false });
          return {
            ok: false,
            needsAuth: true,
            error: "Iniciá sesión para confirmar el pedido.",
          };
        }

        const items = useCartStore.getState().items;
        const products = useCatalogStore.getState().products;
        const subtotal = useCartStore.getState().subtotal();
        const shippingCost = useCartStore.getState().shipping();
        const total = useCartStore.getState().total();
        const { shipping, payment } = get();

        if (!items.length) {
          set({ placing: false });
          return { ok: false, error: "El carrito está vacío." };
        }

        const orderNumber = `#RJ-${Math.floor(1000 + Math.random() * 9000)}`;
        const addressLine = [
          shipping.address,
          shipping.city,
          shipping.zip ? `CP ${shipping.zip}` : "",
        ]
          .filter(Boolean)
          .join(", ");

        const { data: order, error } = await supabase
          .from("ram_orders")
          .insert({
            user_id: user.id,
            order_number: orderNumber,
            status: "Procesando",
            subtotal,
            shipping: shippingCost,
            total,
            payment: paymentLabels[payment],
            address: addressLine || shipping.name,
          })
          .select("id")
          .single();

        if (error || !order) {
          set({ placing: false, lastError: error?.message ?? "Error" });
          return {
            ok: false,
            error: error?.message ?? "No se pudo crear el pedido",
          };
        }

        const lines = items.flatMap((c) => {
          const product = products.find((p) => p.id === c.id);
          if (!product) return [];
          return [
            {
              order_id: order.id,
              product_id: product.id,
              name: product.name,
              qty: c.qty,
              unit_price: product.price,
              line_total: product.price * c.qty,
            },
          ];
        });

        const { error: itemsError } = await supabase
          .from("ram_order_items")
          .insert(lines);

        if (itemsError) {
          set({ placing: false, lastError: itemsError.message });
          return { ok: false, error: itemsError.message };
        }

        void useStoreConfig.getState().config;

        set({ placing: false, orderConfirmed: true });
        return { ok: true };
      },
    }),
    {
      name: "ram-checkout",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        step: s.step,
        payment: s.payment,
        shipping: s.shipping,
      }),
    },
  ),
);
