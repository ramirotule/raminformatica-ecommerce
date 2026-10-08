import { whatsappHref } from "@/lib/social";

/** Redes oficiales de RAM Informatica. */
const SOCIAL_LINKS = [
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/ram.informatica",
  },
  {
    id: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/ram.informatica",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: whatsappHref(),
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-5 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-8 px-6 py-10 md:grid-cols-4 md:px-10">
        <div>
          <div className="mb-2.5 text-[12.5px] font-bold">Redes Sociales</div>
          <p className="mb-3 max-w-[220px] text-[13px] leading-relaxed text-muted">
          Seguinos en nuestras redes sociales y mantenete al tanto de los ultimos ingresos, novedades, promociones y lanzamientos de RAM Informatica.
          </p>
          <div className="flex flex-wrap gap-2">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.id}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Seguinos en ${social.label}`}
                title={social.label}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted no-underline transition-colors hover:border-primary hover:text-primary hover:!no-underline"
              >
                <SocialIcon id={social.id} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2.5 text-[12.5px] font-bold">Ayuda</div>
          <div className="flex flex-col gap-2 text-[13px] text-muted">
            <a
              href="/contacto"
              className="text-muted no-underline hover:text-primary hover:!no-underline"
            >
              Contacto
            </a>
            <a
              href="/envios"
              className="text-muted no-underline hover:text-primary hover:!no-underline"
            >
              Envíos
            </a>
          </div>
        </div>
        <div>
          <div className="mb-2.5 text-[12.5px] font-bold">Empresa</div>
          <div className="flex flex-col gap-2 text-[13px] text-muted">
            <a
              href="/nosotros"
              className="text-muted no-underline hover:text-primary hover:!no-underline"
            >
              Sobre nosotros
            </a>
            <a
              href="/marcas"
              className="text-muted no-underline hover:text-primary hover:!no-underline"
            >
              Marcas
            </a>
          </div>
        </div>
        <div>
          <div className="mb-2.5 text-[12.5px] font-bold">Pagos</div>
          <div className="flex flex-col gap-2 text-[13px] text-muted">
            <span>Tarjetas de Crédito</span>
            <span>Mercado Pago</span>
            <span>Getnet</span>
            <span>Transferencia Bancaria</span>
          </div>
        </div>
      </div>
      <div className="border-t border-border-soft px-6 py-4 text-xs text-muted-soft md:px-10">
        © 2026 RAM Informatica. Todos los derechos reservados.
      </div>
    </footer>
  );
}

function SocialIcon({ id }: { id: (typeof SOCIAL_LINKS)[number]["id"] }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true as const,
  };

  switch (id) {
    case "instagram":
      return (
        <svg {...common}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 1.441c-3.153 0-3.507.012-4.74.07-2.186.1-3.223 1.13-3.323 3.323-.058 1.23-.07 1.57-.07 4.74s.012 3.507.07 4.74c.1 2.186 1.13 3.223 3.323 3.323 1.233.058 1.587.07 4.74.07s3.507-.012 4.74-.07c2.186-.1 3.223-1.13 3.323-3.323.058-1.233.07-1.587.07-4.74s-.012-3.51-.07-4.74c-.1-2.186-1.13-3.223-3.323-3.323-1.233-.058-1.587-.07-4.74-.07zm0 3.708a4.688 4.688 0 1 1 0 9.376 4.688 4.688 0 0 1 0-9.376zm0 7.735a3.047 3.047 0 1 0 0-6.094 3.047 3.047 0 0 0 0 6.094zm6.162-7.93a1.096 1.096 0 1 1-2.192 0 1.096 1.096 0 0 1 2.192 0z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M13.5 22v-8.5H16l.5-3.5h-3V8.25c0-1 .3-1.75 1.75-1.75H16.5V3.4C16.1 3.35 14.9 3.25 13.5 3.25 10.6 3.25 8.75 5 8.75 8v2H6v3.5h2.75V22h4.75z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
          <path d="M12.04 2C6.58 2 2.15 6.43 2.15 11.89c0 1.75.46 3.45 1.33 4.95L2 22l5.3-1.39a9.86 9.86 0 0 0 4.74 1.21h.01c5.46 0 9.89-4.43 9.89-9.89C21.94 6.43 17.5 2 12.04 2zm0 18.07h-.01a8.18 8.18 0 0 1-4.17-1.14l-.3-.18-3.15.83.84-3.07-.2-.32a8.18 8.18 0 0 1-1.25-4.36c0-4.52 3.68-8.2 8.21-8.2 2.19 0 4.25.85 5.8 2.4a8.16 8.16 0 0 1 2.4 5.8c0 4.53-3.68 8.2-8.17 8.2z" />
        </svg>
      );
  }
}
