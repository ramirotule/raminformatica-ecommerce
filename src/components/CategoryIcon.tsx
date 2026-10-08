import type { CategoryId } from "@/lib/products";

type Props = {
  category: CategoryId;
  className?: string;
};

const iconClass = "h-6 w-6";

function IconShell({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden
    >
      {children}
    </svg>
  );
}

type IconKey =
  | "celulares"
  | "notebooks"
  | "macbooks"
  | "videojuego"
  | "televisores"
  | "gadgets"
  | "audio"
  | "cargadores"
  | "tablets"
  | "smartwatches"
  | "default";

function resolveIconKey(category: string): IconKey {
  const id = category.trim().toLowerCase();

  const exact: Record<string, IconKey> = {
    celulares: "celulares",
    celular: "celulares",
    phones: "celulares",
    notebooks: "notebooks",
    notebook: "notebooks",
    laptops: "notebooks",
    macbooks: "macbooks",
    macbook: "macbooks",
    videojuego: "videojuego",
    videojuegos: "videojuego",
    gaming: "videojuego",
    juegos: "videojuego",
    consolas: "videojuego",
    televisores: "televisores",
    televisor: "televisores",
    tvs: "televisores",
    tv: "televisores",
    gadgets: "gadgets",
    gadget: "gadgets",
    audio: "audio",
    auriculares: "audio",
    cargadores: "cargadores",
    cargador: "cargadores",
    chargers: "cargadores",
    tablets: "tablets",
    tablet: "tablets",
    smartwatches: "smartwatches",
    smartwatch: "smartwatches",
    relojes: "smartwatches",
    wearables: "smartwatches",
  };

  if (exact[id]) return exact[id];

  if (id.includes("celular") || id.includes("phone") || id.includes("iphone"))
    return "celulares";
  if (id.includes("macbook")) return "macbooks";
  if (id.includes("notebook") || id.includes("laptop")) return "notebooks";
  if (
    id.includes("game") ||
    id.includes("juego") ||
    id.includes("gaming") ||
    id.includes("consola")
  )
    return "videojuego";
  if (id.includes("tv") || id.includes("tele")) return "televisores";
  if (id.includes("audio") || id.includes("auricular") || id.includes("headphone"))
    return "audio";
  if (id.includes("carga") || id.includes("charger") || id.includes("cable"))
    return "cargadores";
  if (id.includes("tablet") || id.includes("ipad")) return "tablets";
  if (id.includes("watch") || id.includes("reloj") || id.includes("wearable"))
    return "smartwatches";
  if (id.includes("gadget") || id.includes("accesorio")) return "gadgets";

  return "default";
}

function CategoryGlyph({ icon }: { icon: IconKey }) {
  switch (icon) {
    case "celulares":
      return (
        <IconShell>
          <rect x="7" y="2.5" width="10" height="19" rx="2" />
          <path d="M11 18.5h2" />
        </IconShell>
      );
    case "notebooks":
      return (
        <IconShell>
          <rect x="3" y="4" width="18" height="12" rx="1.5" />
          <path d="M2 19h20" />
          <path d="M9 19v-1.5h6V19" />
        </IconShell>
      );
    case "macbooks":
      return (
        <IconShell>
          <rect x="3.5" y="3.5" width="17" height="11.5" rx="1.5" />
          <path d="M8 18.5h8" />
          <path d="M10.5 15v3.5M13.5 15v3.5" />
          <circle cx="12" cy="9" r="1.2" fill="currentColor" stroke="none" />
        </IconShell>
      );
    case "videojuego":
      return (
        <IconShell>
          <path d="M6.5 8.5h11a3.5 3.5 0 0 1 3.4 4.3l-.7 2.8A3 3 0 0 1 17.3 18H6.7a3 3 0 0 1-2.9-2.4l-.7-2.8A3.5 3.5 0 0 1 6.5 8.5z" />
          <path d="M9 12v3M7.5 13.5h3" />
          <circle cx="15.5" cy="12.5" r="0.7" fill="currentColor" stroke="none" />
          <circle cx="17.2" cy="14.2" r="0.7" fill="currentColor" stroke="none" />
        </IconShell>
      );
    case "televisores":
      return (
        <IconShell>
          <rect x="2.5" y="4" width="19" height="12.5" rx="1.5" />
          <path d="M9 20h6M12 16.5V20" />
        </IconShell>
      );
    case "gadgets":
      return (
        <IconShell>
          <rect x="6" y="2.5" width="12" height="19" rx="3" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 7.5v1.2M12 15.3v1.2M8.5 12H7.3M16.7 12H15.5" />
        </IconShell>
      );
    case "audio":
      return (
        <IconShell>
          <path d="M4 13.5v-2a8 8 0 0 1 16 0v2" />
          <rect x="2.5" y="12" width="4" height="7" rx="1.5" />
          <rect x="17.5" y="12" width="4" height="7" rx="1.5" />
        </IconShell>
      );
    case "cargadores":
      return (
        <IconShell>
          <path d="M9 2.5v3M15 2.5v3" />
          <rect x="7" y="5.5" width="10" height="11" rx="2" />
          <path d="M10 16.5v2.5a2 2 0 0 0 4 0v-2.5" />
          <path d="M10.5 9.5h3M10.5 12.5h3" />
        </IconShell>
      );
    case "tablets":
      return (
        <IconShell>
          <rect x="5" y="2.5" width="14" height="19" rx="2" />
          <path d="M11 18.5h2" />
          <path d="M8 5.5h8" />
        </IconShell>
      );
    case "smartwatches":
      return (
        <IconShell>
          <rect x="7.5" y="7" width="9" height="10" rx="2.5" />
          <path d="M9.5 7V4.5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 4.5V7" />
          <path d="M9.5 17v2.5a1.5 1.5 0 0 0 1.5 1.5h2a1.5 1.5 0 0 0 1.5-1.5V17" />
          <path d="M11 11.5h2.2M12 11.5V14" />
        </IconShell>
      );
    default:
      return (
        <IconShell>
          <path d="M4 7h16v10H4z" />
          <path d="M8 7V5.5A4 4 0 0 1 12 1.5 4 4 0 0 1 16 5.5V7" />
        </IconShell>
      );
  }
}

export function CategoryIcon({ category, className = "" }: Props) {
  const icon = resolveIconKey(category);

  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-muted-soft ${className}`}
    >
      <CategoryGlyph icon={icon} />
    </div>
  );
}

/**
 * Placeholder para productos sin foto: ícono de la categoría + "Foto no
 * disponible". Se escala con el tamaño del contenedor (container queries).
 */
export function CategoryPlaceholder({
  category,
  label = "Foto no disponible",
}: {
  category: CategoryId;
  label?: string;
}) {
  const icon = resolveIconKey(category);

  return (
    <span className="@container absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-soft">
      <span className="flex items-center justify-center [&>svg]:!h-[34cqw] [&>svg]:!w-[34cqw] [&>svg]:!max-h-[140px] [&>svg]:!max-w-[140px] [&>svg]:!stroke-[1.1]">
        <CategoryGlyph icon={icon} />
      </span>
      <span className="hidden px-2 text-center font-sans text-[11px] font-semibold @[120px]:block @[300px]:text-[13px]">
        {label}
      </span>
    </span>
  );
}
