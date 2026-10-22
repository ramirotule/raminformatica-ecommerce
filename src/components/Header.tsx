"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { FxRateLoader } from "@/components/FxRateLoader";
import { HeaderSearch } from "@/components/HeaderSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { trackEvent } from "@/lib/analytics";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";

export function Header() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.cartCount());
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setMobileMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileMenuOpen]);

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
            Financiación
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
              onClick={() =>
                trackEvent("open_cart", {
                  cart_count: count,
                  page: pathname ?? "",
                })
              }
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

      <div className="relative px-5 pb-2 md:hidden">
        <button
          type="button"
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="flex h-8 w-10 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors hover:bg-accent-soft"
        >
          {mobileMenuOpen ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[16px] w-[16px]"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[16px] w-[16px]"
              aria-hidden
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {mobileMenuOpen ? (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
          />
          <nav className="absolute top-[calc(100%-2px)] left-5 z-40 w-[220px] rounded-xl border border-border bg-surface p-2 shadow-[0_14px_34px_rgba(0,0,0,0.14)] md:hidden">
            <div className="flex flex-col gap-1.5">
              <MobileNavLink href="/" active={isHome}>
                Inicio
              </MobileNavLink>
              <MobileNavLink href="/catalogo" active={isCatalog}>
                Catálogo
              </MobileNavLink>
              <MobileNavLink href="/marcas" active={isMarcas}>
                Marcas
              </MobileNavLink>
              <MobileNavLink href="/nosotros" active={isNosotros}>
                Nosotros
              </MobileNavLink>
              <MobileNavLink href="/simulador" active={isSimulador}>
                Financiación
              </MobileNavLink>
              <MobileNavLink href="/contacto" active={isContacto}>
                Contacto
              </MobileNavLink>
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}

function MobileNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg border px-3 py-2 text-left text-[13px] font-semibold no-underline hover:!no-underline ${
        active
          ? "border-primary bg-primary-soft text-primary-dark"
          : "border-border bg-background text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
