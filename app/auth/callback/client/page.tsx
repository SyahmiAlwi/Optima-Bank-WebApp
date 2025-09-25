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
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          router.replace("/auth");
          return;
        }
        
        if (!session?.user) {
          console.error("No session or user");
          router.replace("/auth");
          return;
        }
        
        console.log("Session found:", session.user.email);
        
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
