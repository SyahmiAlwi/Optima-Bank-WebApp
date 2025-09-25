import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Works whether cookies() is sync or async in your env.
 * We always "await" a possibly-promise cookie store.
 */
type CookieStore = Awaited<ReturnType<typeof cookies>>;

function isPromise<T>(value: unknown): value is Promise<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    // Check for a thenable without using any
    typeof (value as { then?: unknown }).then === "function"
  );
}

async function getCookieStore(): Promise<CookieStore> {
  const storeOrPromise: CookieStore | Promise<CookieStore> = cookies() as CookieStore | Promise<CookieStore>;
  return isPromise<CookieStore>(storeOrPromise)
    ? await storeOrPromise
    : storeOrPromise;
}

export const supabaseServer = async () => {
  // Shape compatible with Supabase SSR cookies contract
  type CookieMethods = {
    get(name: string): string | undefined | Promise<string | undefined>
    set(name: string, value: string, options?: CookieOptions): void | Promise<void>
    remove(name: string, options?: CookieOptions): void | Promise<void>
  }

  const cookieMethods: CookieMethods = {
    async get(name: string) {
      const store = await getCookieStore();
      return store.get(name)?.value;
    },
    async set(name: string, value: string, options?: CookieOptions) {
      try {
        const store = await getCookieStore();
        // next/headers cookies().set supports object form
        store.set({ name, value, ...(options ?? {}) });
      } catch {
        /* read-only context (e.g., server component) */
      }
    },
    async remove(name: string, options?: CookieOptions) {
      try {
        const store = await getCookieStore();
        // Prefer delete if available, otherwise overwrite with empty value
        const maybeDelete: unknown = (store as unknown as { delete?: unknown }).delete;
        if (typeof maybeDelete === "function") {
          (maybeDelete as (n: string, o?: CookieOptions) => void)(name, options);
        } else {
          store.set({ name, value: "", ...(options ?? {}) });
        }
      } catch {
        /* read-only context */
      }
    },
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieMethods,
    }
  );
};
