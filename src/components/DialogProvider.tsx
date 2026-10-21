"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

type NoticeOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
};

type DialogApi = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  notice: (options: NoticeOptions | string) => Promise<void>;
};

const DialogContext = createContext<DialogApi | null>(null);

type PendingConfirm = ConfirmOptions & {
  kind: "confirm";
  resolve: (value: boolean) => void;
};

type PendingNotice = NoticeOptions & {
  kind: "notice";
  resolve: () => void;
};

type Pending = PendingConfirm | PendingNotice;

export function DialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const titleId = useId();
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ kind: "confirm", ...options, resolve });
    });
  }, []);

  const notice = useCallback((options: NoticeOptions | string) => {
    const opts =
      typeof options === "string" ? { message: options } : options;
    return new Promise<void>((resolve) => {
      setPending({ kind: "notice", ...opts, resolve });
    });
  }, []);

  const api = useMemo(() => ({ confirm, notice }), [confirm, notice]);

  useEffect(() => {
    if (!pending) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (pending.kind === "confirm") {
          pending.resolve(false);
        } else {
          pending.resolve();
        }
        setPending(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [pending]);

  const closeConfirm = (value: boolean) => {
    if (pending?.kind !== "confirm") return;
    pending.resolve(value);
    setPending(null);
  };

  const closeNotice = () => {
    if (pending?.kind !== "notice") return;
    pending.resolve();
    setPending(null);
  };

  return (
    <DialogContext.Provider value={api}>
      {children}
      {pending && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className="mb-2 text-lg font-bold text-foreground">
              {pending.title ??
                (pending.kind === "confirm" ? "Confirmar" : "Aviso")}
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-muted">
              {pending.message}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              {pending.kind === "confirm" ? (
                <>
                  <button
                    type="button"
                    onClick={() => closeConfirm(false)}
                    className="cursor-pointer rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-semibold"
                  >
                    {pending.cancelLabel ?? "Cancelar"}
                  </button>
                  <button
                    ref={confirmBtnRef}
                    type="button"
                    onClick={() => closeConfirm(true)}
                    className={`cursor-pointer rounded-lg border-none px-4 py-2.5 text-sm font-bold !text-white ${
                      pending.tone === "danger"
                        ? "bg-sale"
                        : "bg-primary"
                    }`}
                  >
                    {pending.confirmLabel ?? "Confirmar"}
                  </button>
                </>
              ) : (
                <button
                  ref={confirmBtnRef}
                  type="button"
                  onClick={closeNotice}
                  className="cursor-pointer rounded-lg border-none bg-primary px-4 py-2.5 text-sm font-bold !text-white"
                >
                  {pending.confirmLabel ?? "Entendido"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog debe usarse dentro de DialogProvider");
  }
  return ctx;
}
