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
        console.log("Auth callback started");
        console.log("Current URL:", window.location.href);
        console.log("Hash:", window.location.hash);
        console.log("Search:", window.location.search);

        // Check for hash-based tokens first (implicit flow)
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        if (hash && hash.includes("access_token") && hash.includes("refresh_token")) {
          console.log("Processing hash-based tokens");
          const params = new URLSearchParams(hash.replace(/^#/, ""));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          
          console.log("Access token found:", !!access_token);
          console.log("Refresh token found:", !!refresh_token);
          
          if (access_token && refresh_token) {
            console.log("Setting session with tokens");
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            
            if (error) {
              console.error("Auth error:", error);
              router.replace("/auth");
              return;
            }
            
            console.log("Session set successfully:", data);
            router.replace("/home");
            return;
          }
        }

        // Check for code flow in URL search params
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        
        if (code) {
          console.log("Processing code flow");
          const { data, error } = await supabase.auth.exchangeCodeForSession({
            code,
            code_verifier: sessionStorage.getItem("code_verifier") || undefined,
          });
          
          if (error) {
            console.error("Code exchange error:", error);
            router.replace("/auth");
            return;
          }
          
          console.log("Code exchange successful:", data);
          router.replace("/home");
          return;
        }

        console.log("No valid auth flow detected, redirecting to auth");
        // If nothing matched, go to auth
        router.replace("/auth");
      } catch (error) {
        console.error("Auth callback error:", error);
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


