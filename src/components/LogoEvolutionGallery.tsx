"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type LogoItem = {
  label: string;
  src: string;
  alt: string;
  thumbBgClassName?: string;
  modalBgClassName?: string;
};

type LogoEvolutionGalleryProps = {
  logos: LogoItem[];
};

export default function LogoEvolutionGallery({ logos }: LogoEvolutionGalleryProps) {
  const [selectedLogo, setSelectedLogo] = useState<LogoItem | null>(null);

  useEffect(() => {
    if (!selectedLogo) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedLogo(null);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedLogo]);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {logos.map((logo) => (
          <button
            type="button"
            key={logo.src}
            onClick={() => setSelectedLogo(logo)}
            className="rounded-lg border border-border-soft bg-background/30 p-3 text-left transition-colors hover:border-primary/40"
          >
            <div className="mb-2 text-[11px] font-semibold text-muted uppercase">
              {logo.label}
            </div>
            <div
              className={`relative h-24 overflow-hidden rounded-md border border-border-soft ${logo.thumbBgClassName ?? "bg-white"}`}
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                fill
                className="object-contain p-2"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </button>
        ))}
      </div>

      {selectedLogo ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedLogo(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada del logo"
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-md bg-white/90 px-3 py-2 text-xs font-semibold text-black"
            onClick={() => setSelectedLogo(null)}
          >
            Cerrar
          </button>
          <div
            className={`rounded-xl border border-white/20 p-4 ${selectedLogo.modalBgClassName ?? "bg-white"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={selectedLogo.src}
              alt={selectedLogo.alt}
              width={1400}
              height={900}
              className="h-auto max-h-[82vh] w-auto max-w-[94vw] object-contain"
              sizes="94vw"
              priority
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
