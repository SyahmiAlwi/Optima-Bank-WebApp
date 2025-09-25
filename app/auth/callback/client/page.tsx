"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

// Function to create user profile if it doesn't exist
async function createUserProfile(user: { id: string; email?: string }) {
  try {
    const supabase = supabaseBrowser();
    
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();
    
    if (!existingProfile) {
      // Create new profile
      const { error } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          totalpoints: 0,
          is_admin: false,
          created_at: new Date().toISOString(),
        });
      
      if (error) {
        console.error("Error creating user profile:", error);
      } else {
        console.log("User profile created successfully");
      }
    }
  } catch (error) {
    console.error("Error in createUserProfile:", error);
  }
}

export default function AuthCallbackClientPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log("Client auth callback started");
        // First, attempt to exchange the code on the client. This covers cases
        // where the flow was started on the client and the flow state is stored client-side.
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(window.location.href)
        if (exchangeErr) {
          console.warn("Client exchangeCodeForSession warning:", exchangeErr)
        }

        // Now try to get the current session immediately
        let { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // If session not ready yet, wait for auth state change or timeout
        if (!session?.user) {
          const sessionAfterEvent = await new Promise<import("@supabase/supabase-js").Session | null>((resolve) => {
            const timeout = setTimeout(async () => {
              const { data } = await supabase.auth.getSession()
              resolve(data.session ?? null)
            }, 2000)
            const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
              if (s?.user) {
                clearTimeout(timeout)
                sub.subscription.unsubscribe()
                resolve(s)
              }
            })
          })
          if (sessionAfterEvent?.user) {
            session = sessionAfterEvent
            sessionError = null as any
          }
        }
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          router.replace("/auth");
          return;
        }
        
        if (!session?.user) {
          console.error("No session or user after exchange/wait");
          // Last resort: POST tokens to server to sync cookies for server actions
          const { data: tokenData } = await supabase.auth.getSession()
          if (tokenData.session?.access_token && tokenData.session?.refresh_token) {
            try {
              await fetch("/auth/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  access_token: tokenData.session.access_token,
                  refresh_token: tokenData.session.refresh_token,
                }),
              })
              // try once more then redirect
              const { data: final } = await supabase.auth.getSession()
              if (final.session?.user) {
                session = final.session
              }
            } catch {}
          }
          if (!session?.user) {
            router.replace("/auth?error=no-session");
            return;
          }
        }
        
        console.log("Session found:", session.user.email);

        // Ensure server session cookies are synced for server actions
        try {
          await fetch("/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }),
          })
        } catch {}

        // Create user profile if it doesn't exist
        await createUserProfile(session.user);
        
        // Check admin status and redirect
        try {
          const { data: prof } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", session.user.id)
            .single();
          
          const dest = prof?.is_admin ? "/admin" : "/home";
          console.log("Redirecting to:", dest);
          
          // Use window.location.href to ensure a full page reload
          // This ensures server actions can access the session cookies
          window.location.href = dest;
        } catch (e) {
          console.error("Error checking admin status:", e);
          window.location.href = "/home";
        }
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
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
