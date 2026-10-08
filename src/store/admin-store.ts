"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { isRamAdmin } from "@/lib/auth-helpers";
import { useAuthStore } from "@/store/auth-store";

type AdminState = {
  isAuthenticated: boolean;
  loading: boolean;
  hydrated: boolean;
  init: () => Promise<void>;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  setFromUser: (isAdmin: boolean) => void;
};

export const useAdminStore = create<AdminState>((set) => ({
  isAuthenticated: false,
  loading: false,
  hydrated: false,
  setFromUser: (isAdmin) => set({ isAuthenticated: isAdmin, hydrated: true }),
  init: async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const ok = Boolean(data.user && isRamAdmin(data.user.app_metadata));
    set({ isAuthenticated: ok, hydrated: true });
  },
  login: async (email, password) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      return { ok: false, error: "Email o contraseña incorrectos." };
    }

    await supabase.auth.refreshSession();
    const { data: again } = await supabase.auth.getUser();
    if (!again.user || !isRamAdmin(again.user.app_metadata)) {
      await supabase.auth.signOut();
      useAuthStore.getState().setUserFromSession(null);
      return {
        ok: false,
        error: "Esta cuenta no tiene permisos de administrador RAM Informatica.",
      };
    }

    useAuthStore.getState().setUserFromSession(again.user);
    set({ isAuthenticated: true, hydrated: true });
    return { ok: true };
  },
  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().setUserFromSession(null);
    set({ isAuthenticated: false });
  },
}));

export const ADMIN_CREDENTIALS_HINT = {
  email: "raminformatik@gmail.com",
};
