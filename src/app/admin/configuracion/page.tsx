"use client";

import { useEffect, useState } from "react";
import { ComboSelect } from "@/components/ComboSelect";
import { useDialog } from "@/components/DialogProvider";
import { ImageUploader } from "@/components/ImageUploader";
import { MoneyInput } from "@/components/MoneyInput";
import {
  currencyLabel,
  currencyPrefix,
  normalizeCurrency,
  type CurrencyCode,
} from "@/lib/format";
import { useStoreConfig, type StoreConfig } from "@/store/store-config";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary";

const CURRENCY_OPTIONS: { value: CurrencyCode; label: string }[] = [
  { value: "USD", label: currencyLabel("USD") },
  { value: "ARS", label: currencyLabel("ARS") },
];

export default function AdminConfigPage() {
  const { notice } = useDialog();
  const config = useStoreConfig((s) => s.config);
  const updateConfig = useStoreConfig((s) => s.updateConfig);
  const resetConfig = useStoreConfig((s) => s.resetConfig);
  const [form, setForm] = useState<StoreConfig>({
    ...config,
    currency: normalizeCurrency(config.currency),
  });
  const [tab, setTab] = useState<
    "general" | "getnet" | "personalCredit" | "carousel"
  >("general");
  const [getnetEditing, setGetnetEditing] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({
      ...config,
      currency: normalizeCurrency(config.currency),
    });
  }, [config]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConfig({
        ...form,
        currency: normalizeCurrency(form.currency),
        freeShippingFrom: Number(form.freeShippingFrom) || 0,
        shippingCost: Number(form.shippingCost) || 0,
        maxInstallments: Number(form.maxInstallments) || 1,
        getnet: {
          coefficient3: Number(form.getnet.coefficient3) || 1.0913,
          coefficient6: Number(form.getnet.coefficient6) || 1.1666,
          coefficient9: Number(form.getnet.coefficient9) || 1.2724,
          coefficient12: Number(form.getnet.coefficient12) || 1.3659,
          coefficient18: Number(form.getnet.coefficient18) || 1.569,
          coefficient24: Number(form.getnet.coefficient24) || 1.795,
          discountPct3: Number(form.getnet.discountPct3) || 0,
          discountPct6: Number(form.getnet.discountPct6) || 0,
          discountPct9: Number(form.getnet.discountPct9) || 0,
          discountPct12: Number(form.getnet.discountPct12) || 0,
          discountPct18: Number(form.getnet.discountPct18) || 43.4676,
          discountPct24: Number(form.getnet.discountPct24) || 51.7385,
          arancelInstallmentsPct:
            Number(form.getnet.arancelInstallmentsPct) || 0,
          ivaPct: Number(form.getnet.ivaPct) || 21,
        },
        personalCredit: {
          surchargePct3: Number(form.personalCredit.surchargePct3) || 0,
          surchargePct6: Number(form.personalCredit.surchargePct6) || 0,
          surchargePct9: Number(form.personalCredit.surchargePct9) || 0,
          surchargePct12: Number(form.personalCredit.surchargePct12) || 0,
        },
        heroSlides: form.heroSlides
          .map((slide) => ({
            imageUrl: slide.imageUrl.trim(),
            mobileImageUrl: (slide.mobileImageUrl ?? "").trim(),
            href: slide.href.trim() || "/catalogo",
            title: (slide.title ?? "").trim(),
          }))
          .filter((slide) => Boolean(slide.imageUrl)),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      void notice({
        title: "No se pudo guardar",
        message: err instanceof Error ? err.message : "Error al guardar",
      });
    }
  };

  const addHeroSlide = () => {
    setForm((prev) => ({
      ...prev,
      heroSlides: [
        ...prev.heroSlides,
        { imageUrl: "", mobileImageUrl: "", href: "/catalogo", title: "" },
      ],
    }));
  };

  const updateHeroSlide = (
    index: number,
    patch: Partial<StoreConfig["heroSlides"][number]>,
  ) => {
    setForm((prev) => ({
      ...prev,
      heroSlides: prev.heroSlides.map((slide, i) =>
        i === index ? { ...slide, ...patch } : slide,
      ),
    }));
  };

  const removeHeroSlide = (index: number) => {
    setForm((prev) => ({
      ...prev,
      heroSlides: prev.heroSlides.filter((_, i) => i !== index),
    }));
  };

  const moveHeroSlide = (index: number, direction: -1 | 1) => {
    setForm((prev) => {
      const next = [...prev.heroSlides];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, heroSlides: next };
    });
  };

  const reorderHeroSlide = (from: number, to: number) => {
    if (from === to) return;
    setForm((prev) => {
      const next = [...prev.heroSlides];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...prev, heroSlides: next };
    });
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Configuración de la tienda</h1>
      <p className="mb-8 text-sm text-muted">
        Ajustes generales del sitio y carrusel principal de Home.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("general")}
          className={`cursor-pointer rounded-[9px] border px-4 py-2 text-sm font-semibold ${
            tab === "general"
              ? "border-primary bg-primary text-white"
              : "border-border bg-surface text-foreground"
          }`}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setTab("getnet")}
          className={`cursor-pointer rounded-[9px] border px-4 py-2 text-sm font-semibold ${
            tab === "getnet"
              ? "border-primary bg-primary text-white"
              : "border-border bg-surface text-foreground"
          }`}
        >
          Getnet
        </button>
        <button
          type="button"
          onClick={() => setTab("personalCredit")}
          className={`cursor-pointer rounded-[9px] border px-4 py-2 text-sm font-semibold ${
            tab === "personalCredit"
              ? "border-primary bg-primary text-white"
              : "border-border bg-surface text-foreground"
          }`}
        >
          Créditos personales
        </button>
        <button
          type="button"
          onClick={() => setTab("carousel")}
          className={`cursor-pointer rounded-[9px] border px-4 py-2 text-sm font-semibold ${
            tab === "carousel"
              ? "border-primary bg-primary text-white"
              : "border-border bg-surface text-foreground"
          }`}
        >
          Carrusel Home
        </button>
      </div>

      <form
        onSubmit={onSave}
        className={`space-y-6 rounded-xl border border-border bg-surface p-6 ${
          tab === "carousel" ? "max-w-4xl" : "max-w-2xl"
        }`}
      >
        {tab === "general" && (
          <>
            <section className="space-y-3">
          <h2 className="text-sm font-bold tracking-wide text-muted uppercase">
            Identidad
          </h2>
          <input
            className={inputClass}
            placeholder="Nombre de la tienda"
            value={form.storeName}
            onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            required
          />
          <input
            className={inputClass}
            placeholder="Tagline"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          />
          <textarea
            className={`${inputClass} min-h-[80px]`}
            placeholder="Anuncio / banner"
            value={form.announcement}
            onChange={(e) => setForm({ ...form, announcement: e.target.value })}
          />
            </section>

            <section className="space-y-3">
          <h2 className="text-sm font-bold tracking-wide text-muted uppercase">
            Contacto
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Email soporte"
              type="email"
              value={form.supportEmail}
              onChange={(e) =>
                setForm({ ...form, supportEmail: e.target.value })
              }
            />
            <input
              className={inputClass}
              placeholder="Teléfono"
              value={form.supportPhone}
              onChange={(e) =>
                setForm({ ...form, supportPhone: e.target.value })
              }
            />
          </div>
            </section>

            <section className="space-y-3">
          <h2 className="text-sm font-bold tracking-wide text-muted uppercase">
            Moneda y envíos
          </h2>
          <ComboSelect
            value={normalizeCurrency(form.currency)}
            options={CURRENCY_OPTIONS}
            onChange={(currency) => setForm({ ...form, currency })}
            placeholder="Moneda"
            searchPlaceholder="Buscar moneda…"
            searchable
            fullWidth
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MoneyInput
              className={inputClass}
              placeholder={`Envío gratis desde (${currencyPrefix(normalizeCurrency(form.currency))})`}
              currency={normalizeCurrency(form.currency)}
              value={form.freeShippingFrom}
              onChange={(freeShippingFrom) =>
                setForm({
                  ...form,
                  freeShippingFrom: freeShippingFrom ?? 0,
                })
              }
            />
            <MoneyInput
              className={inputClass}
              placeholder={`Costo de envío (${currencyPrefix(normalizeCurrency(form.currency))})`}
              currency={normalizeCurrency(form.currency)}
              value={form.shippingCost}
              onChange={(shippingCost) =>
                setForm({
                  ...form,
                  shippingCost: shippingCost ?? 0,
                })
              }
            />
          </div>
            </section>

            <section className="space-y-3">
          <h2 className="text-sm font-bold tracking-wide text-muted uppercase">
            Modo mantenimiento
          </h2>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.maintenanceEnabled}
              onChange={(e) =>
                setForm({ ...form, maintenanceEnabled: e.target.checked })
              }
            />
            Mostrar página de mantenimiento a los visitantes
          </label>
          <p className="text-xs text-muted">
            Al guardar, la tienda pública deja de verse. El panel de admin y
            tu sesión de administrador siguen funcionando con normalidad.
          </p>
          <input
            className={inputClass}
            placeholder="Título"
            value={form.maintenanceTitle}
            onChange={(e) =>
              setForm({ ...form, maintenanceTitle: e.target.value })
            }
          />
          <input
            className={inputClass}
            placeholder="Mensaje"
            value={form.maintenanceMessage}
            onChange={(e) =>
              setForm({ ...form, maintenanceMessage: e.target.value })
            }
          />
            </section>

          </>
        )}

        {tab === "getnet" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold tracking-wide text-muted uppercase">
                Getnet
              </h2>
              <button
                type="button"
                onClick={() => setGetnetEditing((v) => !v)}
                className="cursor-pointer rounded-[9px] border border-border bg-transparent px-3 py-1.5 text-xs font-semibold"
              >
                {getnetEditing ? "Bloquear edición" : "Editar"}
              </button>
            </div>
            <p className="text-xs text-muted">
              Configurá coeficientes y costos de referencia para simular cuotas.
              Estos datos impactan en Checkout y Simulador.
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead className="bg-primary-softer text-left text-[12px] font-bold tracking-wide text-muted uppercase">
                  <tr>
                    <th className="px-3 py-2">Cuotas</th>
                    <th className="px-3 py-2">Coeficiente</th>
                    <th className="px-3 py-2">Descuento real (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { cuotas: 3, coeffKey: "coefficient3", discountKey: "discountPct3" },
                    { cuotas: 6, coeffKey: "coefficient6", discountKey: "discountPct6" },
                    { cuotas: 9, coeffKey: "coefficient9", discountKey: "discountPct9" },
                    { cuotas: 12, coeffKey: "coefficient12", discountKey: "discountPct12" },
                    { cuotas: 18, coeffKey: "coefficient18", discountKey: "discountPct18" },
                    { cuotas: 24, coeffKey: "coefficient24", discountKey: "discountPct24" },
                  ].map((row) => (
                    <tr key={row.cuotas} className="border-t border-border-soft">
                      <td className="px-3 py-2 font-semibold">{row.cuotas}</td>
                      <td className="px-3 py-2">
                        <input
                          className={`${inputClass} ${!getnetEditing ? "cursor-not-allowed opacity-70" : ""}`}
                          type="number"
                          step="0.0001"
                          disabled={!getnetEditing}
                          value={form.getnet[row.coeffKey as keyof typeof form.getnet] as number}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              getnet: {
                                ...form.getnet,
                                [row.coeffKey]: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className={`${inputClass} ${!getnetEditing ? "cursor-not-allowed opacity-70" : ""}`}
                          type="number"
                          step="0.0001"
                          disabled={!getnetEditing}
                          value={form.getnet[row.discountKey as keyof typeof form.getnet] as number}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              getnet: {
                                ...form.getnet,
                                [row.discountKey]: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead className="bg-primary-softer text-left text-[12px] font-bold tracking-wide text-muted uppercase">
                  <tr>
                    <th className="px-3 py-2">Costo</th>
                    <th className="px-3 py-2">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border-soft">
                    <td className="px-3 py-2 font-semibold">Arancel cuotas (%)</td>
                    <td className="px-3 py-2">
                      <input
                        className={`${inputClass} ${!getnetEditing ? "cursor-not-allowed opacity-70" : ""}`}
                        type="number"
                        step="0.01"
                        disabled={!getnetEditing}
                        value={form.getnet.arancelInstallmentsPct}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            getnet: {
                              ...form.getnet,
                              arancelInstallmentsPct: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </td>
                  </tr>
                  <tr className="border-t border-border-soft">
                    <td className="px-3 py-2 font-semibold">IVA (%)</td>
                    <td className="px-3 py-2">
                      <input
                        className={`${inputClass} ${!getnetEditing ? "cursor-not-allowed opacity-70" : ""}`}
                        type="number"
                        step="0.01"
                        disabled={!getnetEditing}
                        value={form.getnet.ivaPct}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            getnet: { ...form.getnet, ivaPct: Number(e.target.value) },
                          })
                        }
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted">
              Tip: con el descuento real por plan, el checkout calcula un
              ajuste sugerido para no perder contra el contado.
            </p>
          </section>
        )}

        {tab === "carousel" && (
          <section className="space-y-4">
          <h2 className="text-sm font-bold tracking-wide text-muted uppercase">
            Home · Carrusel principal
          </h2>
          <p className="text-sm text-muted">
            Cargá imágenes y a dónde redirige cada slide. El orden que definís
            acá es exactamente el que se muestra en Home.
          </p>
          <p className="text-xs text-muted">
            Recomendado: desktop 1920x900 y mobile 1080x1350 (o proporción
            vertical similar).
          </p>

          <div className="space-y-5">
            {form.heroSlides.map((slide, i) => (
              <div
                key={`${slide.imageUrl || "slide"}-${i}`}
                draggable
                onDragStart={() => {
                  setDragIndex(i);
                  setDragOverIndex(i);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIndex(i);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex == null) return;
                  reorderHeroSlide(dragIndex, i);
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                className={`rounded-xl border bg-background/30 p-4 transition-colors ${
                  dragOverIndex === i && dragIndex !== i
                    ? "border-primary bg-primary-softer/40"
                    : "border-border"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-muted uppercase">
                    <span
                      className="inline-flex h-6 w-6 cursor-grab items-center justify-center rounded border border-border bg-surface text-[11px] active:cursor-grabbing"
                      title="Arrastrar para reordenar"
                      aria-hidden
                    >
                      ≡
                    </span>
                    <span>Slide {i + 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveHeroSlide(i, -1)}
                      disabled={i === 0}
                      className="cursor-pointer rounded border border-border bg-transparent px-2 py-1 text-xs font-semibold disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveHeroSlide(i, 1)}
                      disabled={i === form.heroSlides.length - 1}
                      className="cursor-pointer rounded border border-border bg-transparent px-2 py-1 text-xs font-semibold disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHeroSlide(i)}
                      className="cursor-pointer rounded border border-sale/35 bg-danger-soft px-2 py-1 text-xs font-semibold text-sale"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
                <ImageUploader
                  value={slide.imageUrl || null}
                  onChange={(imageUrl) =>
                    updateHeroSlide(i, { imageUrl: imageUrl ?? "" })
                  }
                  folder="home-slides"
                  label="Imagen desktop"
                  fit="cover"
                />
                <div className="mt-3">
                  <ImageUploader
                    value={slide.mobileImageUrl || null}
                    onChange={(mobileImageUrl) =>
                      updateHeroSlide(i, { mobileImageUrl: mobileImageUrl ?? "" })
                    }
                    folder="home-slides"
                    label="Imagen mobile (opcional)"
                    fit="cover"
                  />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    className={inputClass}
                    placeholder="Título opcional (ej. Ofertas de la semana)"
                    value={slide.title ?? ""}
                    onChange={(e) => updateHeroSlide(i, { title: e.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder="Destino (ej. /catalogo?categoria=notebooks)"
                    value={slide.href}
                    onChange={(e) => updateHeroSlide(i, { href: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addHeroSlide}
            className="cursor-pointer rounded-[9px] border border-border bg-transparent px-4 py-2 text-sm font-semibold"
          >
            + Agregar slide
          </button>
          </section>
        )}

        {tab === "personalCredit" && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold tracking-wide text-muted uppercase">
              Créditos personales
            </h2>
            <p className="text-xs text-muted">
              Definí el interés estimado por plan (sobre precio de contado) para
              la simulación de crédito personal.
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead className="bg-primary-softer text-left text-[12px] font-bold tracking-wide text-muted uppercase">
                  <tr>
                    <th className="px-3 py-2">Cuotas</th>
                    <th className="px-3 py-2">Interés estimado (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { cuotas: 3, key: "surchargePct3" },
                    { cuotas: 6, key: "surchargePct6" },
                    { cuotas: 9, key: "surchargePct9" },
                    { cuotas: 12, key: "surchargePct12" },
                  ].map((row) => (
                    <tr key={row.cuotas} className="border-t border-border-soft">
                      <td className="px-3 py-2 font-semibold">{row.cuotas}</td>
                      <td className="px-3 py-2">
                        <input
                          className={inputClass}
                          type="number"
                          step="0.01"
                          value={
                            form.personalCredit[
                              row.key as keyof typeof form.personalCredit
                            ] as number
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,
                              personalCredit: {
                                ...form.personalCredit,
                                [row.key]: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            className="cursor-pointer rounded-[9px] border-none bg-primary px-5 py-2.5 text-sm font-bold !text-white"
          >
            Guardar cambios
          </button>
          <button
            type="button"
            onClick={() => {
              void resetConfig();
              setSaved(false);
            }}
            className="cursor-pointer rounded-[9px] border border-border bg-transparent px-5 py-2.5 text-sm font-semibold"
          >
            Restaurar defaults
          </button>
          {saved && (
            <span className="text-sm font-semibold text-success">
              Guardado ✓
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
