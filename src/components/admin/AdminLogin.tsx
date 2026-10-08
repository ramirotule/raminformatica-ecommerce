"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { PasswordInput } from "@/components/PasswordInput";
import { useAdminStore } from "@/store/admin-store";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary";

export function AdminLogin() {
  const login = useAdminStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.ok) setError(result.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-[420px] rounded-xl border border-border bg-surface p-7">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-xl font-bold">Admin RAM Informatica</h1>
          <p className="mt-1 text-sm text-muted">
            Acceso con tu usuario de Supabase (rol admin RAM Informatica)
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
            autoComplete="username"
          />
          <PasswordInput
            value={password}
            onChange={setPassword}
            required
            autoComplete="current-password"
          />
          {error && (
            <div className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-[13px] font-medium text-sale">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 cursor-pointer rounded-[9px] border-none bg-primary py-3.5 text-[14.5px] font-bold !text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar al panel"}
          </button>
        </form>
      </div>
    </div>
  );
}
