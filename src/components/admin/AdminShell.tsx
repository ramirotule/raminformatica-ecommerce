"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAdminStore } from "@/store/admin-store";

const nav: {
  href: string;
  label: string;
  exact?: boolean;
  icon: ReactNode;
}[] = [
  {
    href: "/admin",
    label: "Inicio",
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
      </svg>
    ),
  },
  {
    href: "/admin/productos",
    label: "Productos",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.3 7 12 12l8.7-5M12 22V12" />
      </svg>
    ),
  },
  {
    href: "/admin/marcas",
    label: "Marcas",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3z" />
        <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
      </svg>
    ),
  },
  {
    href: "/admin/categorias",
    label: "Categorías",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/proveedores",
    label: "Proveedores",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="3.25" />
        <path d="M22 21v-2a3.5 3.5 0 0 0-2.5-3.35M16.5 3.7a3.25 3.25 0 0 1 0 6.3" />
      </svg>
    ),
  },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2.5v2.2M12 19.3v2.2M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2.5 12h2.2M19.3 12h2.2M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56" />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

function AdminSidebar({
  pathname,
  onLogout,
}: {
  pathname: string;
  onLogout: () => void;
}) {
  return (
    <aside className="flex h-full w-[240px] flex-col border-r border-border bg-surface text-foreground">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
        <BrandLogo size="xs" />
        <div className="min-w-0">
          <div className="truncate text-sm font-bold leading-tight text-foreground">
            RAM Informatica Admin
          </div>
          <div className="text-[11px] text-muted">Panel de gestión</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-semibold no-underline transition-colors hover:!no-underline ${
                active
                  ? "bg-primary-soft text-primary-dark"
                  : "text-muted hover:bg-accent-soft hover:text-foreground"
              }`}
            >
              <span
                className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md ${
                  active
                    ? "bg-primary/15 text-primary-dark"
                    : "bg-accent-soft text-muted"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-border p-3">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-2 text-[12.5px] font-semibold text-muted no-underline hover:bg-accent-soft hover:text-foreground hover:!no-underline"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
            </svg>
            Ver tienda
          </Link>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-[13px] font-semibold text-sale hover:bg-danger-soft"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Salir
        </button>
      </div>
    </aside>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const logout = useAdminStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  const currentLabel =
    nav.find((item) => isActive(pathname, item.href, item.exact))?.label ??
    "Admin";

  return (
    <div className="flex min-h-full bg-background">
      <div className="sticky top-0 hidden h-svh shrink-0 lg:block">
        <AdminSidebar
          pathname={pathname}
          onLogout={() => void logout()}
        />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 cursor-pointer border-none bg-black/45"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-xl">
            <AdminSidebar
              pathname={pathname}
              onLogout={() => void logout()}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{currentLabel}</div>
            <div className="text-[11px] text-muted">RAM Informatica Admin</div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
