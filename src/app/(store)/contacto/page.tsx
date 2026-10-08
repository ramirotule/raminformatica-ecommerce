import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";
import { ContactWhatsAppCard } from "./ContactWhatsAppCard";

export const metadata: Metadata = {
  title: "Contacto — RAM Informatica",
  description:
    "Escribinos: consultas, stock, envios o asesoramiento. RAM Informatica, Santa Rosa, La Pampa.",
};

export default function ContactoPage() {
  return (
    <div className="py-10 md:py-14">
      <div className="mb-8 max-w-[40rem]">
        <p className="mb-3 text-[13px] font-bold tracking-wider text-primary uppercase">
          Contacto
        </p>
        <h1 className="mb-3 text-[32px] leading-tight font-bold tracking-tight md:text-[40px]">
          Hablemos.
        </h1>
        <p className="text-[15px] leading-relaxed text-muted md:text-base">
          Consultas de stock, envíos o qué equipo te conviene. El mensaje llega
          directo a nuestro mail y te respondemos a la brevedad.
        </p>
      </div>

      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-start md:gap-14">
        <div className="space-y-5 text-[14.5px] leading-relaxed text-body-text">
          <p>
            Completá el formulario y te llega un mail a{" "}
            <span className="font-semibold text-foreground">
              raminformatik@gmail.com
            </span>
            . Si preferis chat, escribinos por WhatsApp al 2954227622.
          </p>
          <ContactWhatsAppCard />
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
