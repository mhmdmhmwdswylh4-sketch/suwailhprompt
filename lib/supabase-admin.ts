import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export const isDbConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Server-only Supabase client (service role). It bypasses RLS, so EVERY query made with it
 * must be scoped by the `firebase_uid` of a server-verified Firebase token — never by client input.
 */
export function getDb(): SupabaseClient {
  if (!isDbConfigured()) throw new Error("db-not-configured");
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (i, init) => fetch(i, { ...init, cache: "no-store" }) },
    });
  }
  return client;
}
