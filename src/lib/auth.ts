import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/env";

export const getCurrentUser = cache(async () => {
  if (!isConfigured.supabase()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

export type AdminContext = {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  role: "owner" | "admin" | "staff";
  supabase: Awaited<ReturnType<typeof createClient>>;
};

/** Resolves the admin role from the server-managed admin_users allowlist. */
export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("admin_users").select("role").eq("user_id", user.id).maybeSingle();
  if (!data) return null;
  return { user, role: data.role as AdminContext["role"], supabase };
});

export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) {
    const user = await getCurrentUser();
    redirect(user ? "/admin/login?error=not_admin" : "/admin/login");
  }
  return ctx;
}

export async function requireUser(next = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}
