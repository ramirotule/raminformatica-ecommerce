import type { User } from "@supabase/supabase-js";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  provider: "email" | "google";
};

export function mapAuthUser(user: User | null): AuthUser | null {
  if (!user?.email) return null;
  const provider =
    user.app_metadata?.provider === "google" ||
    user.identities?.some((i) => i.provider === "google")
      ? "google"
      : "email";
  return {
    id: user.id,
    email: user.email,
    name:
      (user.user_metadata?.name as string | undefined) ||
      user.email.split("@")[0],
    provider,
  };
}

export function isRamAdmin(appMeta: Record<string, unknown> | undefined) {
  return appMeta?.ram_role === "admin";
}
