"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Prefer PKCE/code flow if present
        const hasCodeParams = typeof window !== "undefined" && (window.location.search.includes("code=") || window.location.search.includes("access_token="));
        if (hasCodeParams) {
          await supabase.auth.exchangeCodeForSession(window.location.href);
          router.replace("/home");
          return;
        }

        // Handle hash-based implicit flow fallback
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        if (hash && hash.includes("access_token") && hash.includes("refresh_token")) {
          const params = new URLSearchParams(hash.replace(/^#/, ""));
          const access_token = params.get("access_token") ?? undefined;
          const refresh_token = params.get("refresh_token") ?? undefined;
          const expires_in_str = params.get("expires_in") ?? undefined;

          if (access_token && refresh_token) {
            const expires_in = expires_in_str ? parseInt(expires_in_str, 10) : undefined;
            await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            router.replace("/home");
            return;
          }
        }

        // If nothing matched, go to auth
        router.replace("/auth");
      } catch {
        router.replace("/auth");
      }
    };

    handleOAuthCallback();
  }, [router, supabase]);

  return (
    <div className="h-svh flex items-center justify-center bg-[linear-gradient(to_right,#e2e2e2,#c9d6ff)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#512da8] mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you in…</p>
      </div>
    </div>
  );
}


