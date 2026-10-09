"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { FxRateLoader } from "@/components/FxRateLoader";
import { HeaderSearch } from "@/components/HeaderSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";

export function Header() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.cartCount());
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const count = mounted ? cartCount : 0;
  const isLoggedIn = mounted && Boolean(user);
  const accountLabel = isLoggedIn
    ? `Mi cuenta (${user!.name.split(" ")[0]})`
    : "Iniciar sesión";
  const isHome = pathname === "/";
  const isCatalog = pathname.startsWith("/catalogo");
  const isMarcas = pathname.startsWith("/marcas");
  const isNosotros = pathname.startsWith("/nosotros");
  const isSimulador = pathname.startsWith("/simulador");
  const isContacto = pathname.startsWith("/contacto");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="flex min-h-[104px] items-center gap-4 py-2.5 pr-4 pl-1.5 sm:gap-6 md:min-h-[120px] md:py-3 md:pr-10 md:pl-2">
        <BrandLogo size="md" />

        <nav className="hidden items-center gap-0.5 md:ml-5 md:flex xl:ml-8 xl:gap-1">
          <Link
            href="/"
            className={`rounded-md px-2.5 py-2 text-sm font-semibold no-underline hover:!no-underline xl:px-3 ${
              isHome ? "text-primary" : "text-foreground"
            }`}
          >
            Inicio
          </Link>
          <Link
            href="/catalogo"
            className={`rounded-md px-2.5 py-2 text-sm font-semibold no-underline hover:!no-underline xl:px-3 ${
              isCatalog ? "text-primary" : "text-foreground"
            }`}
          >
            Catálogo
          </Link>
          <Link
            href="/marcas"
            className={`rounded-md px-2.5 py-2 text-sm font-semibold no-underline hover:!no-underline xl:px-3 ${
              isMarcas ? "text-primary" : "text-foreground"
            }`}
          >
            Marcas
          </Link>
          <Link
            href="/nosotros"
            className={`rounded-md px-2.5 py-2 text-sm font-semibold no-underline hover:!no-underline xl:px-3 ${
              isNosotros ? "text-primary" : "text-foreground"
            }`}
          >
            Nosotros
          </Link>
          <Link
            href="/simulador"
            className={`rounded-md px-2.5 py-2 text-sm font-semibold no-underline hover:!no-underline xl:px-3 ${
              isSimulador ? "text-primary" : "text-foreground"
            }`}
          >
            Simulador
          </Link>
          <Link
            href="/contacto"
            className={`rounded-md px-2.5 py-2 text-sm font-semibold no-underline hover:!no-underline xl:px-3 ${
              isContacto ? "text-primary" : "text-foreground"
            }`}
          >
            Contacto
          </Link>
        </nav>

        <HeaderSearch />

        <div className="ml-auto" />

        <div className="flex flex-col items-end gap-1.5">
          <FxRateLoader />
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/cuenta"
              aria-label={accountLabel}
              title={accountLabel}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground no-underline transition-colors hover:bg-accent-soft hover:!no-underline"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[18px] w-[18px]"
                aria-hidden
              >
                <circle cx="12" cy="8" r="3.25" />
                <path d="M5.5 19.5c1.6-3.2 4-4.75 6.5-4.75s4.9 1.55 6.5 4.75" />
              </svg>
              {isLoggedIn && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
            <Link
              href="/carrito"
              aria-label={`Carrito${count > 0 ? `, ${count} productos` : ""}`}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground no-underline transition-colors hover:bg-accent-soft hover:!no-underline"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[18px] w-[18px]"
                aria-hidden
              >
                <circle cx="9" cy="20" r="1.25" fill="currentColor" stroke="none" />
                <circle cx="18" cy="20" r="1.25" fill="currentColor" stroke="none" />
                <path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.45-1.1L21 8H7" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
                  {count}
                </span>
              )}
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
