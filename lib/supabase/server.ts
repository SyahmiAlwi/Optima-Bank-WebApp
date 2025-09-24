import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Works whether cookies() is sync or async in your env.
 * We always "await" a possibly-promise cookie store.
 */
async function getCookieStore() {
  const storeOrPromise = (cookies() as any);
  return typeof storeOrPromise?.then === "function"
    ? await storeOrPromise
    : storeOrPromise;
}

export const supabaseServer = async () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Read a single cookie
        async get(name: string) {
          const store = await getCookieStore();
          return store.get(name)?.value;
        },
        // Set a cookie (will no-op in read-only contexts)
        async set(name: string, value: string, options?: any) {
          try {
            const store = await getCookieStore();
            store.set(name, value, options);
          } catch {
            /* read-only context (e.g., server component) */
          }
        },
        // Remove a cookie
        async remove(name: string, options?: any) {
          try {
            const store = await getCookieStore();
            store.delete(name, options);
          } catch {
            /* read-only context */
          }
        },
      },
    }
  );
};
