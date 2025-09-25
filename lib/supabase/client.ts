// ✅ Unified, conflict-free supabaseBrowser()
import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export const supabaseBrowser = (): SupabaseClient => {
  if (_client) return _client;

  // Prefer the Next.js-aware browser client; fall back to createClient if not in a browser
  const factory =
    typeof window === "undefined" ? createClient : createBrowserClient;

  _client = factory(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: "optima-auth", // avoid collisions across multiple instances
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    },
  );

  return _client;
};
