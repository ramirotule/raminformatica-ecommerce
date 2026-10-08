import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Envios — RAM Informatica",
  description:
    "Informacion sobre envios: a cargo del comprador. RAM Informatica no se responsabiliza por perdida o rotura durante el transporte.",
};

export default function EnviosPage() {
  return (
    <div className="flex flex-col py-6 md:min-h-[calc(100dvh-11rem)] md:justify-center md:py-8">
      <div className="mb-5 max-w-[42rem] md:mb-6">
        <p className="mb-1.5 text-[12px] font-bold tracking-wider text-primary uppercase">
          Envíos
        </p>
        <h1 className="mb-1.5 text-[26px] leading-tight font-bold tracking-tight md:text-[32px]">
          Política de envíos.
        </h1>
        <p className="text-[14px] leading-snug text-muted md:text-[15px]">
          Enviamos a todo el país. Antes de confirmar tu compra, leé estas
          condiciones.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 text-[13.5px] leading-snug text-body-text sm:grid-cols-2 sm:gap-4 md:text-[14px]">
        <section className="rounded-xl border border-border bg-surface px-4 py-4 md:px-5 md:py-4">
          <h2 className="mb-2 text-[13px] font-bold text-foreground md:text-[14px]">
            A cargo del comprador
          </h2>
          <p>
            <strong className="text-foreground">
              Todos los envíos, sin excepción, son a cuenta y orden del
              comprador.
            </strong>{" "}
            El flete, el transporte y cualquier gestión del envío corren por
            cuenta del cliente.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-surface px-4 py-4 md:px-5 md:py-4">
          <h2 className="mb-2 text-[13px] font-bold text-foreground md:text-[14px]">
            Responsabilidad en el transporte
          </h2>
          <p>
            Cuando el pedido sale de nuestro depósito,{" "}
            <strong className="text-foreground">
              RAM Informatica no se responsabiliza por perdida, robo, demora, dano o
              rotura
            </strong>{" "}
            durante el trayecto. Los reclamos se gestionan con la transportista.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-surface px-4 py-4 md:px-5 md:py-4">
          <h2 className="mb-2 text-[13px] font-bold text-foreground md:text-[14px]">
            Recomendaciones
          </h2>
          <ul className="list-disc space-y-1.5 pl-4">
            <li>Confirmá dirección y teléfono antes de comprar.</li>
            <li>
              Si hay seguro u embalaje extra del transportista, es opcional y a
              cargo tuyo.
            </li>
            <li>
              Revisá el paquete al recibirlo y dejá constancia si hay daños.
            </li>
          </ul>
        </section>

        <section className="flex flex-col justify-between rounded-xl border border-border bg-surface px-4 py-4 md:px-5 md:py-4">
          <div>
            <h2 className="mb-2 text-[13px] font-bold text-foreground md:text-[14px]">
              ¿Dudas sobre tu envío?
            </h2>
            <p className="mb-3">
              Si necesitás coordinar un envío o consultarnos antes de comprar,
              escribinos.
            </p>
          </div>
          <Link
            href="/contacto"
            className="inline-flex w-fit cursor-pointer rounded-[9px] border-none bg-primary px-4 py-2.5 text-[13px] font-bold !text-white no-underline hover:!no-underline"
          >
            Ir a Contacto
          </Link>
        </section>
      </div>
    </div>
  );
}
