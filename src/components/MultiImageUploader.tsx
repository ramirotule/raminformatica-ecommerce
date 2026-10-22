"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { uploadImageAsWebp } from "@/lib/supabase/storage";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
  className?: string;
};

export function MultiImageUploader({
  value,
  onChange,
  folder = "products",
  label = "Imágenes",
  className = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setUploading(true);
    try {
      const next = [...value];
      for (const file of Array.from(files)) {
        const uploaded = await uploadImageAsWebp(file, folder);
        next.push(uploaded.publicUrl);
      }
      onChange([...new Set(next)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const moveToFront = (index: number) => {
    if (index === 0) return;
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onChange(next);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label ? (
        <div className="text-[12.5px] font-semibold text-muted">{label}</div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void onPick(e.target.files)}
      />

      <div className="flex flex-wrap gap-2.5">
        {value.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="group relative h-28 w-28 overflow-hidden rounded-lg border border-border bg-white"
          >
            {/^https?:\/\//i.test(src) ? (
              <img
                src={src}
                alt={`Foto ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-contain"
              />
            ) : (
              <Image
                src={src}
                alt={`Foto ${i + 1}`}
                fill
                sizes="112px"
                className="object-contain"
                style={{ objectFit: "contain" }}
              />
            )}
            <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-foreground/75 p-1 opacity-0 transition-opacity group-hover:opacity-100">
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => moveToFront(i)}
                  className="flex-1 cursor-pointer rounded border-none bg-white/15 px-1 py-0.5 text-[10px] font-semibold text-white"
                >
                  Portada
                </button>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="flex-1 cursor-pointer rounded border-none bg-white/15 px-1 py-0.5 text-[10px] font-semibold text-white"
              >
                Quitar
              </button>
            </div>
            {i === 0 && (
              <span className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                Portada
              </span>
            )}
          </div>
        ))}

        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-accent-soft text-center outline-none transition-colors hover:border-primary disabled:opacity-60"
        >
          <span className="text-lg leading-none text-muted">
            {uploading ? "…" : "+"}
          </span>
          <span className="px-2 text-[11px] font-semibold text-muted">
            {uploading ? "Subiendo…" : "Agregar"}
          </span>
        </button>
      </div>

      <p className="text-[12px] text-muted-soft">
        Podés subir varias. La primera es la portada del catálogo.
      </p>
      {error && (
        <p className="text-[12.5px] font-medium text-sale">{error}</p>
      )}
    </div>
  );
}
