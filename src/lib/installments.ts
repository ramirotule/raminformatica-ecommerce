/**
 * Recargo por plan (% sobre el precio de contado), calculado de la tabla
 * "Total a cobrar" de GETNET (1 pago $1.809.386 → 3 cuotas $1.889.357,
 * 6 → $2.036.962, 9 → $2.248.940, 12 → $2.440.966).
 */
export const INSTALLMENT_PLANS = [
  { cuotas: 1, surcharge: 0 },
  { cuotas: 3, surcharge: 4.4198 },
  { cuotas: 6, surcharge: 12.5775 },
  { cuotas: 9, surcharge: 24.293 },
  { cuotas: 12, surcharge: 34.9058 },
];

/** Valor de cada cuota (en la misma moneda que `amount`). */
export function installmentValue(amount: number, plan: { cuotas: number; surcharge: number }) {
  return (amount * (1 + plan.surcharge / 100)) / plan.cuotas;
}
