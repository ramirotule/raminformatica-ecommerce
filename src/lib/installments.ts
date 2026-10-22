/**
 * Recargo por plan (% sobre el precio de contado) según tabla pública de
 * Getnet Argentina (coeficiente emisor bancario):
 * https://www.getnet.net/ar/aranceles
 *
 * Nota: estos valores modelan el monto a cobrar al cliente para cuotas.
 * El neto acreditado al comercio depende además de aranceles, IVA,
 * modalidad/plazo de acreditación y eventuales retenciones/impuestos.
 */
export const INSTALLMENT_PLANS = [
  { cuotas: 1, surcharge: 0 },
  { cuotas: 3, surcharge: 9.13 },
  { cuotas: 6, surcharge: 16.66 },
  { cuotas: 9, surcharge: 27.24 },
  { cuotas: 12, surcharge: 36.59 },
];

/** Valor de cada cuota (en la misma moneda que `amount`). */
export function installmentValue(amount: number, plan: { cuotas: number; surcharge: number }) {
  return (amount * (1 + plan.surcharge / 100)) / plan.cuotas;
}
