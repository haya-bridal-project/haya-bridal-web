import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/** Per-request Supabase client bound to the visitor's auth cookies (RLS applies). */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = env.supabase();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component; the proxy refreshes sessions.
        }
      },
    },
  });
}

/** Cookie-less public client for cacheable public reads (RLS applies as anon). */
export function createPublicClient() {
  const { url, key } = env.supabase();
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Service-role client. Bypasses RLS — use ONLY in trusted server code paths
 * (payment verification, webhooks, email logs) after authorization checks.
 */
export function createServiceClient() {
  const { url } = env.supabase();
  return createSupabaseClient(url, env.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
