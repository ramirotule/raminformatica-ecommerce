"use client";

import { whatsappHref } from "@/lib/social";

const PREFILL =
  "Hola! estoy en la web de RAM Informatica y quiero hacer una consulta 🙂";
const CONTACT_PHONE = "5492954227622";

export function ContactWhatsAppCard() {
  const href = whatsappHref(CONTACT_PHONE, PREFILL);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3.5 rounded-xl border border-border bg-surface px-5 py-4 no-underline transition-colors hover:border-[#26D366] hover:bg-[#26D366]/10 hover:!no-underline"
    >
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#26D366] text-white shadow-[0_6px_16px_rgba(38,211,102,0.35)]">
        <WhatsAppIcon />
      </span>
      <span className="min-w-0">
        <span className="mb-1 block text-[11px] font-bold tracking-wider text-muted uppercase">
          WhatsApp
        </span>
        <span className="block font-semibold text-foreground group-hover:text-[#128C7E]">
          Envianos un WhatsApp
        </span>
        <span className="mt-1 block text-[13px] text-muted">
          Te respondemos a la brevedad.
        </span>
      </span>
    </a>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.15 6.43 2.15 11.89c0 1.75.46 3.45 1.33 4.95L2 22l5.3-1.39a9.86 9.86 0 0 0 4.74 1.21h.01c5.46 0 9.89-4.43 9.89-9.89C21.94 6.43 17.5 2 12.04 2zm0 18.07h-.01a8.18 8.18 0 0 1-4.17-1.14l-.3-.18-3.15.83.84-3.07-.2-.32a8.18 8.18 0 0 1-1.25-4.36c0-4.52 3.68-8.2 8.21-8.2 2.19 0 4.25.85 5.8 2.4a8.16 8.16 0 0 1 2.4 5.8c0 4.53-3.68 8.2-8.17 8.2z" />
    </svg>
  );
}
