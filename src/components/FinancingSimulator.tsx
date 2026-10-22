"use client";

import { useEffect, useMemo, useState } from "react";
import { GetnetMark } from "@/components/GetnetMark";
import { useCurrency } from "@/hooks/useCurrency";
import { formatAmount, parseMoneyInput } from "@/lib/format";
import { whatsappHref } from "@/lib/social";
import { useCatalogStore } from "@/store/catalog-store";
import { useStoreConfig } from "@/store/store-config";

type Props = {
  initialProductId?: string;
  showHeader?: boolean;
};

export function FinancingSimulator({
  initialProductId = "",
  showHeader = true,
}: Props) {
  const products = useCatalogStore((s) => s.products);
  const getnet = useStoreConfig((s) => s.config.getnet);
  const supportPhone = useStoreConfig((s) => s.config.supportPhone);
  const { formatPrice, blueVenta } = useCurrency();
  const [productId, setProductId] = useState(initialProductId);
  const [rawAmountUsd, setRawAmountUsd] = useState("");
  const [rawAmountArs, setRawAmountArs] = useState("");
  const [amountSource, setAmountSource] = useState<"ars" | "usd">("ars");
  const [rawDownPaymentArs, setRawDownPaymentArs] = useState("");
  const [rawDownPaymentUsd, setRawDownPaymentUsd] = useState("");
  const [financingMethod, setFinancingMethod] = useState<"getnet" | "personal">(
    "getnet",
  );

  useEffect(() => {
    setProductId(initialProductId);
  }, [initialProductId]);

  const selected = useMemo(
    () => products.find((p) => p.active && String(p.id) === productId),
    [products, productId],
  );
  const amountUsdInput = parseMoneyInput(rawAmountUsd);
  const amountArsInput = parseMoneyInput(rawAmountArs);
  const amount = useMemo(() => {
    if (selected) return selected.price;
    if (amountSource === "ars" && blueVenta) return amountArsInput / blueVenta;
    return amountUsdInput;
  }, [selected, amountSource, blueVenta, amountArsInput, amountUsdInput]);

  const downPaymentArsInput = parseMoneyInput(rawDownPaymentArs);
  const downPaymentUsdInput = parseMoneyInput(rawDownPaymentUsd);
  const downPaymentUsd =
    (blueVenta ? downPaymentArsInput / blueVenta : downPaymentArsInput) +
    downPaymentUsdInput;
  const downPayment = Math.min(downPaymentUsd, amount);
  const financed = amount - downPayment;

  const money = (usd: number) =>
    blueVenta ? `$ ${formatAmount(usd * blueVenta)}` : formatPrice(usd);
  const getnetInstallmentPlans = [
    { cuotas: 1, coefficient: 1 },
    {
      cuotas: 3,
      coefficient: getnet.coefficient3,
      discountPct: getnet.discountPct3,
    },
    {
      cuotas: 6,
      coefficient: getnet.coefficient6,
      discountPct: getnet.discountPct6,
    },
    {
      cuotas: 9,
      coefficient: getnet.coefficient9,
      discountPct: getnet.discountPct9,
    },
    {
      cuotas: 12,
      coefficient: getnet.coefficient12,
      discountPct: getnet.discountPct12,
    },
    {
      cuotas: 18,
      coefficient: getnet.coefficient18,
      discountPct: getnet.discountPct18,
    },
    {
      cuotas: 24,
      coefficient: getnet.coefficient24,
      discountPct: getnet.discountPct24,
    },
  ];
  const personalCreditWhatsappHref = whatsappHref(
    supportPhone,
    `Me interesa comprar el producto ${selected?.name ?? "XX"} con un credito personal.`,
  );
  const showControls = showHeader || !initialProductId;
  const compactLayout = !showHeader;

  return (
    <div className={showHeader ? "pt-3 pb-10 md:pt-4 md:pb-14" : "py-1"}>
      {showHeader && (
        <div className="mb-8 max-w-[40rem]">
          <p className="mb-3 text-[13px] font-bold tracking-wider text-primary uppercase">
            Cuotas
          </p>
          <h1 className="mb-3 text-[32px] leading-tight font-bold tracking-tight md:text-[40px]">
            Simulador de cuotas
          </h1>
          <p className="text-[15px] leading-relaxed text-muted md:text-base">
            Simulador de cuotas para pagar con tarjetas Visa y Mastercard
            bancarizadas mediante link de pago con la plataforma{" "}
            <GetnetMark className="text-[15px]" /> del Banco Santander Rio.
          </p>
        </div>
      )}

      {showControls && (
      <div className="grid max-w-[68rem] gap-3 rounded-xl border border-border bg-surface p-5 md:grid-cols-[1fr_1fr_0.72fr_0.72fr]">
        <label className="text-[13px] font-semibold">
          Monto a financiar
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-muted">
              $
            </span>
            <input
              inputMode="numeric"
              disabled={!!selected || !blueVenta}
              value={
                selected
                  ? blueVenta
                    ? formatAmount(selected.price * blueVenta)
                    : ""
                  : amountSource === "ars"
                    ? (rawAmountArs ? formatAmount(amountArsInput) : "")
                    : amount > 0 && blueVenta
                      ? formatAmount(amount * blueVenta)
                      : ""
              }
              onChange={(e) => {
                setAmountSource("ars");
                setRawAmountArs(e.target.value);
              }}
              placeholder="500.000"
              className="w-full rounded-lg border border-border bg-surface py-2.5 pr-3 pl-12 text-sm font-normal outline-none placeholder:text-muted-soft focus:border-primary disabled:opacity-60"
            />
          </div>
        </label>
        <label className="text-[13px] font-semibold">
          Monto contado (US$)
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-muted">
              US$
            </span>
            <input
              inputMode="numeric"
              disabled={!!selected}
              value={
                selected
                  ? formatAmount(selected.price)
                  : amountSource === "usd"
                    ? (rawAmountUsd ? formatAmount(amountUsdInput) : "")
                    : amount > 0
                      ? formatAmount(amount)
                      : ""
              }
              onChange={(e) => {
                setAmountSource("usd");
                setRawAmountUsd(e.target.value);
              }}
              placeholder="1.500"
              className="w-full rounded-lg border border-border bg-surface py-2.5 pr-3 pl-12 text-sm font-normal outline-none placeholder:text-muted-soft focus:border-primary disabled:opacity-60"
            />
          </div>
        </label>
        <label className="text-[13px] font-semibold">
          Entrega $ <span className="font-normal text-muted">(opcional)</span>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-muted">
              $
            </span>
            <input
              inputMode="numeric"
              value={rawDownPaymentArs ? formatAmount(downPaymentArsInput) : ""}
              onChange={(e) => setRawDownPaymentArs(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-border bg-surface py-2.5 pr-3 pl-8 text-sm font-normal outline-none placeholder:text-muted-soft focus:border-primary"
            />
          </div>
        </label>
        <label className="text-[13px] font-semibold">
          Entrega US$ <span className="font-normal text-muted">(opcional)</span>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-muted">
              US$
            </span>
            <input
              inputMode="numeric"
              value={rawDownPaymentUsd ? formatAmount(downPaymentUsdInput) : ""}
              onChange={(e) => setRawDownPaymentUsd(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-border bg-surface py-2.5 pr-3 pl-12 text-sm font-normal outline-none placeholder:text-muted-soft focus:border-primary"
            />
          </div>
        </label>
      </div>
      )}
      {showHeader && (
        <div className="mt-3 flex max-w-[68rem] flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFinancingMethod("personal")}
            className="inline-flex items-center rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:border-amber-400 hover:bg-amber-100"
          >
            Crédito personal de la casa
          </button>
          <a
            href={personalCreditWhatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-lg border border-primary/35 bg-primary-soft px-3.5 py-2 text-xs font-semibold text-primary no-underline hover:bg-primary hover:text-white hover:!no-underline"
          >
            Consultar por WhatsApp
          </a>
        </div>
      )}

      {amount > 0 && (
        <div className={`mt-4 space-y-3 ${compactLayout ? "max-w-[56rem]" : "max-w-[68rem]"}`}>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFinancingMethod("getnet")}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${
                financingMethod === "getnet"
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-surface text-muted"
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <GetnetMark className="text-xs" />
                <span>(Tarjetas Visa & Mastercard bancarizadas)</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFinancingMethod("personal")}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                financingMethod === "personal"
                  ? "border-amber-500 bg-amber-100 text-amber-900 shadow-[0_0_0_1px_rgba(245,158,11,0.35)]"
                  : "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                Crédito personal
                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] leading-none font-bold text-amber-800">
                  destacado
                </span>
              </span>
            </button>
          </div>
          {downPayment > 0 && (
            <div className="rounded-xl border border-border bg-accent-soft px-5 py-3 text-[13.5px] text-body-text">
              Entrega <strong>{money(downPayment)}</strong> · A financiar{" "}
              <strong>{money(financed)}</strong>
            </div>
          )}
          {financingMethod === "getnet" && (
            <div
              className={`grid grid-cols-1 gap-2.5 ${compactLayout ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2"}`}
            >
              {getnetInstallmentPlans.map((plan) => {
                const receiveRatio =
                  plan.cuotas === 1
                    ? 1
                    : Math.max(0, 1 - (plan.discountPct ?? 0) / 100);
                const extraPct =
                  plan.cuotas === 1
                    ? 0
                    : receiveRatio > 0 && plan.coefficient > 0
                      ? Math.max(0, (1 / (plan.coefficient * receiveRatio) - 1) * 100)
                      : 0;
                const effectiveCoefficient = plan.coefficient * (1 + extraPct / 100);
                const total = financed * effectiveCoefficient;
                const cuota = total / plan.cuotas;
                return (
                  <div
                    key={plan.cuotas}
                    className={`rounded-xl border border-border bg-surface ${
                      compactLayout ? "px-4 py-3" : "px-5 py-4"
                    }`}
                  >
                    <div className="text-[12.5px] text-muted">
                      {plan.cuotas === 1 ? "Contado" : `Total financiado ${money(total)}`}
                    </div>
                    <div
                      className={`mt-1 text-[18px] leading-tight font-bold ${
                        plan.cuotas === 1 ? "text-foreground" : "text-primary"
                      }`}
                    >
                      {plan.cuotas === 1
                        ? money(total)
                        : `${plan.cuotas} cuotas de ${money(cuota)}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {financingMethod === "getnet" ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-accent-soft px-4 py-3 text-[13px] text-body-text">
              <span className="shrink-0 rounded-md bg-[#EC0000] px-2 py-1 text-[11px] font-extrabold tracking-wide text-white">
                Santander
              </span>
              <span>
                La financiación es mediante la plataforma{" "}
                <strong>
                  <GetnetMark className="text-[13px]" />
                </strong>{" "}
                con tarjetas de crédito{" "}
                <strong>Visa y Mastercard</strong> bancarizadas de{" "}
                <strong>todos los bancos</strong>.
              </span>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
                <p>
                  <strong>Crédito personal de la casa</strong>, pensado para clientes
                  que prefieren resolver la compra de forma directa y asistida.
                </p>
                <p className="mt-2">
                  Se gestiona con <strong>recibo de sueldo</strong> y evaluación
                  crediticia previa. El equipo te asesora para elegir el plan que
                  mejor se adapte a tu presupuesto.
                </p>
              </div>
              <a
                href={personalCreditWhatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center rounded-lg border border-primary/35 bg-primary-soft px-3.5 py-2 text-[12.5px] font-semibold text-primary no-underline hover:bg-primary hover:text-white hover:!no-underline"
              >
                Sujeto a bases y condiciones. Consultar
              </a>
            </>
          )}
          {financingMethod === "getnet" ? (
            <p className="text-xs text-muted-soft">
              Valores orientativos. El costo final puede variar según la tarjeta
              y el banco.
            </p>
          ) : (
            <p className="text-xs text-muted-soft">
              Sujeto a evaluación y condiciones comerciales vigentes al momento
              de la operación.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
