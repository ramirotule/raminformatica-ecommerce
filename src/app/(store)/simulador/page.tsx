"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductImage } from "@/components/ProductImage";
import { useCurrency } from "@/hooks/useCurrency";
import { formatAmount, parseMoneyInput } from "@/lib/format";
import { INSTALLMENT_PLANS } from "@/lib/installments";
import { useCatalogStore } from "@/store/catalog-store";

export default function SimuladorPage() {
  return (
    <Suspense fallback={null}>
      <Simulador />
    </Suspense>
  );
}

function Simulador() {
  const searchParams = useSearchParams();
  const products = useCatalogStore((s) => s.products);
  const { formatPrice, blueVenta } = useCurrency();
  const [productId, setProductId] = useState(searchParams.get("producto") ?? "");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);
  const [rawAmount, setRawAmount] = useState("");
  const [rawDownPayment, setRawDownPayment] = useState("");

  const active = useMemo(
    () => products.filter((p) => p.active).sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  );

  const selected = active.find((p) => String(p.id) === productId);
  const amount = selected ? selected.price : parseMoneyInput(rawAmount);

  // La entrega se ingresa en $ (o en US$ si todavía no hay cotización).
  const downPaymentInput = parseMoneyInput(rawDownPayment);
  const downPaymentUsd = blueVenta
    ? downPaymentInput / blueVenta
    : downPaymentInput;
  const downPayment = Math.min(downPaymentUsd, amount);
  const financed = amount - downPayment;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? active.filter((p) => p.name.toLowerCase().includes(q))
      : active;
    return list.slice(0, 50);
  }, [active, search]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!comboRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreview(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [preview]);

  /** Monto en pesos si hay cotización; si no, en US$. */
  const money = (usd: number) =>
    blueVenta ? `$ ${formatAmount(usd * blueVenta)}` : formatPrice(usd);

  return (
    <div className="py-10 md:py-14">
      <div className="mb-8 max-w-[40rem]">
        <p className="mb-3 text-[13px] font-bold tracking-wider text-primary uppercase">
          Cuotas
        </p>
        <h1 className="mb-3 text-[32px] leading-tight font-bold tracking-tight md:text-[40px]">
          Simulador de cuotas
        </h1>
        <p className="text-[15px] leading-relaxed text-muted md:text-base">
          Elegí un producto o ingresá un monto en US$ y mirá cuánto sería cada
          cuota en pesos.
        </p>
      </div>

      <div className="grid max-w-[68rem] gap-4 rounded-xl border border-border bg-surface p-5 md:grid-cols-[1.5fr_auto_1fr_1fr_1fr]">
        <div className="text-[13px] font-semibold" ref={comboRef}>
          Producto
          <div className="relative mt-1.5">
            <input
              value={open ? search : (selected?.name ?? search)}
              onChange={(e) => {
                setSearch(e.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                setSearch("");
                setOpen(true);
              }}
              placeholder="Buscar producto o ingresar monto manual"
              autoComplete="off"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-normal outline-none placeholder:text-muted-soft focus:border-primary"
            />
            {open && (
              <ul className="absolute top-[calc(100%+6px)] right-0 left-0 z-20 max-h-72 overflow-y-auto rounded-xl border border-border bg-surface py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setProductId("");
                      setSearch("");
                      setOpen(false);
                    }}
                    className="w-full cursor-pointer border-none bg-transparent px-3 py-2 text-left text-sm font-normal text-muted hover:bg-accent-soft"
                  >
                    Ingresar monto manual
                  </button>
                </li>
                {filtered.length === 0 && (
                  <li className="px-3 py-2 text-sm font-normal text-muted">
                    Sin resultados
                  </li>
                )}
                {filtered.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setProductId(String(p.id));
                        setSearch("");
                        setOpen(false);
                      }}
                      className="w-full cursor-pointer border-none bg-transparent px-3 py-2 text-left text-sm font-normal text-foreground hover:bg-accent-soft"
                    >
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div aria-hidden={!selected}>
          <div className="text-[13px] leading-[1.2] select-none">&nbsp;</div>
          {selected ? (
            <button
              type="button"
              onClick={() => setPreview(true)}
              aria-label="Ver imagen del producto"
              className="mt-1.5 block h-[44px] w-[44px] cursor-pointer rounded-lg border-none bg-transparent p-0"
            >
              <ProductImage
                product={selected}
                className="h-[44px] w-[44px] rounded-lg border border-border-soft"
                sizes="44px"
                showDiscount={false}
              />
            </button>
          ) : (
            <div className="mt-1.5 h-[44px] w-[44px] rounded-lg border border-dashed border-border" />
          )}
        </div>
        <label className="text-[13px] font-semibold">
          Monto contado (US$)
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-muted">
              US$
            </span>
            <input
              inputMode="numeric"
              disabled={!!selected}
              value={selected ? formatAmount(selected.price) : rawAmount ? formatAmount(parseMoneyInput(rawAmount)) : ""}
              onChange={(e) => setRawAmount(e.target.value)}
              placeholder="1.500"
              className="w-full rounded-lg border border-border bg-surface py-2.5 pr-3 pl-12 text-sm font-normal outline-none placeholder:text-muted-soft focus:border-primary disabled:opacity-60"
            />
          </div>
        </label>
        <div className="text-[13px] font-semibold">
          Monto contado efectivo ($)
          <div className="mt-1.5 w-full rounded-lg border border-border bg-accent-soft px-3 py-2.5 text-sm font-normal text-foreground">
            {amount > 0 && blueVenta ? `$ ${formatAmount(amount * blueVenta)}` : "—"}
          </div>
        </div>
        <label className="text-[13px] font-semibold">
          Entrega <span className="font-normal text-muted">(opcional)</span>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-muted">
              {blueVenta ? "$" : "US$"}
            </span>
            <input
              inputMode="numeric"
              value={rawDownPayment ? formatAmount(downPaymentInput) : ""}
              onChange={(e) => setRawDownPayment(e.target.value)}
              placeholder="0"
              className={`w-full rounded-lg border border-border bg-surface py-2.5 pr-3 ${blueVenta ? "pl-8" : "pl-12"} text-sm font-normal outline-none placeholder:text-muted-soft focus:border-primary`}
            />
          </div>
        </label>
      </div>

      {preview && selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selected.name}
          onClick={() => setPreview(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[26rem] rounded-2xl bg-surface p-4 shadow-xl"
          >
            <button
              type="button"
              onClick={() => setPreview(false)}
              aria-label="Cerrar"
              className="absolute top-2 right-3 z-10 cursor-pointer border-none bg-transparent text-2xl leading-none text-muted"
            >
              ×
            </button>
            <ProductImage
              product={selected}
              className="aspect-square w-full rounded-xl border border-border-soft"
              sizes="416px"
              showDiscount={false}
              priority
            />
            <div className="mt-3 text-[15px] font-bold">{selected.name}</div>
            <div className="text-[12.5px] text-muted">{selected.brand}</div>
          </div>
        </div>
      )}

      {amount > 0 && (
        <div className="mt-6 grid max-w-[44rem] gap-3">
          {downPayment > 0 && (
            <div className="rounded-xl border border-border bg-accent-soft px-5 py-3 text-[13.5px] text-body-text">
              Entrega <strong>{money(downPayment)}</strong> · A financiar{" "}
              <strong>{money(financed)}</strong>
            </div>
          )}
          {INSTALLMENT_PLANS.map((plan) => {
            const total = financed * (1 + plan.surcharge / 100);
            const cuota = total / plan.cuotas;
            return (
              <div
                key={plan.cuotas}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-5 py-4"
              >
                <div>
                  <div className="text-[15px] font-bold">
                    {plan.cuotas === 1 ? "Contado" : `${plan.cuotas} cuotas`}
                  </div>
                  <div className="text-[12.5px] text-muted">
                    Total {money(total)}
                    {plan.surcharge > 0 ? ` · recargo ${plan.surcharge}%` : ""}
                  </div>
                </div>
                <div className="text-right text-lg font-bold text-primary">
                  {money(cuota)}
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-accent-soft px-4 py-3 text-[13px] text-body-text">
            <span className="shrink-0 rounded-md bg-[#EC0000] px-2 py-1 text-[11px] font-extrabold tracking-wide text-white">
              Santander
            </span>
            <span>
              La financiación es mediante la plataforma{" "}
              <strong>GETNET</strong> del <strong>Banco Santander Río</strong>.
            </span>
          </div>
          <p className="text-xs text-muted-soft">
            Valores orientativos. El costo final puede variar según la tarjeta
            y el banco.
          </p>
        </div>
      )}
    </div>
  );
}
