"use client";

import {
  useEffect,
  type FormEventHandler,
  type ReactNode,
  type Ref,
} from "react";

const MAX_WIDTH = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
} as const;

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
  maxWidth?: keyof typeof MAX_WIDTH;
  formRef?: Ref<HTMLFormElement>;
};

export function AdminFormModal({
  open,
  title,
  onClose,
  onSubmit,
  children,
  maxWidth = "xl",
  formRef,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/45 p-4 sm:p-6"
      role="presentation"
    >
      <form
        ref={formRef}
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className={`my-2 w-full ${MAX_WIDTH[maxWidth]} rounded-xl border border-border bg-surface p-5 shadow-lg`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-form-modal-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div id="admin-form-modal-title" className="text-sm font-bold">
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-transparent text-muted hover:bg-accent-soft hover:text-foreground"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M5 5l10 10M15 5 5 15" />
            </svg>
          </button>
        </div>
        {children}
      </form>
    </div>
  );
}
