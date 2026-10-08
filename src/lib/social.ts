/** Número fallback si aún no hay teléfono en la config de la tienda. */
export const WHATSAPP_FALLBACK_PHONE = "5492954227622";

export function whatsappHref(phone?: string, text?: string) {
  const digits = (phone || WHATSAPP_FALLBACK_PHONE).replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
