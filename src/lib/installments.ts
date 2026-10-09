/** Recargo por plan (% sobre el precio de contado). Ajustar a las tasas reales. */
export const INSTALLMENT_PLANS = [
  { cuotas: 1, surcharge: 0 },
  { cuotas: 3, surcharge: 15 },
  { cuotas: 6, surcharge: 30 },
  { cuotas: 9, surcharge: 42 },
  { cuotas: 12, surcharge: 55 },
];

/** Valor de cada cuota (en la misma moneda que `amount`). */
export function installmentValue(amount: number, plan: { cuotas: number; surcharge: number }) {
  return (amount * (1 + plan.surcharge / 100)) / plan.cuotas;
}
