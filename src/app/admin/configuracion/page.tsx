"use client";

import { useEffect, useState } from "react";
import { ComboSelect } from "@/components/ComboSelect";
import { useDialog } from "@/components/DialogProvider";
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

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Configuración de la tienda</h1>
      <p className="mb-8 text-sm text-muted">
        Datos generales, envíos y financiamiento.
      </p>

      <form
        onSubmit={onSave}
        className="max-w-2xl space-y-6 rounded-xl border border-border bg-surface p-6"
      >
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
            Cuotas
          </h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.installmentsEnabled}
              onChange={(e) =>
                setForm({ ...form, installmentsEnabled: e.target.checked })
              }
            />
            Habilitar cuotas sin interés
          </label>
          <input
            className={inputClass}
            placeholder="Máximo de cuotas"
            type="number"
            min={1}
            max={24}
            value={form.maxInstallments}
            onChange={(e) =>
              setForm({
                ...form,
                maxInstallments: Number(e.target.value) || 1,
              })
            }
          />
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
