"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrencyCode } from "@/lib/format";

type BlueQuote = {
  compra: number;
  venta: number;
  fechaActualizacion: string | null;
};

type FxState = {
  displayCurrency: CurrencyCode;
  blueVenta: number | null;
  blueCompra: number | null;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
  setDisplayCurrency: (currency: CurrencyCode) => void;
  fetchBlueRate: () => Promise<void>;
};

export const useFxStore = create<FxState>()(
  persist(
    (set, get) => ({
      displayCurrency: "USD",
      blueVenta: null,
      blueCompra: null,
      updatedAt: null,
      loading: false,
      error: null,
      setDisplayCurrency: (currency) => set({ displayCurrency: currency }),
      fetchBlueRate: async () => {
        if (get().loading) return;
        set({ loading: true, error: null });
        try {
          const res = await fetch("/api/dolar/blue", { cache: "no-store" });
          if (!res.ok) {
            throw new Error("No se pudo obtener la cotización");
          }
          const data = (await res.json()) as BlueQuote;
          if (!data.venta || data.venta <= 0) {
            throw new Error("Cotización inválida");
          }
          set({
            blueVenta: data.venta,
            blueCompra: data.compra ?? null,
            updatedAt: data.fechaActualizacion,
            loading: false,
            error: null,
          });
        } catch (err) {
          set({
            loading: false,
            error:
              err instanceof Error
                ? err.message
                : "Error al consultar DolarAPI",
          });
        }
      },
    }),
    {
      name: "ram-fx",
      partialize: (s) => ({
        displayCurrency: s.displayCurrency,
        blueVenta: s.blueVenta,
        blueCompra: s.blueCompra,
        updatedAt: s.updatedAt,
      }),
    },
  ),
);
