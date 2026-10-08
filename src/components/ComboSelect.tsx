"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type ComboOption<T extends string = string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  value: T;
  options: ComboOption<T>[];
  onChange: (value: T) => void;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  /** Permite crear un valor que no está en la lista (usa el texto de búsqueda). */
  creatable?: boolean;
  createLabel?: (query: string) => string;
  className?: string;
  buttonClassName?: string;
  fullWidth?: boolean;
  /** Alinea el menú al borde derecho (útil en columnas pegadas a la derecha). */
  menuAlignRight?: boolean;
};

export function ComboSelect<T extends string>({
  value,
  options,
  onChange,
  label,
  placeholder = "Seleccionar…",
  searchPlaceholder = "Buscar…",
  searchable = false,
  creatable = false,
  createLabel = (q) => `Agregar “${q}”`,
  className = "",
  buttonClassName = "",
  fullWidth = false,
  menuAlignRight = false,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, query, searchable]);

  const canCreate = useMemo(() => {
    if (!creatable || !searchable) return false;
    const q = query.trim();
    if (!q) return false;
    return !options.some(
      (o) =>
        o.value.toLowerCase() === q.toLowerCase() ||
        o.label.toLowerCase() === q.toLowerCase(),
    );
  }, [creatable, searchable, query, options]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    if (searchable) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, searchable]);

  return (
    <div
      ref={rootRef}
      className={`relative flex items-center gap-2 text-[13px] text-muted ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {label && (
        <span className="font-medium whitespace-nowrap" id={`${listId}-label`}>
          {label}
        </span>
      )}
      <div className={`relative ${fullWidth ? "w-full" : "min-w-[200px]"}`}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={label ? `${listId}-label` : undefined}
          aria-controls={listId}
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent-soft ${
            selected || value ? "text-foreground" : "text-muted-soft"
          } ${open ? "border-primary" : ""} ${buttonClassName}`}
        >
          <span className="truncate">
            {selected?.label ?? (value || placeholder)}
          </span>
          <svg
            viewBox="0 0 20 20"
            className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 7.5 10 12.5 15 7.5" />
          </svg>
        </button>

        {open && (
          <div
            className={`absolute top-[calc(100%+6px)] ${menuAlignRight ? "right-0" : "left-0"} z-40 w-full min-w-[220px] overflow-hidden rounded-lg border border-border bg-surface shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)]`}
          >
            {searchable && (
              <div className="border-b border-border p-2">
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-md border border-border bg-accent-soft px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canCreate) {
                      e.preventDefault();
                      onChange(query.trim() as T);
                      setOpen(false);
                    }
                  }}
                />
              </div>
            )}
            <ul
              id={listId}
              role="listbox"
              className="m-0 max-h-56 list-none overflow-y-auto p-1"
            >
              {filtered.length === 0 && !canCreate ? (
                <li className="px-3 py-2.5 text-sm text-muted-soft">
                  Sin resultados
                </li>
              ) : (
                filtered.map((option) => {
                  const active = option.value === value;
                  return (
                    <li key={option.value} role="option" aria-selected={active}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(option.value);
                          setOpen(false);
                        }}
                        className={`flex w-full cursor-pointer items-center rounded-md border-none px-3 py-2.5 text-left text-sm transition-colors ${
                          active
                            ? "bg-primary-soft font-semibold text-primary-dark"
                            : "bg-transparent font-medium text-foreground hover:bg-accent-soft"
                        }`}
                      >
                        {option.label}
                      </button>
                    </li>
                  );
                })
              )}
              {canCreate && (
                <li role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(query.trim() as T);
                      setOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-center rounded-md border-none bg-transparent px-3 py-2.5 text-left text-sm font-semibold text-primary hover:bg-primary-soft"
                  >
                    {createLabel(query.trim())}
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
