"use client";

import { useEffect } from "react";
import { useFxStore } from "@/store/fx-store";

/** Mantiene actualizada la cotización blue venta (sin UI). */
export function FxRateLoader() {
  const fetchBlueRate = useFxStore((s) => s.fetchBlueRate);

  useEffect(() => {
    void fetchBlueRate();
    const id = window.setInterval(() => void fetchBlueRate(), 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [fetchBlueRate]);

  return null;
}
