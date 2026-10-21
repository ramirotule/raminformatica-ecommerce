import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LogoEvolutionGallery from "@/components/LogoEvolutionGallery";

export const metadata: Metadata = {
  title: "Nosotros — RAM Informática",
  description:
    "Conocé la historia de RAM Informática desde 2008 en Santa Rosa, La Pampa: del local a la calle al ecommerce actual.",
};

export default function NosotrosPage() {
  return (
    <div className="-mx-6 md:-mx-10">
      {/* HISTORIA */}
      <section className="mx-auto max-w-[1280px] px-6 pt-6 pb-16 md:px-10 md:pt-8 md:pb-24">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="max-w-[42rem]">
            <p
              id="historia"
              className="mb-3 scroll-mt-[120px] text-[13px] font-bold tracking-wider text-primary uppercase md:scroll-mt-[136px]"
            >
              Quiénes somos
            </p>
            <h2 className="mb-5 text-[28px] leading-tight font-bold tracking-tight md:text-[34px]">
              Nuestra historia: del local a la calle al ecommerce.
            </h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-body-text">
              <p>
                RAM Informática nació en <strong>agosto de 2008</strong>, con local
                a la calle en Santa Rosa, La Pampa. Arrancamos enfocados en lo
                que sabíamos hacer bien: <strong>servicio técnico</strong> y
                venta de informática en general, computadoras y tecnología.
              </p>
              <p>
                Durante más de 13 años mantuvimos nuestras puertas abiertas al
                público, hasta <strong>octubre de 2021</strong>. Fue una etapa de
                mucho mostrador, atención cara a cara y confianza construida
                producto por producto.
              </p>
              <p>
                En 2021 cerramos el local comercial y abrimos una nueva era:
                nuestro <strong>e-commerce</strong>. Cambió el formato, pero no
                la esencia: seguimos con la misma atención y el mismo
                profesionalismo de siempre.
              </p>
              <p>
                Importante: hoy <strong>ya no realizamos servicio técnico</strong>.
                Actualmente estamos enfocados en la venta online de productos de
                informática y tecnología, con asesoramiento personalizado para
                ayudarte a elegir bien.
              </p>
            </div>

            <div className="mt-8">
              <p className="mb-2 text-[13px] font-bold tracking-wider text-primary uppercase">
                Dónde estamos
              </p>
              <h3 className="mb-2 text-[24px] leading-tight font-bold tracking-tight md:text-[28px]">
                Santa Rosa, La Pampa.
              </h3>
              <p className="text-[14.5px] leading-relaxed text-body-text">
                Nuestra base está en Santa Rosa y desde acá operamos nuestro
                ecommerce para todo el país, manteniendo una atención cercana y
                profesional en cada consulta.
              </p>
            </div>

            <div className="mt-8">
              <p className="mb-2 text-[13px] font-bold tracking-wider text-primary uppercase">
                Cómo laburamos
              </p>
              <h3 className="mb-4 text-[24px] leading-tight font-bold tracking-tight md:text-[28px]">
                Tres cosas que no negociamos.
              </h3>
              <div className="space-y-3 text-[15px] leading-relaxed text-body-text">
                <p>
                  <strong className="text-foreground">Precios claros:</strong>{" "}
                  publicamos cada precio de forma transparente y te explicamos
                  todo antes de comprar, sin letra chica.
                </p>
                <p>
                  <strong className="text-foreground">
                    Asesoramiento honesto:
                  </strong>{" "}
                  te preguntamos para qué lo necesitás y te guiamos. A veces el
                  más caro no es el mejor para vos.
                </p>
                <p>
                  <strong className="text-foreground">Cercanía pampeana:</strong>{" "}
                  somos de Santa Rosa: respondemos, explicamos y estamos cuando
                  hace falta. Tecnología sin soberbia.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <p className="mb-2 text-[13px] font-bold tracking-wider text-primary uppercase">
                Qué podés encontrar
              </p>
              <h3 className="mb-2 text-[24px] leading-tight font-bold tracking-tight md:text-[28px]">
                Tu próxima compra tech está acá.
              </h3>
              <p className="max-w-[34rem] text-[14.5px] leading-relaxed text-body-text">
                Explorá el catálogo de celulares, consolas, notebooks y más.
                Si necesitás ayuda para elegir, te asesoramos.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/catalogo"
                className="rounded-[9px] bg-primary px-5 py-3 text-sm font-semibold !text-white no-underline hover:bg-primary-dark hover:!no-underline"
              >
                Ver catálogo
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="relative aspect-[4/3] w-full bg-accent-soft">
                <Image
                  src="/nosotros/local-ram-2008.jpg"
                  alt="Local original de RAM Informática en Santa Rosa"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
              <div className="border-t border-border bg-surface px-4 py-3">
                <div className="text-sm font-semibold">Nuestro local original</div>
                <div className="text-[13px] text-muted">
                  Frente del local histórico de RAM Informática en Santa Rosa.
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 text-[13.5px] text-body-text">
              <div className="mb-2 text-[11px] font-bold tracking-wide text-primary uppercase">
                Línea de tiempo
              </div>
              <div>• 2008: apertura del local y servicio técnico</div>
              <div>• 2008–2021: atención presencial y venta en mostrador</div>
              <div>• 2021: nueva etapa 100% ecommerce con envíos al país</div>
              <a
                href="https://www.google.com/search?q=RAM+Inform%C3%A1tica+Santa+Rosa+La+Pampa#lrd=0x95c2cd053e4810c5:0x836e3c7663130fc0,1,,,,"
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-4 inline-flex w-full overflow-hidden rounded-xl border border-border bg-surface no-underline transition-colors hover:border-primary hover:!no-underline"
              >
                <div className="relative w-full">
                  <Image
                    src="/nosotros/google-reviews-card.png"
                    alt="Calificaciones de RAM Informática en Google"
                    width={420}
                    height={276}
                    className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute right-2 bottom-2 rounded-md bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white">
                    Ver en Google
                  </div>
                </div>
              </a>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-3 text-[11px] font-bold tracking-wide text-primary uppercase">
                Identidad visual · evolución de logos
              </div>
              <LogoEvolutionGallery
                logos={[
                  {
                    label: "2008 · Primer logo",
                    src: "/nosotros/logo-ram-2008.jpg",
                    alt: "Primer logo de RAM Informática, 2008",
                    thumbBgClassName: "bg-white",
                    modalBgClassName: "bg-white",
                  },
                  {
                    label: "2021 · Etapa intermedia",
                    src: "/nosotros/logo-ram-neon.png",
                    alt: "Logo intermedio de RAM Informática, 2021",
                    thumbBgClassName: "bg-black",
                    modalBgClassName: "bg-black",
                  },
                  {
                    label: "2026 · Logo actual",
                    src: "/nosotros/logo-ram-2026.jpg",
                    alt: "Logo actual de RAM Informática, 2026",
                    thumbBgClassName: "bg-white",
                    modalBgClassName: "bg-white",
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
