import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getFirebaseAuth } from "./firebase";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

let client: SupabaseClient | null = null;

/**
 * Supabase client that authenticates with the current user's Firebase ID token
 * (Supabase "Third-party auth" -> Firebase). Row Level Security does the rest.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        accessToken: async () => (await getFirebaseAuth()?.currentUser?.getIdToken()) ?? null,
      },
    );
  }
  return client;
}

export type SavedPrompt = {
  id: string;
  original_prompt: string;
  optimized_prompt: string;
  category: string;
  created_at: string;
};
