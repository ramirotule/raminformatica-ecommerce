import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nosotros — RAM Informática",
  description:
    "Somos RAM Informática, fanáticos de la tecnología en Santa Rosa, La Pampa. Precios claros y ganas de asesorarte.",
};

export default function NosotrosPage() {
  return (
    <div className="-mx-6 md:-mx-10">
      {/* HERO — ocupa el primer viewport para no “filtrar” la sección siguiente */}
      <section className="relative flex min-h-[calc(100dvh-104px)] flex-col justify-center overflow-hidden border-b border-border md:min-h-[calc(100dvh-120px)]">
        <div className="rj-hero-glow absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,color-mix(in_oklch,var(--primary)_28%,transparent),transparent_55%),radial-gradient(ellipse_at_85%_10%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_45%),linear-gradient(160deg,var(--background),var(--surface))]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

        <div className="relative mx-auto w-full max-w-[1280px] px-6 py-16 md:px-10 md:py-20">
          <p className="rj-fade-up mb-4 text-[13px] font-bold tracking-[0.18em] text-primary uppercase">
            RAM Informática · Santa Rosa, La Pampa
          </p>
          <h1 className="rj-fade-up-delay max-w-[18ch] text-[40px] leading-[1.05] font-bold tracking-tight text-foreground md:text-[56px]">
            Tecnología con alma pampeana.
          </h1>
          <p className="rj-fade-up-delay-2 mt-5 max-w-[34rem] text-base leading-relaxed text-muted md:text-lg">
            Nacimos en Santa Rosa con una obsesión sana: que la mejor tech no
            sea un misterio ni una estafa. Somos fanáticos de lo que vendemos —
            y nos encanta que te lleves el equipo correcto.
          </p>
          <div className="rj-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <Link
              href="/catalogo"
              className="rounded-[9px] bg-primary px-6 py-3.5 text-[15px] font-semibold !text-white no-underline hover:bg-primary-dark hover:!no-underline"
            >
              Ver catálogo
            </Link>
            <a
              href="#historia"
              className="rounded-[9px] border border-border bg-surface/80 px-6 py-3.5 text-[15px] font-semibold text-foreground no-underline backdrop-blur hover:!no-underline"
            >
              Nuestra historia
            </a>
          </div>
        </div>

        <a
          href="#historia"
          aria-label="Ir a Quiénes somos"
          className="rj-fade-in absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-muted no-underline hover:text-primary hover:!no-underline"
        >
          <span className="text-[11px] font-semibold tracking-wider uppercase">
            Seguí
          </span>
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </section>

      {/* HISTORIA */}
      <section className="mx-auto max-w-[1280px] px-6 py-16 md:px-10 md:py-24">
        <div className="max-w-[40rem]">
          <p
            id="historia"
            className="mb-3 scroll-mt-[120px] text-[13px] font-bold tracking-wider text-primary uppercase md:scroll-mt-[136px]"
          >
            Quiénes somos
          </p>
          <h2 className="mb-5 text-[28px] leading-tight font-bold tracking-tight md:text-[34px]">
            Un equipo chico, con ganas enormes de laburar la tecnología bien.
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-body-text">
            <p>
              RAM Informática nació en agosto de 2008 en Santa Rosa, La Pampa.
              No salimos de una oficina de vidrio en Capital: salimos de acá,
              de la calle pampeana, con ganas de que la buena tecnología esté
              al alcance de todos y sin chamuyo barato.
            </p>
            <p>
              Durante más de 13 años tuvimos nuestro local a la calle, hasta
              octubre de 2021. Ahí atendimos a cientos de clientes, probamos,
              comparamos, peleamos precios y explicamos en criollo por qué ese
              celular, notebook o tele era el que te convenía.
            </p>
            <p>
              Después de esa etapa cerramos las puertas del local, pero la
              historia siguió: hoy vendemos de forma online a través de nuestro
              ecommerce, con la misma buena onda y la misma energía de siempre.
              Cambió el mostrador, no las ganas: seguimos respondiendo por chat
              y acompañándote después de la compra, ahora a todo el país.
            </p>
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-10 md:py-20">
          <div className="mb-10 max-w-[36rem]">
            <p className="mb-3 text-[13px] font-bold tracking-wider text-primary uppercase">
              Cómo laburamos
            </p>
            <h2 className="text-[28px] leading-tight font-bold tracking-tight md:text-[32px]">
              Tres cosas que no negociamos.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-3">
            {[
              {
                title: "Precios claros",
                text: "Publicamos cada precio de forma transparente y te explicamos todo antes de comprar, sin letra chica.",
              },
              {
                title: "Asesoramiento honesto",
                text: "Te preguntamos para qué lo necesitás y te guiamos. A veces el más caro no es el mejor para vos.",
              },
              {
                title: "Cercanía pampeana",
                text: "Somos de Santa Rosa: respondemos, explicamos y estamos cuando hace falta. Tecnología sin soberbia.",
              },
            ].map((item, i) => (
              <div key={item.title} className="rj-fade-in border-t border-border pt-5">
                <div className="mb-3 text-[12px] font-bold tracking-wider text-muted-soft">
                  0{i + 1}
                </div>
                <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
                <p className="text-[14.5px] leading-relaxed text-muted">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UBICACIÓN */}
      <section className="mx-auto max-w-[1280px] px-6 py-16 md:px-10 md:py-24">
        <div className="overflow-hidden rounded-[22px] border border-border bg-[linear-gradient(135deg,var(--primary-soft),var(--surface)_40%,var(--accent-soft))] px-7 py-10 md:px-12 md:py-14">
          <p className="mb-3 text-[13px] font-bold tracking-wider text-primary uppercase">
            Dónde estamos
          </p>
          <h2 className="mb-4 max-w-[16ch] text-[30px] leading-tight font-bold tracking-tight md:text-[40px]">
            Santa Rosa, La Pampa.
          </h2>
          <p className="mb-8 max-w-[36rem] text-[15px] leading-relaxed text-body-text md:text-base">
          Nuestra base está en Santa Rosa, pero llegamos mucho más lejos. Desde La Pampa llevamos tecnología a todo el país, combinando buenos productos, atención cercana y una experiencia de compra simple.
          </p>
          <div className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
            <div>
              <div className="mb-1 text-[11px] font-bold tracking-wider text-muted uppercase">
                Ciudad
              </div>
              <div className="font-semibold text-foreground">Santa Rosa</div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold tracking-wider text-muted uppercase">
                Provincia
              </div>
              <div className="font-semibold text-foreground">La Pampa</div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold tracking-wider text-muted uppercase">
                Envíos
              </div>
              <div className="font-semibold text-foreground">Todo el país</div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold tracking-wider text-muted uppercase">
                WhatsApp
              </div>
              <div className="font-semibold text-foreground">2954227622</div>
            </div>
          </div>
          <div className="mt-6 grid gap-3 text-sm text-body-text md:grid-cols-2">
            <a
              href="https://www.instagram.com/ram.informatica"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border bg-surface px-4 py-3 font-medium text-foreground no-underline hover:!no-underline"
            >
              Instagram: @ram.informatica
            </a>
            <a
              href="https://www.facebook.com/ram.informatica"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border bg-surface px-4 py-3 font-medium text-foreground no-underline hover:!no-underline"
            >
              Facebook: ram.informatica
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 px-6 py-14 md:flex-row md:items-center md:px-10">
          <div>
            <h2 className="mb-2 text-[24px] font-bold tracking-tight md:text-[28px]">
              ¿Buscás tu próximo equipo?
            </h2>
            <p className="max-w-[32rem] text-sm text-muted md:text-[15px]">
              Pasá por el catálogo, mirá con calma y escribinos si necesitás
              una mano. Estamos para eso.
            </p>
          </div>
          <Link
            href="/catalogo"
            className="shrink-0 rounded-[9px] bg-primary px-6 py-3.5 text-[15px] font-semibold whitespace-nowrap !text-white no-underline hover:bg-primary-dark hover:!no-underline"
          >
            Ir al catálogo
          </Link>
        </div>
      </section>
    </div>
  );
}
