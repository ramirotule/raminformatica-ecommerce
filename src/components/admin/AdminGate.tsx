"use client";

import { useEffect, useState } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminStore } from "@/store/admin-store";
import { useBrandsStore } from "@/store/brands-store";
import { useCatalogStore } from "@/store/catalog-store";
import { useCategoriesStore } from "@/store/categories-store";
import { useProvidersStore } from "@/store/providers-store";
import { useSubcategoriesStore } from "@/store/subcategories-store";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated);
  const hydrated = useAdminStore((s) => s.hydrated);
  const init = useAdminStore((s) => s.init);
  const fetchProducts = useCatalogStore((s) => s.fetchProducts);
  const fetchProviders = useProvidersStore((s) => s.fetchProviders);
  const fetchBrands = useBrandsStore((s) => s.fetchBrands);
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories);
  const fetchSubcategories = useSubcategoriesStore(
    (s) => s.fetchSubcategories,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    void init();
  }, [init]);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Recarga el catálogo con la sesión de admin ya establecida.
    void fetchProducts();
    void fetchProviders();
    void fetchBrands();
    void fetchCategories();
    void fetchSubcategories();
  }, [
    isAuthenticated,
    fetchProducts,
    fetchProviders,
    fetchBrands,
    fetchCategories,
    fetchSubcategories,
  ]);

  if (!mounted || !hydrated) {
    return (
      <div className="flex min-h-full items-center justify-center text-sm text-muted">
        Cargando…
      </div>
    );
  }

  if (!isAuthenticated) return <AdminLogin />;

  return <AdminShell>{children}</AdminShell>;
}
