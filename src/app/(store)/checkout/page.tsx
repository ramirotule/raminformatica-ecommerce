"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckoutLoginForm } from "@/components/CheckoutLoginForm";
import { useDialog } from "@/components/DialogProvider";
import { OrderSummary } from "@/components/OrderSummary";
import { useCurrency } from "@/hooks/useCurrency";
import { formatAmount, parseMoneyInput } from "@/lib/format";
import { whatsappHref } from "@/lib/social";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useCatalogStore } from "@/store/catalog-store";
import {
  useCheckoutStore,
  type PaymentMethod,
} from "@/store/checkout-store";
import { useStoreConfig } from "@/store/store-config";

const paymentDefs: {
  id: PaymentMethod;
  label: string;
  desc: string;
}[] = [
  { id: "card", label: "Contado efectivo", desc: "Pago único" },
  {
    id: "installments",
    label: "Cuotas con interés",
    desc: "Hasta 24 cuotas",
  },
  {
    id: "transfer",
    label: "Transferencia bancaria",
    desc: "Acreditación hasta 24hs",
  },
];

const stepDefs = [
  { n: 1 as const, label: "Envío" },
  { n: 2 as const, label: "Pago" },
  { n: 3 as const, label: "Confirmación" },
];

export default function CheckoutPage() {
  const { notice } = useDialog();
  const router = useRouter();
  const { formatPrice, formatArs, blueVenta } = useCurrency();
  const getnet = useStoreConfig((s) => s.config.getnet);
  const supportPhone = useStoreConfig((s) => s.config.supportPhone);
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const products = useCatalogStore((s) => s.products);
  const clearCart = useCartStore((s) => s.clearCart);
  const {
    step,
    payment,
    orderConfirmed,
    placing,
    shipping,
    setStep,
    setPayment,
    setShipping,
    confirmOrder,
    resetCheckout,
  } = useCheckoutStore();

  const [showLogin, setShowLogin] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState(6);
  const [rawDownPaymentArs, setRawDownPaymentArs] = useState("");
  const [rawDownPaymentUsd, setRawDownPaymentUsd] = useState("");
  const formatFinancingAmount = (amountUsd: number) =>
    formatArs(amountUsd) ?? formatPrice(amountUsd);
  const installmentOptions = [
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
  const downPaymentArs = parseMoneyInput(rawDownPaymentArs);
  const downPaymentUsd = parseMoneyInput(rawDownPaymentUsd);
  const cashAdvanceUsd =
    (blueVenta ? downPaymentArs / blueVenta : downPaymentArs) + downPaymentUsd;
  const downPayment = payment === "installments" ? Math.min(cashAdvanceUsd, subtotal) : 0;
  const financedSubtotal = Math.max(0, subtotal - downPayment);

  const calculateInstallment = (baseUsd: number, plan: (typeof installmentOptions)[number]) => {
    const receiveRatio = Math.max(0, 1 - plan.discountPct / 100);
    const extraPct =
      receiveRatio > 0 && plan.coefficient > 0
        ? Math.max(0, (1 / (plan.coefficient * receiveRatio) - 1) * 100)
        : 0;
    const adjustedCoefficient = plan.coefficient * (1 + extraPct / 100);
    const totalWithSurcharge = baseUsd * adjustedCoefficient;
    return {
      totalWithSurcharge,
      installmentAmount: totalWithSurcharge / plan.cuotas,
    };
  };

  const selectedPlan =
    installmentOptions.find((plan) => plan.cuotas === selectedInstallments) ??
    installmentOptions[0];

  useEffect(() => {
    if (user) setShowLogin(false);
  }, [user]);

  const placeOrder = async () => {
    const result = await confirmOrder();
    if (result.ok) {
      const paymentText =
        payment === "installments"
          ? (() => {
              const selectedInstallment = calculateInstallment(financedSubtotal, selectedPlan);
              const downPaymentLine =
                downPayment > 0 ? ` con entrega de ${formatFinancingAmount(downPayment)}` : "";
              return `Cuotas Getnet: ${selectedPlan.cuotas} cuotas de ${formatFinancingAmount(selectedInstallment.installmentAmount)} (total financiado ${formatFinancingAmount(selectedInstallment.totalWithSurcharge)})${downPaymentLine}`;
            })()
          : paymentDefs.find((pm) => pm.id === payment)?.label ?? "A convenir";

      const itemsText = items
        .map((c) => {
          const product = products.find((p) => p.id === c.id);
          if (!product) return null;
          return `- ${c.qty}x ${product.name}`;
        })
        .filter(Boolean)
        .join("\n");

      const message = [
        "Hola! Quiero confirmar esta compra:",
        itemsText,
        `Total productos: ${formatFinancingAmount(subtotal)}`,
        `Forma de pago: ${paymentText}`,
        `Cliente: ${shipping.name || "Sin nombre"}`,
        `Telefono: ${shipping.phone || "Sin telefono"}`,
      ].join("\n");

      if (typeof window !== "undefined") {
        window.location.href = whatsappHref(supportPhone, message);
      }
      return;
    }

    if (result.needsAuth) {
      setShowLogin(true);
      return;
    }
    void notice({
      title: "No se pudo confirmar",
      message: result.error ?? "Error al confirmar la compra",
    });
  };

  if (items.length === 0 && !orderConfirmed) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-muted">No hay productos para comprar.</p>
        <Link href="/catalogo" className="font-semibold">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="m-0 pt-7 pb-2 text-2xl font-bold">Checkout</h1>

      <div className="flex flex-wrap gap-2.5 py-4 pb-8">
        {stepDefs.map((s) => {
          const active = s.n === step;
          return (
            <div
              key={s.n}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold ${
                active
                  ? "bg-primary text-white"
                  : "bg-primary-softer text-muted"
              }`}
            >
              {s.n}. {s.label}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-9 pb-[60px] lg:grid-cols-[1fr_340px] lg:items-stretch">
        <div className="rounded-xl border border-border bg-surface p-[26px]">
          {step === 1 && (
            <>
              <div className="mb-[18px] text-base font-bold">
                Datos de envío
              </div>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <input
                  placeholder="Nombre completo"
                  value={shipping.name}
                  onChange={(e) => setShipping({ name: e.target.value })}
                  className="rounded-lg border border-border px-3.5 py-2.5 text-sm sm:col-span-2"
                />
                <input
                  placeholder="Dirección"
                  value={shipping.address}
                  onChange={(e) => setShipping({ address: e.target.value })}
                  className="rounded-lg border border-border px-3.5 py-2.5 text-sm sm:col-span-2"
                />
                <input
                  placeholder="Ciudad"
                  value={shipping.city}
                  onChange={(e) => setShipping({ city: e.target.value })}
                  className="rounded-lg border border-border px-3.5 py-2.5 text-sm"
                />
                <input
                  placeholder="Código postal"
                  value={shipping.zip}
                  onChange={(e) => setShipping({ zip: e.target.value })}
                  className="rounded-lg border border-border px-3.5 py-2.5 text-sm"
                />
                <input
                  placeholder="Teléfono"
                  value={shipping.phone}
                  onChange={(e) => setShipping({ phone: e.target.value })}
                  className="rounded-lg border border-border px-3.5 py-2.5 text-sm sm:col-span-2"
                />
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-[22px] cursor-pointer rounded-[9px] border-none bg-primary px-6 py-3.5 text-[14.5px] font-bold text-white"
              >
                Continuar a pago
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-[18px] text-base font-bold">
                Método de pago
              </div>
              <div className="mb-5 flex flex-col gap-2.5">
                {paymentDefs.map((pm) => {
                  const active = pm.id === payment;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPayment(pm.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-[10px] border px-4 py-3.5 text-left ${
                        active
                          ? "border-primary bg-primary-soft"
                          : "border-border bg-surface"
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold">{pm.label}</div>
                        <div className="mt-0.5 text-[12.5px] text-muted">
                          {pm.desc}
                        </div>
                      </div>
                      <div
                        className={`h-[18px] w-[18px] rounded-full border-2 ${
                          active
                            ? "border-primary bg-primary"
                            : "border-muted-soft bg-transparent"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              {payment === "installments" && (
                <div className="mb-5 rounded-xl border border-border bg-background p-4">
                  <div className="mb-3 text-[13px] font-bold">
                    Entrega en efectivo + resto en cuotas
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <label className="text-[12px] font-semibold text-muted">
                      Entrega $ (opcional)
                      <div className="relative mt-1.5">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted">
                          $
                        </span>
                        <input
                          value={rawDownPaymentArs ? formatAmount(downPaymentArs) : ""}
                          onChange={(e) => setRawDownPaymentArs(e.target.value)}
                          placeholder="0"
                          inputMode="numeric"
                          className="w-full rounded-lg border border-border bg-surface py-2.5 pr-3 pl-8 text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </label>
                    <label className="text-[12px] font-semibold text-muted">
                      Entrega US$ (opcional)
                      <div className="relative mt-1.5">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted">
                          US$
                        </span>
                        <input
                          value={rawDownPaymentUsd ? formatAmount(downPaymentUsd) : ""}
                          onChange={(e) => setRawDownPaymentUsd(e.target.value)}
                          placeholder="0"
                          inputMode="numeric"
                          className="w-full rounded-lg border border-border bg-surface py-2.5 pr-3 pl-11 text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </label>
                  </div>
                  {downPayment > 0 && (
                    <div className="mt-3 rounded-lg border border-border-soft bg-surface px-3 py-2 text-[12.5px] text-muted">
                      Entrega: <strong>{formatFinancingAmount(downPayment)}</strong> · Resto a financiar:{" "}
                      <strong>{formatFinancingAmount(financedSubtotal)}</strong>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="cursor-pointer rounded-[9px] border border-border bg-transparent px-6 py-3.5 text-[14.5px] font-semibold"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogin(false);
                    setStep(3);
                  }}
                  className="cursor-pointer rounded-[9px] border-none bg-primary px-6 py-3.5 text-[14.5px] font-bold text-white"
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {step === 3 &&
            (orderConfirmed ? (
              <div className="py-10 text-center">
                <div className="mb-3.5 text-[40px] text-success">✓</div>
                <div className="mb-2 text-lg font-bold">
                  ¡Pedido confirmado!
                </div>
                <div className="mb-[22px] text-sm text-muted">
                  Te enviamos el comprobante por correo. Podés seguir el estado
                  desde Mi cuenta.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void clearCart();
                    resetCheckout();
                    router.push("/cuenta");
                  }}
                  className="cursor-pointer rounded-[9px] border-none bg-primary px-[22px] py-3 text-sm font-bold text-white"
                >
                  Ver mis pedidos
                </button>
              </div>
            ) : (
              <>
                <div className="mb-[18px] text-base font-bold">
                  Confirmá tu pedido
                </div>
                <div className="mb-[22px] flex flex-col gap-2.5">
                  {items.map((c) => {
                    const product = products.find((p) => p.id === c.id);
                    if (!product) return null;
                    return (
                      <div
                        key={c.id}
                        className="flex justify-between border-b border-border-soft py-2 text-[13.5px]"
                      >
                        <span>
                          {c.qty}× {product.name}
                        </span>
                        <span className="font-semibold">
                          {formatPrice(product.price * c.qty)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mb-5 rounded-lg border border-border-soft bg-background px-3.5 py-3 text-[13px] text-muted">
                  <div>
                    Forma de pago:{" "}
                    <strong className="text-foreground">
                      {payment === "installments"
                        ? `${selectedPlan.cuotas} cuotas con Getnet`
                        : paymentDefs.find((pm) => pm.id === payment)?.label}
                    </strong>
                  </div>
                  {payment === "installments" && downPayment > 0 && (
                    <div className="mt-1">
                      Entrega en efectivo:{" "}
                      <strong className="text-foreground">
                        {formatFinancingAmount(downPayment)}
                      </strong>
                    </div>
                  )}
                </div>

                {showLogin && !user ? (
                  <CheckoutLoginForm
                    onCancel={() => setShowLogin(false)}
                    onSuccess={() => {
                      void placeOrder();
                    }}
                  />
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLogin(false);
                        setStep(2);
                      }}
                      className="cursor-pointer rounded-[9px] border border-border bg-transparent px-6 py-3.5 text-[14.5px] font-semibold"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      disabled={placing}
                      onClick={() => {
                        if (!user) {
                          setShowLogin(true);
                          return;
                        }
                        void placeOrder();
                      }}
                      className="cursor-pointer rounded-[9px] border-none bg-success px-6 py-3.5 text-[14.5px] font-bold text-white disabled:opacity-60"
                    >
                      Confirmar compra
                    </button>
                  </div>
                )}
              </>
            ))}
        </div>

        <div className="space-y-3 lg:flex lg:h-full lg:flex-col">
          <OrderSummary title="Tu pedido" shippingLabel="A convenir" />
          {step > 1 && payment === "installments" && subtotal > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4 lg:flex-1">
              <div className="mb-2 text-[13px] font-bold">
                Opciones de financiación en pesos
              </div>
              {downPayment > 0 && (
                <div className="mb-3 rounded-lg border border-border-soft bg-background px-3 py-2 text-[12px] text-muted">
                  Entrega: <strong>{formatFinancingAmount(downPayment)}</strong> · A financiar:{" "}
                  <strong>{formatFinancingAmount(financedSubtotal)}</strong>
                </div>
              )}
              <div className="space-y-2">
                {installmentOptions.map((plan) => {
                    const calc = calculateInstallment(financedSubtotal, plan);
                    const active = selectedInstallments === plan.cuotas;
                    return (
                      <div
                        key={plan.cuotas}
                        className={`rounded-lg border px-3 py-2.5 ${
                          active
                            ? "border-primary bg-primary-soft"
                            : "border-border-soft bg-background"
                        }`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedInstallments(plan.cuotas)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedInstallments(plan.cuotas);
                          }
                        }}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-[13px] font-semibold">
                            {plan.cuotas} pagos
                          </span>
                          <span className="text-sm font-bold">
                            {formatFinancingAmount(calc.installmentAmount)}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11.5px] text-muted">
                          Total financiado {formatFinancingAmount(calc.totalWithSurcharge)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
